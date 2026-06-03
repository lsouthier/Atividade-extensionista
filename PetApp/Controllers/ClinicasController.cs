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
                Nome = dto.Nome,
                Telefone = dto.Telefone,
                VeterinarioResponsavel = dto.VeterinarioResponsavel
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

            clinica.Nome = dto.Nome;
            clinica.Telefone = dto.Telefone;
            clinica.VeterinarioResponsavel = dto.VeterinarioResponsavel;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteClinica(int id)
        {
            var clinica = await _context.Clinicas.FindAsync(id);
            if (clinica == null)
            {
                return NotFound();
            }

            _context.Clinicas.Remove(clinica);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
