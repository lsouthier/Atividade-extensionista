namespace PetApp.Models.Dtos
{
    public class TutorSimpleDto
    {
        public int Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string Endereco { get; set; } = string.Empty;
        public string Telefone { get; set; } = string.Empty;
    }

    public class AnimalReadDto
    {
        public int Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string Especie { get; set; } = string.Empty;
        public string Raca { get; set; } = string.Empty;
        public string Sexo { get; set; } = string.Empty;
        public int Idade { get; set; }
        public DateTime? DataNascimento { get; set; }
        public string IdadeDescricao { get; set; } = string.Empty;
        public decimal Peso { get; set; }
        public int IdTutor { get; set; }
        public TutorSimpleDto? Tutor { get; set; }
        public bool EhCastrado { get; set; }
    }

    public class AnimalCreateDto
    {
        public required string Nome { get; set; }
        public required string Especie { get; set; }
        public required string Raca { get; set; }
        public required string Sexo { get; set; }
        public int Idade { get; set; }
        public DateTime? DataNascimento { get; set; }
        public decimal Peso { get; set; }
        public int IdTutor { get; set; }
        public bool EhCastrado { get; set; }
    }

    public class AnimalUpdateDto
    {
        public int Id { get; set; }
        public required string Nome { get; set; }
        public required string Especie { get; set; }
        public required string Raca { get; set; }
        public required string Sexo { get; set; }
        public int Idade { get; set; }
        public DateTime? DataNascimento { get; set; }
        public decimal Peso { get; set; }
        public int IdTutor { get; set; }
        public bool EhCastrado { get; set; }
    }
}
