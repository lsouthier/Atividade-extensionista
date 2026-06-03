using System.ComponentModel.DataAnnotations;

namespace PetApp.Models.Dtos
{
    public class LoginRequestDto
    {
        [Required]
        public string NomeUsuario { get; set; } = string.Empty;

        [Required]
        public string Senha { get; set; } = string.Empty;
    }

    public class LoginResponseDto
    {
        public string Token { get; set; } = string.Empty;
        public DateTime ExpiraEmUtc { get; set; }
        public UsuarioSistemaReadDto Usuario { get; set; } = new();
    }

    public class UsuarioSistemaCreateDto
    {
        [Required]
        [MaxLength(100)]
        public string NomeUsuario { get; set; } = string.Empty;

        [Required]
        [MaxLength(150)]
        public string Nome { get; set; } = string.Empty;

        [Required]
        [MinLength(4)]
        [MaxLength(100)]
        public string Senha { get; set; } = string.Empty;

        public bool Ativo { get; set; } = true;
    }

    public class UsuarioSistemaUpdateDto
    {
        [Required]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string NomeUsuario { get; set; } = string.Empty;

        [Required]
        [MaxLength(150)]
        public string Nome { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? NovaSenha { get; set; }

        public bool Ativo { get; set; } = true;
    }

    public class UsuarioSistemaReadDto
    {
        public int Id { get; set; }
        public string NomeUsuario { get; set; } = string.Empty;
        public string Nome { get; set; } = string.Empty;
        public bool Ativo { get; set; }
        public DateTime CriadoEmUtc { get; set; }
        public DateTime? AtualizadoEmUtc { get; set; }
    }
}
