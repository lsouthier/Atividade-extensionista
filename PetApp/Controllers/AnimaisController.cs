using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetApp.Models;
using PetApp.Models.Dtos;

namespace PetApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AnimaisController : ControllerBase
    {
        private readonly PetAppContext _context;

        public AnimaisController(PetAppContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<AnimalReadDto>>> GetAnimais()
        {
            var animais = await _context.Animais
                .AsNoTracking()
                .Include(a => a.Tutor)
                .ToListAsync();

            var result = animais.Select(a => MapToReadDto(a));

            return Ok(result);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<AnimalReadDto>> GetAnimal(int id)
        {
            var animal = await _context.Animais
                .AsNoTracking()
                .Include(a => a.Tutor)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (animal == null)
            {
                return NotFound();
            }

            return Ok(MapToReadDto(animal));
        }

        [HttpPost]
        public async Task<ActionResult<AnimalReadDto>> CreateAnimal([FromBody] AnimalCreateDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (dto.IdTutor <= 0)
            {
                ModelState.AddModelError(nameof(dto.IdTutor), "Um tutor válido deve ser selecionado.");
                return BadRequest(ModelState);
            }

            var tutor = await _context.Tutores.FirstOrDefaultAsync(t => t.Id == dto.IdTutor);
            if (tutor == null)
            {
                ModelState.AddModelError(nameof(dto.IdTutor), $"Tutor com ID {dto.IdTutor} não encontrado.");
                return BadRequest(ModelState);
            }

            var animal = new Animal
            {
                Nome = dto.Nome.Trim(),
                Especie = dto.Especie.Trim(),
                Raca = dto.Raca.Trim(),
                Sexo = dto.Sexo.Trim(),
                Idade = dto.Idade,
                Peso = dto.Peso,
                IdTutor = dto.IdTutor,
                EhCastrado = dto.EhCastrado
            };

            try
            {
                _context.Animais.Add(animal);
                await _context.SaveChangesAsync();

                animal.Tutor = tutor;

                return CreatedAtAction(nameof(GetAnimal), new { id = animal.Id }, MapToReadDto(animal));
            }
            catch (DbUpdateException ex)
            {
                var innerMessage = ex.InnerException?.Message ?? ex.Message;
                ModelState.AddModelError("", $"Erro ao salvar animal no banco de dados: {innerMessage}");
                return BadRequest(ModelState);
            }
            catch (Exception ex)
            {
                ModelState.AddModelError("", $"Erro inesperado: {ex.Message}");
                return BadRequest(ModelState);
            }
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateAnimal(int id, [FromBody] AnimalUpdateDto dto)
        {
            if (id != dto.Id)
            {
                return BadRequest("Id do caminho não corresponde ao do corpo da requisição.");
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var animal = await _context.Animais.FindAsync(id);
            if (animal == null)
            {
                return NotFound();
            }

            if (dto.IdTutor <= 0)
            {
                ModelState.AddModelError(nameof(dto.IdTutor), "Um tutor válido deve ser selecionado.");
                return BadRequest(ModelState);
            }

            var tutor = await _context.Tutores.FirstOrDefaultAsync(t => t.Id == dto.IdTutor);
            if (tutor == null)
            {
                ModelState.AddModelError(nameof(dto.IdTutor), $"Tutor com ID {dto.IdTutor} não encontrado.");
                return BadRequest(ModelState);
            }

            animal.Nome = dto.Nome.Trim();
            animal.Especie = dto.Especie.Trim();
            animal.Raca = dto.Raca.Trim();
            animal.Sexo = dto.Sexo.Trim();
            animal.Idade = dto.Idade;
            animal.Peso = dto.Peso;
            animal.IdTutor = dto.IdTutor;
            animal.EhCastrado = dto.EhCastrado;

            try
            {
                await _context.SaveChangesAsync();
                return NoContent();
            }
            catch (DbUpdateException ex)
            {
                var innerMessage = ex.InnerException?.Message ?? ex.Message;
                ModelState.AddModelError("", $"Erro ao atualizar animal: {innerMessage}");
                return BadRequest(ModelState);
            }
            catch (Exception ex)
            {
                ModelState.AddModelError("", $"Erro inesperado: {ex.Message}");
                return BadRequest(ModelState);
            }
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteAnimal(int id, [FromQuery] bool excluirCastracoes = false)
        {
            var animalExiste = await _context.Animais.AnyAsync(a => a.Id == id);
            if (!animalExiste)
            {
                return NotFound();
            }

            var totalCastracoes = await _context.Castracoes.CountAsync(c => c.IdAnimal == id);

            if (totalCastracoes > 0 && !excluirCastracoes)
            {
                return Conflict(new
                {
                    requerConfirmacao = true,
                    totalCastracoes,
                    erro = totalCastracoes == 1
                        ? "Este pet possui 1 castração vinculada. Deseja excluir o pet e também a castração vinculada?"
                        : $"Este pet possui {totalCastracoes} castrações vinculadas. Deseja excluir o pet e também todas as castrações vinculadas?"
                });
            }

            await using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                if (totalCastracoes > 0)
                {
                    await _context.Castracoes
                        .Where(c => c.IdAnimal == id)
                        .ExecuteDeleteAsync();
                }

                var linhasAnimal = await _context.Animais
                    .Where(a => a.Id == id)
                    .ExecuteDeleteAsync();

                if (linhasAnimal == 0)
                {
                    await transaction.RollbackAsync();
                    return NotFound();
                }

                await transaction.CommitAsync();

                return NoContent();
            }
            catch (DbUpdateException ex)
            {
                await transaction.RollbackAsync();

                var innerMessage = ex.InnerException?.Message ?? ex.Message;
                ModelState.AddModelError("", $"Erro ao deletar animal: {innerMessage}");
                return BadRequest(ModelState);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();

                ModelState.AddModelError("", $"Erro inesperado: {ex.Message}");
                return BadRequest(ModelState);
            }
        }

        [HttpGet("nao-castrados")]
        public async Task<ActionResult<IEnumerable<AnimalReadDto>>> GetAnimaisNaoCastrados()
        {
            var animais = await _context.Animais
                .AsNoTracking()
                .Include(a => a.Tutor)
                .Where(a => !a.EhCastrado)
                .ToListAsync();

            var result = animais.Select(a => MapToReadDto(a));

            return Ok(result);
        }

        private static AnimalReadDto MapToReadDto(Animal animal)
        {
            return new AnimalReadDto
            {
                Id = animal.Id,
                Nome = animal.Nome,
                Especie = animal.Especie,
                Raca = animal.Raca,
                Sexo = animal.Sexo,
                Idade = animal.Idade,
                Peso = animal.Peso,
                IdTutor = animal.IdTutor,
                Tutor = animal.Tutor != null ? new TutorSimpleDto
                {
                    Id = animal.Tutor.Id,
                    Nome = animal.Tutor.Nome,
                    Endereco = animal.Tutor.Endereco,
                    Telefone = animal.Tutor.Telefone
                } : null,
                EhCastrado = animal.EhCastrado
            };
        }
    }
}
