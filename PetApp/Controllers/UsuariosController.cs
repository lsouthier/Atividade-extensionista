using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetApp.Models;
using PetApp.Models.Dtos;

namespace PetApp.Controllers
{
    [ApiController]
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

            if (string.IsNullOrWhiteSpace(dto.Senha) || dto.Senha.Length < 4)
            {
                ModelState.AddModelError(nameof(dto.Senha), "Senha deve ter pelo menos 4 caracteres.");
                return BadRequest(ModelState);
            }

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

            if (usuario.Ativo && !dto.Ativo)
            {
                var totalUsuariosAtivos = await _context.UsuariosSistema
                    .CountAsync(u => u.Ativo);

                if (totalUsuariosAtivos <= 1)
                {
                    return BadRequest(new
                    {
                        erro = "Não é possível desativar o único usuário ativo do sistema. Crie ou ative outro usuário antes."
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
            usuario.Ativo = dto.Ativo;
            usuario.AtualizadoEmUtc = DateTime.UtcNow;

            if (!string.IsNullOrWhiteSpace(dto.NovaSenha))
            {
                if (dto.NovaSenha.Length < 4)
                {
                    ModelState.AddModelError(nameof(dto.NovaSenha), "Nova senha deve ter pelo menos 4 caracteres.");
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

            if (usuario.Ativo)
            {
                var totalUsuariosAtivos = await _context.UsuariosSistema
                    .CountAsync(u => u.Ativo);

                if (totalUsuariosAtivos <= 1)
                {
                    return BadRequest(new
                    {
                        erro = "Não é possível excluir o único usuário ativo do sistema. Crie ou ative outro usuário antes."
                    });
                }
            }

            _context.UsuariosSistema.Remove(usuario);
            await _context.SaveChangesAsync();

            return NoContent();
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
