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
                    .OrderBy(t => t.Nome)
                    .ToListAsync();

                return Ok(tutores.Select(MapToReadDto));
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

            return Ok(MapToReadDto(tutor));
        }

        [Authorize(Policy = "PodeCadastrar")]
        [HttpPost]
        public async Task<ActionResult<TutorReadDto>> CreateTutor([FromBody] TutorCreateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Nome))
            {
                ModelState.AddModelError(nameof(dto.Nome), "Nome do tutor é obrigatório e não pode estar vazio.");
                return BadRequest(ModelState);
            }

            if (string.IsNullOrWhiteSpace(dto.Telefone))
            {
                ModelState.AddModelError(nameof(dto.Telefone), "Telefone do tutor é obrigatório.");
                return BadRequest(ModelState);
            }

            if (!TelefoneValido(dto.Telefone))
            {
                ModelState.AddModelError(nameof(dto.Telefone), "Telefone inválido. Informe DDD e número.");
                return BadRequest(ModelState);
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var tutor = new Tutor
            {
                Nome = dto.Nome.Trim(),
                Endereco = MontarEnderecoLegado(dto),
                Cep = Limpar(dto.Cep),
                Logradouro = Limpar(dto.Logradouro),
                Numero = Limpar(dto.Numero),
                Complemento = Limpar(dto.Complemento),
                Bairro = Limpar(dto.Bairro),
                Cidade = Limpar(dto.Cidade),
                Uf = Limpar(dto.Uf).ToUpperInvariant(),
                Telefone = Limpar(dto.Telefone)
            };

            try
            {
                _context.Tutores.Add(tutor);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Tutor criado: ID={Id}, Nome='{Nome}'", tutor.Id, tutor.Nome);

                return CreatedAtAction(nameof(GetTutor), new { id = tutor.Id }, MapToReadDto(tutor));
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

        [Authorize(Policy = "PodeCadastrar")]
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

            if (string.IsNullOrWhiteSpace(dto.Telefone))
            {
                ModelState.AddModelError(nameof(dto.Telefone), "Telefone do tutor é obrigatório.");
                return BadRequest(ModelState);
            }

            if (!TelefoneValido(dto.Telefone))
            {
                ModelState.AddModelError(nameof(dto.Telefone), "Telefone inválido. Informe DDD e número.");
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
            tutor.Endereco = MontarEnderecoLegado(dto);
            tutor.Cep = Limpar(dto.Cep);
            tutor.Logradouro = Limpar(dto.Logradouro);
            tutor.Numero = Limpar(dto.Numero);
            tutor.Complemento = Limpar(dto.Complemento);
            tutor.Bairro = Limpar(dto.Bairro);
            tutor.Cidade = Limpar(dto.Cidade);
            tutor.Uf = Limpar(dto.Uf).ToUpperInvariant();
            tutor.Telefone = Limpar(dto.Telefone);

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

        [Authorize(Policy = "PodeCadastrar")]
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

        private static bool TelefoneValido(string? telefone)
        {
            var digitos = new string((telefone ?? string.Empty).Where(char.IsDigit).ToArray());

            return digitos.Length == 10 || digitos.Length == 11;
        }

        private static TutorReadDto MapToReadDto(Tutor tutor)
        {
            return new TutorReadDto
            {
                Id = tutor.Id,
                Nome = tutor.Nome,
                Endereco = tutor.Endereco,
                EnderecoCompleto = MontarEnderecoCompleto(tutor),
                Cep = tutor.Cep,
                Logradouro = tutor.Logradouro,
                Numero = tutor.Numero,
                Complemento = tutor.Complemento,
                Bairro = tutor.Bairro,
                Cidade = tutor.Cidade,
                Uf = tutor.Uf,
                Telefone = tutor.Telefone
            };
        }

        private static string MontarEnderecoLegado(TutorCreateDto dto)
        {
            var partes = new List<string>();

            if (!string.IsNullOrWhiteSpace(dto.Logradouro))
            {
                var logradouro = dto.Logradouro.Trim();

                if (!string.IsNullOrWhiteSpace(dto.Numero))
                {
                    logradouro += $", {dto.Numero.Trim()}";
                }

                partes.Add(logradouro);
            }
            else if (!string.IsNullOrWhiteSpace(dto.Endereco))
            {
                partes.Add(dto.Endereco.Trim());
            }

            if (!string.IsNullOrWhiteSpace(dto.Complemento))
            {
                partes.Add(dto.Complemento.Trim());
            }

            if (!string.IsNullOrWhiteSpace(dto.Bairro))
            {
                partes.Add(dto.Bairro.Trim());
            }

            var cidadeUf = MontarCidadeUf(dto.Cidade, dto.Uf);

            if (!string.IsNullOrWhiteSpace(cidadeUf))
            {
                partes.Add(cidadeUf);
            }

            if (!string.IsNullOrWhiteSpace(dto.Cep))
            {
                partes.Add($"CEP {dto.Cep.Trim()}");
            }

            return string.Join(" - ", partes);
        }

        private static string MontarEnderecoCompleto(Tutor tutor)
        {
            var partes = new List<string>();

            if (!string.IsNullOrWhiteSpace(tutor.Logradouro))
            {
                var logradouro = tutor.Logradouro.Trim();

                if (!string.IsNullOrWhiteSpace(tutor.Numero))
                {
                    logradouro += $", {tutor.Numero.Trim()}";
                }

                partes.Add(logradouro);
            }
            else if (!string.IsNullOrWhiteSpace(tutor.Endereco))
            {
                partes.Add(tutor.Endereco.Trim());
            }

            if (!string.IsNullOrWhiteSpace(tutor.Complemento))
            {
                partes.Add(tutor.Complemento.Trim());
            }

            if (!string.IsNullOrWhiteSpace(tutor.Bairro))
            {
                partes.Add(tutor.Bairro.Trim());
            }

            var cidadeUf = MontarCidadeUf(tutor.Cidade, tutor.Uf);

            if (!string.IsNullOrWhiteSpace(cidadeUf))
            {
                partes.Add(cidadeUf);
            }

            if (!string.IsNullOrWhiteSpace(tutor.Cep))
            {
                partes.Add($"CEP {tutor.Cep.Trim()}");
            }

            return partes.Count > 0
                ? string.Join(" - ", partes)
                : tutor.Endereco;
        }

        private static string MontarCidadeUf(string? cidade, string? uf)
        {
            cidade = Limpar(cidade);
            uf = Limpar(uf).ToUpperInvariant();

            if (!string.IsNullOrWhiteSpace(cidade) && !string.IsNullOrWhiteSpace(uf))
            {
                return $"{cidade}/{uf}";
            }

            return !string.IsNullOrWhiteSpace(cidade) ? cidade : uf;
        }

        private static string Limpar(string? valor)
        {
            return valor?.Trim() ?? string.Empty;
        }
    }
}
