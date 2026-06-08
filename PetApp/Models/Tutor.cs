namespace PetApp.Models
{
    public class Tutor
    {
        public int Id { get; set; }

        public required string Nome { get; set; }

        public string Endereco { get; set; } = string.Empty;

        public string Cep { get; set; } = string.Empty;

        public string Logradouro { get; set; } = string.Empty;

        public string Numero { get; set; } = string.Empty;

        public string Complemento { get; set; } = string.Empty;

        public string Bairro { get; set; } = string.Empty;

        public string Cidade { get; set; } = string.Empty;

        public string Uf { get; set; } = string.Empty;

        public string Telefone { get; set; } = string.Empty;

        public ICollection<Animal> Animais { get; set; } = new List<Animal>();
    }
}
