namespace PetApp.Models
{
    public class AuditoriaSistema
    {
        public int Id { get; set; }

        public DateTime DataHoraUtc { get; set; } = DateTime.UtcNow;

        public int? UsuarioId { get; set; }

        public string UsuarioNome { get; set; } = "Sistema";

        public string Acao { get; set; } = string.Empty;

        public string Entidade { get; set; } = string.Empty;

        public string? EntidadeId { get; set; }

        public string? ValoresAntes { get; set; }

        public string? ValoresDepois { get; set; }

        public string? IpOrigem { get; set; }

        public string? UserAgent { get; set; }
    }
}
