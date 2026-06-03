using System.ComponentModel.DataAnnotations;

namespace PetApp.Models.Dtos
{
    public class TutorCreateDto
    {
        [Required]
        [MaxLength(200)]
        public string Nome { get; set; } = string.Empty;

        [MaxLength(200)]
        public string Endereco { get; set; } = string.Empty;

        [MaxLength(20)]
        public string Telefone { get; set; } = string.Empty;
    }

    public class TutorUpdateDto : TutorCreateDto
    {
        [Required]
        public int Id { get; set; }
    }

    public class TutorReadDto
    {
        public int Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string Endereco { get; set; } = string.Empty;
        public string Telefone { get; set; } = string.Empty;
    }
}