using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetApp.Models;
using PetApp.Models.Dtos;

namespace PetApp.Controllers
{
    [ApiController]
    [Authorize(Policy = "Administrador")]
    [Route("api/[controller]")]
    public class UsuariosController : ControllerBase
    {
        private readonly PetAppContext _context;

        public UsuariosController(PetAppContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<UsuarioSistemaReadDto>>> GetUsuarios()
        {
            var usuarios = await _context.UsuariosSistema
                .AsNoTracking()
                .OrderBy(u => u.NomeUsuario)
                .Select(u => new UsuarioSistemaReadDto
                {
                    Id = u.Id,
                    NomeUsuario = u.NomeUsuario,
                    Nome = u.Nome,
                    PerfilAcesso = u.PerfilAcesso,
                    Ativo = u.Ativo,
                    CriadoEmUtc = u.CriadoEmUtc,
                    AtualizadoEmUtc = u.AtualizadoEmUtc
                })
                .ToListAsync();

            return Ok(usuarios);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<UsuarioSistemaReadDto>> GetUsuario(int id)
        {
            var usuario = await _context.UsuariosSistema
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == id);

            if (usuario == null)
            {
                return NotFound();
            }

            return Ok(MapToReadDto(usuario));
        }

        [HttpPost]
        public async Task<ActionResult<UsuarioSistemaReadDto>> CreateUsuario([FromBody] UsuarioSistemaCreateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.NomeUsuario))
            {
                ModelState.AddModelError(nameof(dto.NomeUsuario), "Usuário é obrigatório.");
                return BadRequest(ModelState);
            }

            if (string.IsNullOrWhiteSpace(dto.Nome))
            {
                ModelState.AddModelError(nameof(dto.Nome), "Nome é obrigatório.");
                return BadRequest(ModelState);
            }

            if (!SenhaAtendePolitica(dto.Senha))
            {
                ModelState.AddModelError(nameof(dto.Senha), ObterMensagemSenhaInvalida());
                return BadRequest(ModelState);
            }

            var perfilAcesso = NormalizarPerfilAcesso(dto.PerfilAcesso);

            var nomeUsuario = dto.NomeUsuario.Trim();
            var nomeUsuarioNormalizado = NormalizarNomeUsuario(nomeUsuario);

            var existe = await _context.UsuariosSistema
                .AnyAsync(u => u.NomeUsuarioNormalizado == nomeUsuarioNormalizado);

            if (existe)
            {
                ModelState.AddModelError(nameof(dto.NomeUsuario), "Já existe um usuário com esse login.");
                return BadRequest(ModelState);
            }

            var usuario = new UsuarioSistema
            {
                NomeUsuario = nomeUsuario,
                NomeUsuarioNormalizado = nomeUsuarioNormalizado,
                Nome = dto.Nome.Trim(),
                SenhaHash = string.Empty,
                PerfilAcesso = perfilAcesso,
                Ativo = dto.Ativo,
                CriadoEmUtc = DateTime.UtcNow
            };

            var hasher = new PasswordHasher<UsuarioSistema>();
            usuario.SenhaHash = hasher.HashPassword(usuario, dto.Senha);

            _context.UsuariosSistema.Add(usuario);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetUsuario), new { id = usuario.Id }, MapToReadDto(usuario));
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateUsuario(int id, [FromBody] UsuarioSistemaUpdateDto dto)
        {
            if (id != dto.Id)
            {
                return BadRequest("Id do caminho não corresponde ao do corpo da requisição.");
            }

            if (string.IsNullOrWhiteSpace(dto.NomeUsuario))
            {
                ModelState.AddModelError(nameof(dto.NomeUsuario), "Usuário é obrigatório.");
                return BadRequest(ModelState);
            }

            if (string.IsNullOrWhiteSpace(dto.Nome))
            {
                ModelState.AddModelError(nameof(dto.Nome), "Nome é obrigatório.");
                return BadRequest(ModelState);
            }

            var usuario = await _context.UsuariosSistema.FindAsync(id);

            if (usuario == null)
            {
                return NotFound();
            }

            var perfilAcesso = NormalizarPerfilAcesso(dto.PerfilAcesso);

            if (usuario.Ativo &&
                usuario.PerfilAcesso == "Administrador" &&
                (!dto.Ativo || perfilAcesso != "Administrador"))
            {
                var existeOutroAdministradorAtivo = await _context.UsuariosSistema
                    .AnyAsync(u =>
                        u.Id != id &&
                        u.Ativo &&
                        u.PerfilAcesso == "Administrador");

                if (!existeOutroAdministradorAtivo)
                {
                    return BadRequest(new
                    {
                        erro = "Não é possível remover, desativar ou alterar o perfil do único administrador ativo do sistema. Crie ou ative outro administrador antes."
                    });
                }
            }

            var nomeUsuario = dto.NomeUsuario.Trim();
            var nomeUsuarioNormalizado = NormalizarNomeUsuario(nomeUsuario);

            var existeOutro = await _context.UsuariosSistema
                .AnyAsync(u => u.Id != id && u.NomeUsuarioNormalizado == nomeUsuarioNormalizado);

            if (existeOutro)
            {
                ModelState.AddModelError(nameof(dto.NomeUsuario), "Já existe outro usuário com esse login.");
                return BadRequest(ModelState);
            }

            usuario.NomeUsuario = nomeUsuario;
            usuario.NomeUsuarioNormalizado = nomeUsuarioNormalizado;
            usuario.Nome = dto.Nome.Trim();
            usuario.PerfilAcesso = perfilAcesso;
            usuario.Ativo = dto.Ativo;
            usuario.AtualizadoEmUtc = DateTime.UtcNow;

            if (!string.IsNullOrWhiteSpace(dto.NovaSenha))
            {
                if (!SenhaAtendePolitica(dto.NovaSenha))
                {
                    ModelState.AddModelError(nameof(dto.NovaSenha), ObterMensagemSenhaInvalida());
                    return BadRequest(ModelState);
                }

                var hasher = new PasswordHasher<UsuarioSistema>();
                usuario.SenhaHash = hasher.HashPassword(usuario, dto.NovaSenha);
            }

            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteUsuario(int id)
        {
            var usuario = await _context.UsuariosSistema.FindAsync(id);

            if (usuario == null)
            {
                return NotFound();
            }

            if (usuario.Ativo && usuario.PerfilAcesso == "Administrador")
            {
                var existeOutroAdministradorAtivo = await _context.UsuariosSistema
                    .AnyAsync(u =>
                        u.Id != id &&
                        u.Ativo &&
                        u.PerfilAcesso == "Administrador");

                if (!existeOutroAdministradorAtivo)
                {
                    return BadRequest(new
                    {
                        erro = "Não é possível excluir o único administrador ativo do sistema. Crie ou ative outro administrador antes."
                    });
                }
            }

            _context.UsuariosSistema.Remove(usuario);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private static bool SenhaAtendePolitica(string? senha)
        {
            if (string.IsNullOrWhiteSpace(senha) || senha.Length < 6)
            {
                return false;
            }

            var temMaiuscula = senha.Any(char.IsUpper);
            var temMinuscula = senha.Any(char.IsLower);
            var temDigito = senha.Any(char.IsDigit);
            var temEspecial = senha.Any(c => !char.IsLetterOrDigit(c));

            return temMaiuscula && temMinuscula && temDigito && temEspecial;
        }

        private static string ObterMensagemSenhaInvalida()
        {
            return "A senha deve ter pelo menos 6 caracteres, contendo letra maiúscula, letra minúscula, número e caractere especial.";
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
