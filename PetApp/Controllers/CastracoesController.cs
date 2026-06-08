using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetApp.Models;
using PetApp.Models.Dtos;

namespace PetApp.Controllers
{
    [Authorize(Policy = "PodeLer")]
    [ApiController]
    [Route("api/[controller]")]
    public class CastracoesController : ControllerBase
    {
        private readonly PetAppContext _context;

        public CastracoesController(PetAppContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<CastracaoReadDto>>> GetCastracoes()
        {
            var castracoes = await _context.Castracoes
                .Include(c => c.Animal)
                .Include(c => c.Clinica)
                .AsNoTracking()
                .ToListAsync();

            var result = castracoes.Select(c => MapToReadDto(c));

            return Ok(result);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<CastracaoReadDto>> GetCastracao(int id)
        {
            var castracao = await _context.Castracoes
                .Include(c => c.Animal)
                .Include(c => c.Clinica)
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == id);

            if (castracao == null)
            {
                return NotFound();
            }

            return Ok(MapToReadDto(castracao));
        }
        [Authorize(Policy = "PodeCadastrar")]

        [HttpPost]
        public async Task<ActionResult<CastracaoReadDto>> CreateCastracao([FromBody] CastracaoCreateDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var animal = await _context.Animais.FindAsync(dto.IdAnimal);
            if (animal == null)
            {
                ModelState.AddModelError(nameof(dto.IdAnimal), "Animal não encontrado.");
                return BadRequest(ModelState);
            }

            var clinica = await _context.Clinicas.FindAsync(dto.IdClinica);
            if (clinica == null)
            {
                ModelState.AddModelError(nameof(dto.IdClinica), "Clínica não encontrada.");
                return BadRequest(ModelState);
            }

            var existeCastracaoParaAnimal = await _context.Castracoes
                .AnyAsync(c => c.IdAnimal == dto.IdAnimal);

            if (existeCastracaoParaAnimal)
            {
                ModelState.AddModelError(nameof(dto.IdAnimal), "Este animal já possui uma castração registrada ou agendada.");
                return BadRequest(ModelState);
            }

            var dataCastracaoUtc = NormalizarDataUtc(dto.DataCastracao);

            var castracao = new Castracao
            {
                DataCastracao = dataCastracaoUtc,
                Valor = dto.Valor,
                IdAnimal = dto.IdAnimal,
                IdClinica = dto.IdClinica,
                Observacoes = dto.Observacoes?.Trim() ?? string.Empty
            };

            await using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                _context.Castracoes.Add(castracao);
                await _context.SaveChangesAsync();

                animal.IdCastracao = castracao.Id;

                if (CastracaoJaRealizada(dataCastracaoUtc))
                {
                    animal.EhCastrado = true;
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                castracao.Animal = animal;
                castracao.Clinica = clinica;

                return CreatedAtAction(nameof(GetCastracao), new { id = castracao.Id }, MapToReadDto(castracao));
            }
            catch (DbUpdateException ex)
            {
                await transaction.RollbackAsync();
                ModelState.AddModelError("", $"Erro ao salvar castração: {ex.InnerException?.Message ?? ex.Message}");
                return BadRequest(ModelState);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                ModelState.AddModelError("", $"Erro inesperado ao salvar castração: {ex.Message}");
                return BadRequest(ModelState);
            }
        }
        [Authorize(Policy = "PodeCadastrar")]

        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateCastracao(int id, [FromBody] CastracaoUpdateDto dto)
        {
            if (id != dto.Id)
            {
                return BadRequest("Id do caminho não corresponde ao do corpo da requisição.");
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var castracao = await _context.Castracoes.FindAsync(id);
            if (castracao == null)
            {
                return NotFound();
            }

            var idAnimalAnterior = castracao.IdAnimal;

            var animalNovo = await _context.Animais.FindAsync(dto.IdAnimal);
            if (animalNovo == null)
            {
                ModelState.AddModelError(nameof(dto.IdAnimal), "Animal não encontrado.");
                return BadRequest(ModelState);
            }

            var clinicaExists = await _context.Clinicas.AnyAsync(cl => cl.Id == dto.IdClinica);
            if (!clinicaExists)
            {
                ModelState.AddModelError(nameof(dto.IdClinica), "Clínica não encontrada.");
                return BadRequest(ModelState);
            }

            if (castracao.IdAnimal != dto.IdAnimal)
            {
                var existeCastracaoParaNovoAnimal = await _context.Castracoes
                    .AnyAsync(c => c.IdAnimal == dto.IdAnimal && c.Id != id);

                if (existeCastracaoParaNovoAnimal)
                {
                    ModelState.AddModelError(nameof(dto.IdAnimal), "Este animal já possui uma castração registrada ou agendada.");
                    return BadRequest(ModelState);
                }
            }

            castracao.DataCastracao = NormalizarDataUtc(dto.DataCastracao);
            castracao.Valor = dto.Valor;
            castracao.IdAnimal = dto.IdAnimal;
            castracao.IdClinica = dto.IdClinica;
            castracao.Observacoes = dto.Observacoes?.Trim() ?? string.Empty;

            await using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                await _context.SaveChangesAsync();

                await AtualizarStatusCastracaoAnimalSemDesmarcarAsync(idAnimalAnterior);

                if (idAnimalAnterior != dto.IdAnimal)
                {
                    await AtualizarStatusCastracaoAnimalSemDesmarcarAsync(dto.IdAnimal);
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return NoContent();
            }
            catch (DbUpdateException ex)
            {
                await transaction.RollbackAsync();
                ModelState.AddModelError("", $"Erro ao atualizar castração: {ex.InnerException?.Message ?? ex.Message}");
                return BadRequest(ModelState);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                ModelState.AddModelError("", $"Erro inesperado ao atualizar castração: {ex.Message}");
                return BadRequest(ModelState);
            }
        }
        [Authorize(Policy = "PodeCadastrar")]

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteCastracao(int id)
        {
            var castracao = await _context.Castracoes.FindAsync(id);
            if (castracao == null)
            {
                return NotFound();
            }

            var idAnimal = castracao.IdAnimal;

            await using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                _context.Castracoes.Remove(castracao);
                await _context.SaveChangesAsync();

                await AtualizarIdCastracaoPrincipalAsync(idAnimal);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return NoContent();
            }
            catch (DbUpdateException ex)
            {
                await transaction.RollbackAsync();
                ModelState.AddModelError("", $"Erro ao deletar castração: {ex.InnerException?.Message ?? ex.Message}");
                return BadRequest(ModelState);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                ModelState.AddModelError("", $"Erro inesperado ao deletar castração: {ex.Message}");
                return BadRequest(ModelState);
            }
        }

        private static CastracaoReadDto MapToReadDto(Castracao castracao)
        {
            return new CastracaoReadDto
            {
                Id = castracao.Id,
                DataCastracao = castracao.DataCastracao,
                Valor = castracao.Valor,
                IdAnimal = castracao.IdAnimal,
                NomeAnimal = castracao.Animal?.Nome ?? string.Empty,
                IdClinica = castracao.IdClinica,
                NomeClinica = castracao.Clinica?.Nome ?? string.Empty,
                Observacoes = castracao.Observacoes
            };
        }

        private static DateTime NormalizarDataUtc(DateTime data)
        {
            if (data.Kind == DateTimeKind.Utc)
            {
                return data;
            }

            if (data.Kind == DateTimeKind.Local)
            {
                return data.ToUniversalTime();
            }

            return DateTime.SpecifyKind(data, DateTimeKind.Utc);
        }

        private static bool CastracaoJaRealizada(DateTime dataCastracaoUtc)
        {
            return dataCastracaoUtc <= DateTime.UtcNow;
        }

        private async Task AtualizarStatusCastracaoAnimalSemDesmarcarAsync(int idAnimal)
        {
            var animal = await _context.Animais.FindAsync(idAnimal);
            if (animal == null)
            {
                return;
            }

            var castracoes = await _context.Castracoes
                .Where(c => c.IdAnimal == idAnimal)
                .OrderByDescending(c => c.DataCastracao)
                .ToListAsync();

            var castracaoPrincipal = castracoes.FirstOrDefault();

            animal.IdCastracao = castracaoPrincipal?.Id ?? 0;

            if (castracoes.Any(c => c.DataCastracao <= DateTime.UtcNow))
            {
                animal.EhCastrado = true;
            }
        }

        private async Task AtualizarIdCastracaoPrincipalAsync(int idAnimal)
        {
            var animal = await _context.Animais.FindAsync(idAnimal);
            if (animal == null)
            {
                return;
            }

            var castracaoPrincipal = await _context.Castracoes
                .Where(c => c.IdAnimal == idAnimal)
                .OrderByDescending(c => c.DataCastracao)
                .FirstOrDefaultAsync();

            animal.IdCastracao = castracaoPrincipal?.Id ?? 0;
        }
    }
}
