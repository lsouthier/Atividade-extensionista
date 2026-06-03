namespace PetApp.Models
{
    public class UsuarioSistema
    {
        public int Id { get; set; }

        public required string NomeUsuario { get; set; }

        public required string NomeUsuarioNormalizado { get; set; }

        public required string Nome { get; set; }

        public required string SenhaHash { get; set; }

        public bool Ativo { get; set; } = true;

        public DateTime CriadoEmUtc { get; set; } = DateTime.UtcNow;

        public DateTime? AtualizadoEmUtc { get; set; }
    }
}
