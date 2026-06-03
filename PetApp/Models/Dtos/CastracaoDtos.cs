using System.ComponentModel.DataAnnotations;

namespace PetApp.Models.Dtos
{
    public class CastracaoCreateDto
    {
        [Required]
        public DateTime DataCastracao { get; set; }

        [Range(0, 100000)]
        public decimal Valor { get; set; }

        [Required]
        public int IdAnimal { get; set; }

        [Required]
        public int IdClinica { get; set; }

        [MaxLength(500)]
        public string Observacoes { get; set; } = string.Empty;
    }

    public class CastracaoUpdateDto : CastracaoCreateDto
    {
        [Required]
        public int Id { get; set; }
    }

    public class CastracaoReadDto
    {
        public int Id { get; set; }
        public DateTime DataCastracao { get; set; }
        public decimal Valor { get; set; }
        public int IdAnimal { get; set; }
        public string NomeAnimal { get; set; } = string.Empty;
        public int IdClinica { get; set; }
        public string NomeClinica { get; set; } = string.Empty;
        public string Observacoes { get; set; } = string.Empty;
    }
}
