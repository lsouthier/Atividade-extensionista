using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetApp.Models;
using PetApp.Models.Dtos;

namespace PetApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TutoresController : ControllerBase
    {
        private readonly PetAppContext _context;
        private readonly ILogger<TutoresController> _logger;

        public TutoresController(PetAppContext context, ILogger<TutoresController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<TutorReadDto>>> GetTutores()
        {
            try
            {
                var tutores = await _context.Tutores
                    .AsNoTracking()
                    .Where(t => !string.IsNullOrWhiteSpace(t.Nome))
                    .ToListAsync();

                var result = tutores.Select(t => new TutorReadDto
                {
                    Id = t.Id,
                    Nome = t.Nome,
                    Endereco = t.Endereco,
                    Telefone = t.Telefone
                });

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao carregar tutores");
                return BadRequest(new { erro = "Erro ao carregar tutores." });
            }
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<TutorReadDto>> GetTutor(int id)
        {
            var tutor = await _context.Tutores
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Id == id);

            if (tutor == null)
            {
                return NotFound();
            }

            var dto = new TutorReadDto
            {
                Id = tutor.Id,
                Nome = tutor.Nome,
                Endereco = tutor.Endereco,
                Telefone = tutor.Telefone
            };

            return Ok(dto);
        }

        [HttpPost]
        public async Task<ActionResult<TutorReadDto>> CreateTutor([FromBody] TutorCreateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Nome))
            {
                ModelState.AddModelError(nameof(dto.Nome), "Nome do tutor é obrigatório e não pode estar vazio.");
                return BadRequest(ModelState);
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var tutor = new Tutor
            {
                Nome = dto.Nome.Trim(),
                Endereco = dto.Endereco?.Trim() ?? string.Empty,
                Telefone = dto.Telefone?.Trim() ?? string.Empty
            };

            try
            {
                _context.Tutores.Add(tutor);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Tutor criado: ID={Id}, Nome='{Nome}'", tutor.Id, tutor.Nome);

                var readDto = new TutorReadDto
                {
                    Id = tutor.Id,
                    Nome = tutor.Nome,
                    Endereco = tutor.Endereco,
                    Telefone = tutor.Telefone
                };

                return CreatedAtAction(nameof(GetTutor), new { id = tutor.Id }, readDto);
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Erro ao salvar tutor");
                ModelState.AddModelError("", $"Erro ao salvar tutor: {ex.InnerException?.Message ?? ex.Message}");
                return BadRequest(ModelState);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro inesperado ao salvar tutor");
                ModelState.AddModelError("", $"Erro inesperado: {ex.Message}");
                return BadRequest(ModelState);
            }
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateTutor(int id, [FromBody] TutorUpdateDto dto)
        {
            if (id != dto.Id)
            {
                return BadRequest("Id do caminho não corresponde ao do corpo da requisição.");
            }

            if (string.IsNullOrWhiteSpace(dto.Nome))
            {
                ModelState.AddModelError(nameof(dto.Nome), "Nome do tutor é obrigatório e não pode estar vazio.");
                return BadRequest(ModelState);
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var tutor = await _context.Tutores.FindAsync(id);
            if (tutor == null)
            {
                return NotFound();
            }

            tutor.Nome = dto.Nome.Trim();
            tutor.Endereco = dto.Endereco?.Trim() ?? string.Empty;
            tutor.Telefone = dto.Telefone?.Trim() ?? string.Empty;

            try
            {
                await _context.SaveChangesAsync();
                _logger.LogInformation("Tutor atualizado: ID={Id}", id);
                return NoContent();
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Erro ao atualizar tutor");
                ModelState.AddModelError("", $"Erro ao atualizar tutor: {ex.InnerException?.Message ?? ex.Message}");
                return BadRequest(ModelState);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro inesperado ao atualizar tutor");
                ModelState.AddModelError("", $"Erro inesperado: {ex.Message}");
                return BadRequest(ModelState);
            }
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteTutor(int id, [FromQuery] bool excluirAnimais = false)
        {
            var tutor = await _context.Tutores
                .FirstOrDefaultAsync(t => t.Id == id);

            if (tutor == null)
            {
                return NotFound();
            }

            var animais = await _context.Animais
                .Where(a => a.IdTutor == id)
                .ToListAsync();

            var totalAnimais = animais.Count;

            if (totalAnimais > 0 && !excluirAnimais)
            {
                return Conflict(new
                {
                    requerConfirmacao = true,
                    totalAnimais,
                    erro = totalAnimais == 1
                        ? "Este tutor possui 1 pet cadastrado. Deseja excluir o tutor e também o pet vinculado a ele?"
                        : $"Este tutor possui {totalAnimais} pets cadastrados. Deseja excluir o tutor e também todos os pets vinculados a ele?"
                });
            }

            await using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                if (totalAnimais > 0)
                {
                    var idsAnimais = animais.Select(a => a.Id).ToList();

                    var castracoes = await _context.Castracoes
                        .Where(c => idsAnimais.Contains(c.IdAnimal))
                        .ToListAsync();

                    if (castracoes.Count > 0)
                    {
                        _context.Castracoes.RemoveRange(castracoes);
                    }

                    _context.Animais.RemoveRange(animais);
                }

                _context.Tutores.Remove(tutor);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                _logger.LogInformation(
                    "Tutor deletado: ID={Id}, AnimaisRemovidos={TotalAnimais}",
                    id,
                    totalAnimais
                );

                return NoContent();
            }
            catch (DbUpdateException ex)
            {
                await transaction.RollbackAsync();

                _logger.LogError(ex, "Erro ao deletar tutor");
                ModelState.AddModelError("", $"Erro ao deletar tutor: {ex.InnerException?.Message ?? ex.Message}");
                return BadRequest(ModelState);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();

                _logger.LogError(ex, "Erro inesperado ao deletar tutor");
                ModelState.AddModelError("", $"Erro inesperado: {ex.Message}");
                return BadRequest(ModelState);
            }
        }
    }
}
