namespace PetApp.Models
{
    public class Clinica
    {
        public int Id { get; set; }
        public required string Nome { get; set; }
        public required string Telefone { get; set; }
        public string VeterinarioResponsavel { get; set; } = string.Empty;
        public ICollection<Castracao> Castracoes { get; set; } = new List<Castracao>();
    }
}
