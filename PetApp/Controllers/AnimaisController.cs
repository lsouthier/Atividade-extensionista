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

            var result = animais.Select(MapToReadDto);

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
        [Authorize(Policy = "PodeCadastrar")]

        [HttpPost]
        public async Task<ActionResult<AnimalReadDto>> CreateAnimal([FromBody] AnimalCreateDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var dataNascimento = NormalizarData(dto.DataNascimento);

            if (dataNascimento.HasValue && dataNascimento.Value.Date > DateTime.Today)
            {
                ModelState.AddModelError(nameof(dto.DataNascimento), "A data de nascimento não pode ser futura.");
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
                Idade = CalcularIdadeEmAnos(dataNascimento) ?? dto.Idade,
                DataNascimento = dataNascimento,
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
        [Authorize(Policy = "PodeCadastrar")]

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

            var dataNascimento = NormalizarData(dto.DataNascimento);

            if (dataNascimento.HasValue && dataNascimento.Value.Date > DateTime.Today)
            {
                ModelState.AddModelError(nameof(dto.DataNascimento), "A data de nascimento não pode ser futura.");
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
            animal.Idade = CalcularIdadeEmAnos(dataNascimento) ?? dto.Idade;
            animal.DataNascimento = dataNascimento;
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
        [Authorize(Policy = "PodeCadastrar")]

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteAnimal(int id, [FromQuery] bool excluirCastracoes = false)
        {
            var animal = await _context.Animais.FindAsync(id);

            if (animal == null)
            {
                return NotFound();
            }

            var castracoes = await _context.Castracoes
                .Where(c => c.IdAnimal == id)
                .ToListAsync();

            var totalCastracoes = castracoes.Count;

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
                    _context.Castracoes.RemoveRange(castracoes);
                }

                _context.Animais.Remove(animal);

                await _context.SaveChangesAsync();
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

            var result = animais.Select(MapToReadDto);

            return Ok(result);
        }

        private static DateTime? NormalizarData(DateTime? data)
        {
            if (!data.HasValue)
            {
                return null;
            }

            return DateTime.SpecifyKind(data.Value.Date, DateTimeKind.Unspecified);
        }

        private static int? CalcularIdadeEmAnos(DateTime? dataNascimento)
        {
            if (!dataNascimento.HasValue)
            {
                return null;
            }

            var hoje = DateTime.Today;
            var nascimento = dataNascimento.Value.Date;

            if (nascimento > hoje)
            {
                return 0;
            }

            var anos = hoje.Year - nascimento.Year;

            if (nascimento > hoje.AddYears(-anos))
            {
                anos--;
            }

            return Math.Max(anos, 0);
        }

        private static string CalcularIdadeDescricao(DateTime? dataNascimento, int idade)
        {
            if (!dataNascimento.HasValue)
            {
                if (idade <= 0)
                {
                    return "Não informado";
                }

                return idade == 1 ? "1 ano" : $"{idade} anos";
            }

            var hoje = DateTime.Today;
            var nascimento = dataNascimento.Value.Date;

            if (nascimento > hoje)
            {
                return "Data futura";
            }

            var anos = hoje.Year - nascimento.Year;
            var meses = hoje.Month - nascimento.Month;

            if (hoje.Day < nascimento.Day)
            {
                meses--;
            }

            if (meses < 0)
            {
                anos--;
                meses += 12;
            }

            anos = Math.Max(anos, 0);
            meses = Math.Max(meses, 0);

            if (anos == 0 && meses == 0)
            {
                return "Menos de 1 mês";
            }

            if (anos == 0)
            {
                return meses == 1 ? "1 mês" : $"{meses} meses";
            }

            if (meses == 0)
            {
                return anos == 1 ? "1 ano" : $"{anos} anos";
            }

            var textoAnos = anos == 1 ? "1 ano" : $"{anos} anos";
            var textoMeses = meses == 1 ? "1 mês" : $"{meses} meses";

            return $"{textoAnos} e {textoMeses}";
        }

        private static AnimalReadDto MapToReadDto(Animal animal)
        {
            var idadeCalculada = CalcularIdadeEmAnos(animal.DataNascimento) ?? animal.Idade;

            return new AnimalReadDto
            {
                Id = animal.Id,
                Nome = animal.Nome,
                Especie = animal.Especie,
                Raca = animal.Raca,
                Sexo = animal.Sexo,
                Idade = idadeCalculada,
                DataNascimento = animal.DataNascimento?.Date,
                IdadeDescricao = CalcularIdadeDescricao(animal.DataNascimento, animal.Idade),
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
