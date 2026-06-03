namespace PetApp.Models
{
    public class Animal
    {
        public int Id { get; set; }

        public required string Nome { get; set; }

        public required string Especie { get; set; }

        public required string Raca { get; set; }

        public required string Sexo { get; set; }

        public int Idade { get; set; }

        public decimal Peso { get; set; }

        public int IdTutor { get; set; }

        public Tutor? Tutor { get; set; }

        public int IdCastracao { get; set; }

        public Castracao? Castracao { get; set; }

        public bool EhCastrado { get; set; }
    }
}
