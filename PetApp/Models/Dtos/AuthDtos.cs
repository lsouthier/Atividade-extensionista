namespace PetApp.Models.Dtos
{
    public class LoginRequestDto
    {
        public required string NomeUsuario { get; set; }

        public required string Senha { get; set; }
    }

    public class LoginResponseDto
    {
        public required string Token { get; set; }

        public DateTime ExpiraEmUtc { get; set; }

        public required UsuarioSistemaReadDto Usuario { get; set; }
    }

    public class UsuarioSistemaCreateDto
    {
        public required string NomeUsuario { get; set; }

        public required string Nome { get; set; }

        public required string Senha { get; set; }

        public string PerfilAcesso { get; set; } = "Leitura";

        public bool Ativo { get; set; } = true;
    }

    public class UsuarioSistemaUpdateDto
    {
        public int Id { get; set; }

        public required string NomeUsuario { get; set; }

        public required string Nome { get; set; }

        public string? NovaSenha { get; set; }

        public string PerfilAcesso { get; set; } = "Leitura";

        public bool Ativo { get; set; } = true;
    }

    public class UsuarioSistemaReadDto
    {
        public int Id { get; set; }

        public string NomeUsuario { get; set; } = string.Empty;

        public string Nome { get; set; } = string.Empty;

        public string PerfilAcesso { get; set; } = "Leitura";

        public bool Ativo { get; set; }

        public DateTime CriadoEmUtc { get; set; }

        public DateTime? AtualizadoEmUtc { get; set; }
    }
}
