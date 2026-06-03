using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
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

        private string GerarToken(UsuarioSistema usuario, DateTime expiraEmUtc)
        {
            var key = _configuration["Jwt:Key"];

            if (string.IsNullOrWhiteSpace(key) || key.Length < 32)
            {
                throw new InvalidOperationException("Jwt:Key precisa ter pelo menos 32 caracteres.");
            }

            var issuer = _configuration["Jwt:Issuer"] ?? "PetApp";
            var audience = _configuration["Jwt:Audience"] ?? "PetAppFrontend";

            var claims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
                new(ClaimTypes.Name, usuario.NomeUsuario),
                new("nome", usuario.Nome)
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

        private static UsuarioSistemaReadDto MapToReadDto(UsuarioSistema usuario)
        {
            return new UsuarioSistemaReadDto
            {
                Id = usuario.Id,
                NomeUsuario = usuario.NomeUsuario,
                Nome = usuario.Nome,
                Ativo = usuario.Ativo,
                CriadoEmUtc = usuario.CriadoEmUtc,
                AtualizadoEmUtc = usuario.AtualizadoEmUtc
            };
        }

        private static string NormalizarNomeUsuario(string nomeUsuario)
        {
            return nomeUsuario.Trim().ToUpperInvariant();
        }
    }
}
