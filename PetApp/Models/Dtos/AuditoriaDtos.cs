namespace PetApp.Models.Dtos
{
    public class AuditoriaReadDto
    {
        public int Id { get; set; }
        public DateTime DataHoraUtc { get; set; }
        public int? UsuarioId { get; set; }
        public string UsuarioNome { get; set; } = string.Empty;
        public string Acao { get; set; } = string.Empty;
        public string Entidade { get; set; } = string.Empty;
        public string? EntidadeId { get; set; }
        public string? ValoresAntes { get; set; }
        public string? ValoresDepois { get; set; }
        public string? IpOrigem { get; set; }
        public string? UserAgent { get; set; }
    }

    public class AuditoriaPaginadaDto
    {
        public int Pagina { get; set; }
        public int TamanhoPagina { get; set; }
        public int TotalRegistros { get; set; }
        public int TotalPaginas { get; set; }
        public List<AuditoriaReadDto> Itens { get; set; } = new();
    }
}
