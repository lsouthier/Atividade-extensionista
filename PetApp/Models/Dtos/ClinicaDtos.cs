using System.ComponentModel.DataAnnotations;

namespace PetApp.Models.Dtos
{
    public class ClinicaCreateDto
    {
        [Required]
        [MaxLength(200)]
        public string Nome { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string Telefone { get; set; } = string.Empty;

        [MaxLength(200)]
        public string VeterinarioResponsavel { get; set; } = string.Empty;
    }

    public class ClinicaUpdateDto : ClinicaCreateDto
    {
        [Required]
        public int Id { get; set; }
    }

    public class ClinicaReadDto
    {
        public int Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string Telefone { get; set; } = string.Empty;
        public string VeterinarioResponsavel { get; set; } = string.Empty;
    }
}
