using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using PetApp.Models;
using PetApp.Models.Dtos;

namespace PetApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly PetAppContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(PetAppContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginRequestDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var nomeUsuarioNormalizado = NormalizarNomeUsuario(dto.NomeUsuario);

            var usuario = await _context.UsuariosSistema
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.NomeUsuarioNormalizado == nomeUsuarioNormalizado);

            if (usuario == null || !usuario.Ativo)
            {
                return Unauthorized(new { erro = "Usuário ou senha inválidos." });
            }

            var hasher = new PasswordHasher<UsuarioSistema>();
            var resultado = hasher.VerifyHashedPassword(usuario, usuario.SenhaHash, dto.Senha);

            if (resultado == PasswordVerificationResult.Failed)
            {
                return Unauthorized(new { erro = "Usuário ou senha inválidos." });
            }

            var expiraEmUtc = DateTime.UtcNow.AddHours(
                _configuration.GetValue<int?>("Jwt:ExpirationHours") ?? 8
            );

            var token = GerarToken(usuario, expiraEmUtc);

            await RegistrarLoginAsync(usuario);

            return Ok(new LoginResponseDto
            {
                Token = token,
                ExpiraEmUtc = expiraEmUtc,
                Usuario = MapToReadDto(usuario)
            });
        }

        [HttpGet("me")]
        public async Task<ActionResult<UsuarioSistemaReadDto>> Me()
        {
            var idUsuario = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (!int.TryParse(idUsuario, out var id))
            {
                return Unauthorized();
            }

            var usuario = await _context.UsuariosSistema
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == id && u.Ativo);

            if (usuario == null)
            {
                return Unauthorized();
            }

            return Ok(MapToReadDto(usuario));
        }

        private async Task RegistrarLoginAsync(UsuarioSistema usuario)
        {
            _context.AuditoriasSistema.Add(new AuditoriaSistema
            {
                DataHoraUtc = DateTime.UtcNow,
                UsuarioId = usuario.Id,
                UsuarioNome = usuario.NomeUsuario,
                Acao = "LOGIN",
                Entidade = "Auth",
                EntidadeId = usuario.Id.ToString(),
                ValoresDepois = $"{{\"Evento\":\"Login realizado com sucesso\",\"PerfilAcesso\":\"{usuario.PerfilAcesso}\"}}",
                IpOrigem = ObterIpOrigem(HttpContext),
                UserAgent = HttpContext.Request.Headers.UserAgent.ToString()
            });

            await _context.SaveChangesAsync();
        }

        private static string? ObterIpOrigem(HttpContext? httpContext)
        {
            if (httpContext == null)
            {
                return null;
            }

            var headers = httpContext.Request.Headers;
            var candidatos = new List<string?>();

            if (headers.TryGetValue("CF-Connecting-IP", out var cfIp))
            {
                candidatos.Add(cfIp.FirstOrDefault());
            }

            if (headers.TryGetValue("X-Forwarded-For", out var xff))
            {
                candidatos.AddRange(
                    xff.ToString()
                        .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                );
            }

            if (headers.TryGetValue("X-Real-IP", out var realIp))
            {
                candidatos.Add(realIp.FirstOrDefault());
            }

            candidatos.Add(httpContext.Connection.RemoteIpAddress?.ToString());

            foreach (var candidato in candidatos)
            {
                var ip = NormalizarIp(candidato);

                if (string.IsNullOrWhiteSpace(ip))
                {
                    continue;
                }

                if (!EhIpDockerOuInterno(ip))
                {
                    return ip;
                }
            }

            return NormalizarIp(candidatos.FirstOrDefault(c => !string.IsNullOrWhiteSpace(c)));
        }

        private static string? NormalizarIp(string? ip)
        {
            if (string.IsNullOrWhiteSpace(ip))
            {
                return null;
            }

            ip = ip.Trim();

            if (ip.StartsWith("::ffff:", StringComparison.OrdinalIgnoreCase))
            {
                ip = ip.Replace("::ffff:", "", StringComparison.OrdinalIgnoreCase);
            }

            return ip;
        }

        private static bool EhIpDockerOuInterno(string ip)
        {
            if (!IPAddress.TryParse(ip, out var endereco))
            {
                return false;
            }

            if (IPAddress.IsLoopback(endereco))
            {
                return true;
            }

            if (endereco.AddressFamily != System.Net.Sockets.AddressFamily.InterNetwork)
            {
                return false;
            }

            var bytes = endereco.GetAddressBytes();

            if (bytes[0] == 10)
            {
                return true;
            }

            if (bytes[0] == 172 && bytes[1] >= 16 && bytes[1] <= 31)
            {
                return true;
            }

            if (bytes[0] == 192 && bytes[1] == 168)
            {
                return true;
            }

            return false;
        }

        private string GerarToken(UsuarioSistema usuario, DateTime expiraEmUtc)
        {
            var key = _configuration["Jwt:Key"];

            if (string.IsNullOrWhiteSpace(key) || key.Length < 32)
            {
                throw new InvalidOperationException("Jwt:Key precisa ter pelo menos 32 caracteres.");
            }

            var issuer = _configuration["Jwt:Issuer"] ?? "PetApp";
            var audience = _configuration["Jwt:Audience"] ?? "PetAppFrontend";

            var perfil = NormalizarPerfilAcesso(usuario.PerfilAcesso);
            var sessionStamp = ObterSessionStamp(usuario);

            var claims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
                new(ClaimTypes.Name, usuario.NomeUsuario),
                new(ClaimTypes.Role, perfil),
                new("nome", usuario.Nome),
                new("perfilAcesso", perfil),
                new("sessionStamp", sessionStamp)
            };

            var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
            var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                notBefore: DateTime.UtcNow,
                expires: expiraEmUtc,
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private static string ObterSessionStamp(UsuarioSistema usuario)
        {
            var dataBase = usuario.AtualizadoEmUtc ?? usuario.CriadoEmUtc;
            return dataBase.ToUniversalTime().Ticks.ToString();
        }

        private static UsuarioSistemaReadDto MapToReadDto(UsuarioSistema usuario)
        {
            return new UsuarioSistemaReadDto
            {
                Id = usuario.Id,
                NomeUsuario = usuario.NomeUsuario,
                Nome = usuario.Nome,
                PerfilAcesso = NormalizarPerfilAcesso(usuario.PerfilAcesso),
                Ativo = usuario.Ativo,
                CriadoEmUtc = usuario.CriadoEmUtc,
                AtualizadoEmUtc = usuario.AtualizadoEmUtc
            };
        }

        private static string NormalizarNomeUsuario(string nomeUsuario)
        {
            return nomeUsuario.Trim().ToUpperInvariant();
        }

        private static string NormalizarPerfilAcesso(string? perfil)
        {
            return perfil switch
            {
                "Administrador" => "Administrador",
                "Cadastro" => "Cadastro",
                "Leitura" => "Leitura",
                _ => "Leitura"
            };
        }
    }
}
