using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetApp.Models;
using PetApp.Models.Dtos;

namespace PetApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuditoriaController : ControllerBase
    {
        private readonly PetAppContext _context;

        public AuditoriaController(PetAppContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<AuditoriaReadDto>>> GetAuditorias(
            [FromQuery] int limite = 200,
            [FromQuery] string? entidade = null,
            [FromQuery] string? acao = null,
            [FromQuery] string? usuario = null)
        {
            if (limite <= 0 || limite > 1000)
            {
                limite = 200;
            }

            var query = _context.AuditoriasSistema
                .AsNoTracking()
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(entidade))
            {
                query = query.Where(a => a.Entidade == entidade);
            }

            if (!string.IsNullOrWhiteSpace(acao))
            {
                query = query.Where(a => a.Acao == acao);
            }

            if (!string.IsNullOrWhiteSpace(usuario))
            {
                query = query.Where(a => a.UsuarioNome.Contains(usuario));
            }

            var auditorias = await query
                .OrderByDescending(a => a.DataHoraUtc)
                .Take(limite)
                .Select(a => new AuditoriaReadDto
                {
                    Id = a.Id,
                    DataHoraUtc = a.DataHoraUtc,
                    UsuarioId = a.UsuarioId,
                    UsuarioNome = a.UsuarioNome,
                    Acao = a.Acao,
                    Entidade = a.Entidade,
                    EntidadeId = a.EntidadeId,
                    ValoresAntes = a.ValoresAntes,
                    ValoresDepois = a.ValoresDepois,
                    IpOrigem = a.IpOrigem,
                    UserAgent = a.UserAgent
                })
                .ToListAsync();

            return Ok(auditorias);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<AuditoriaReadDto>> GetAuditoria(int id)
        {
            var auditoria = await _context.AuditoriasSistema
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.Id == id);

            if (auditoria == null)
            {
                return NotFound();
            }

            return Ok(new AuditoriaReadDto
            {
                Id = auditoria.Id,
                DataHoraUtc = auditoria.DataHoraUtc,
                UsuarioId = auditoria.UsuarioId,
                UsuarioNome = auditoria.UsuarioNome,
                Acao = auditoria.Acao,
                Entidade = auditoria.Entidade,
                EntidadeId = auditoria.EntidadeId,
                ValoresAntes = auditoria.ValoresAntes,
                ValoresDepois = auditoria.ValoresDepois,
                IpOrigem = auditoria.IpOrigem,
                UserAgent = auditoria.UserAgent
            });
        }
    }
}
