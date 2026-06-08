using System.ComponentModel.DataAnnotations;

namespace PetApp.Models.Dtos
{
    public class TutorCreateDto
    {
        [Required]
        [MaxLength(200)]
        public string Nome { get; set; } = string.Empty;

        [MaxLength(300)]
        public string Endereco { get; set; } = string.Empty;

        [Required]
        [MaxLength(9)]
        public string Cep { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string Logradouro { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string Numero { get; set; } = string.Empty;

        [MaxLength(100)]
        public string Complemento { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string Bairro { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string Cidade { get; set; } = string.Empty;

        [Required]
        [MaxLength(2)]
        public string Uf { get; set; } = string.Empty;

        [Required]
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

        public string EnderecoCompleto { get; set; } = string.Empty;

        public string Cep { get; set; } = string.Empty;

        public string Logradouro { get; set; } = string.Empty;

        public string Numero { get; set; } = string.Empty;

        public string Complemento { get; set; } = string.Empty;

        public string Bairro { get; set; } = string.Empty;

        public string Cidade { get; set; } = string.Empty;

        public string Uf { get; set; } = string.Empty;

        public string Telefone { get; set; } = string.Empty;
    }
}
