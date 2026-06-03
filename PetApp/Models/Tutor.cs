namespace PetApp.Models
{
    public class Tutor
    {
        public int Id { get; set; }
        
        /// <summary>
        /// Nome do tutor - OBRIGATÓRIO E NÃO PODE SER VAZIO
        /// Validação é feita no Controller, não aqui
        /// </summary>
        public required string Nome { get; set; }
        
        public string Endereco { get; set; } = string.Empty;
        public string Telefone { get; set; } = string.Empty;
        public ICollection<Animal> Animais { get; set; } = new List<Animal>();
    }
}
