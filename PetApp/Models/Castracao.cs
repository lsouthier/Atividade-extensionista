namespace PetApp.Models
{
    public class Castracao
    {
        public int Id { get; set; }
        public DateTime DataCastracao { get; set; }
        public decimal Valor { get; set; }
        public int IdAnimal { get; set; }
        public Animal Animal { get; set; } = null!;

        public string Observacoes { get; set; } = string.Empty;
        public int IdClinica { get; set; }
        public Clinica Clinica { get; set; } = null!;
    }
}
