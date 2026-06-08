using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetApp.Models;
using PetApp.Models.Dtos;

namespace PetApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ClinicasController : ControllerBase
    {
        private readonly PetAppContext _context;

        public ClinicasController(PetAppContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ClinicaReadDto>>> GetClinicas()
        {
            var clinicas = await _context.Clinicas
                .AsNoTracking()
                .ToListAsync();

            var result = clinicas.Select(c => new ClinicaReadDto
            {
                Id = c.Id,
                Nome = c.Nome,
                Telefone = c.Telefone,
                VeterinarioResponsavel = c.VeterinarioResponsavel
            });

            return Ok(result);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<ClinicaReadDto>> GetClinica(int id)
        {
            var clinica = await _context.Clinicas
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == id);

            if (clinica == null)
            {
                return NotFound();
            }

            var dto = new ClinicaReadDto
            {
                Id = clinica.Id,
                Nome = clinica.Nome,
                Telefone = clinica.Telefone,
                VeterinarioResponsavel = clinica.VeterinarioResponsavel
            };

            return Ok(dto);
        }

        [HttpPost]
        public async Task<ActionResult<ClinicaReadDto>> CreateClinica([FromBody] ClinicaCreateDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var clinica = new Clinica
            {
                Nome = dto.Nome.Trim(),
                Telefone = dto.Telefone.Trim(),
                VeterinarioResponsavel = dto.VeterinarioResponsavel?.Trim() ?? string.Empty
            };

            _context.Clinicas.Add(clinica);
            await _context.SaveChangesAsync();

            var readDto = new ClinicaReadDto
            {
                Id = clinica.Id,
                Nome = clinica.Nome,
                Telefone = clinica.Telefone,
                VeterinarioResponsavel = clinica.VeterinarioResponsavel
            };

            return CreatedAtAction(nameof(GetClinica), new { id = clinica.Id }, readDto);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateClinica(int id, [FromBody] ClinicaUpdateDto dto)
        {
            if (id != dto.Id)
            {
                return BadRequest("Id do caminho não corresponde ao do corpo da requisição.");
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var clinica = await _context.Clinicas.FindAsync(id);

            if (clinica == null)
            {
                return NotFound();
            }

            clinica.Nome = dto.Nome.Trim();
            clinica.Telefone = dto.Telefone.Trim();
            clinica.VeterinarioResponsavel = dto.VeterinarioResponsavel?.Trim() ?? string.Empty;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteClinica(
            int id,
            [FromQuery] bool excluirCastracoes = false)
        {
            var clinica = await _context.Clinicas.FindAsync(id);

            if (clinica == null)
            {
                return NotFound();
            }

            var castracoes = await _context.Castracoes
                .Where(c => c.IdClinica == id)
                .ToListAsync();

            var totalCastracoes = castracoes.Count;

            if (totalCastracoes > 0 && !excluirCastracoes)
            {
                return Conflict(new
                {
                    requerConfirmacao = true,
                    totalCastracoes,
                    erro = totalCastracoes == 1
                        ? "Esta clínica possui 1 castração vinculada. Deseja excluir a clínica e também a castração vinculada?"
                        : $"Esta clínica possui {totalCastracoes} castrações vinculadas. Deseja excluir a clínica e também todas as castrações vinculadas?"
                });
            }

            await using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                if (totalCastracoes > 0)
                {
                    var idsAnimais = castracoes
                        .Select(c => c.IdAnimal)
                        .Distinct()
                        .ToList();

                    var animais = await _context.Animais
                        .Where(a => idsAnimais.Contains(a.Id))
                        .ToListAsync();

                    foreach (var animal in animais)
                    {
                        animal.EhCastrado = false;
                    }

                    _context.Castracoes.RemoveRange(castracoes);
                }

                _context.Clinicas.Remove(clinica);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return NoContent();
            }
            catch (DbUpdateException ex)
            {
                await transaction.RollbackAsync();

                var innerMessage = ex.InnerException?.Message ?? ex.Message;
                ModelState.AddModelError("", $"Erro ao excluir clínica: {innerMessage}");
                return BadRequest(ModelState);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();

                ModelState.AddModelError("", $"Erro inesperado: {ex.Message}");
                return BadRequest(ModelState);
            }
        }
    }
}
