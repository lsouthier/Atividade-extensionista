using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetApp.Models;
using PetApp.Models.Dtos;

namespace PetApp.Controllers
{
    [Authorize(Policy = "Administrador")]
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
        public async Task<ActionResult<AuditoriaPaginadaDto>> GetAuditorias(
            [FromQuery] int pagina = 1,
            [FromQuery] int tamanhoPagina = 25,
            [FromQuery] string? entidade = null,
            [FromQuery] string? acao = null,
            [FromQuery] string? usuario = null)
        {
            if (pagina <= 0)
            {
                pagina = 1;
            }

            if (tamanhoPagina <= 0)
            {
                tamanhoPagina = 25;
            }

            if (tamanhoPagina > 100)
            {
                tamanhoPagina = 100;
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

            var totalRegistros = await query.CountAsync();

            var totalPaginas = totalRegistros == 0
                ? 1
                : (int)Math.Ceiling(totalRegistros / (double)tamanhoPagina);

            if (pagina > totalPaginas)
            {
                pagina = totalPaginas;
            }

            var itens = await query
                .OrderByDescending(a => a.DataHoraUtc)
                .ThenByDescending(a => a.Id)
                .Skip((pagina - 1) * tamanhoPagina)
                .Take(tamanhoPagina)
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

            return Ok(new AuditoriaPaginadaDto
            {
                Pagina = pagina,
                TamanhoPagina = tamanhoPagina,
                TotalRegistros = totalRegistros,
                TotalPaginas = totalPaginas,
                Itens = itens
            });
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

        [HttpGet("debug-ip")]
        public IActionResult DebugIp()
        {
            return Ok(new
            {
                RemoteIpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
                XRealIp = HttpContext.Request.Headers["X-Real-IP"].ToString(),
                XForwardedFor = HttpContext.Request.Headers["X-Forwarded-For"].ToString(),
                XForwardedProto = HttpContext.Request.Headers["X-Forwarded-Proto"].ToString(),
                XForwardedHost = HttpContext.Request.Headers["X-Forwarded-Host"].ToString(),
                CfConnectingIp = HttpContext.Request.Headers["CF-Connecting-IP"].ToString(),
                UserAgent = HttpContext.Request.Headers.UserAgent.ToString()
            });
        }
    }
}
