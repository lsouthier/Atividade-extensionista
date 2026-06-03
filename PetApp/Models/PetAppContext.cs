using Microsoft.EntityFrameworkCore;

namespace PetApp.Models
{
    public class PetAppContext : DbContext
    {
        public PetAppContext(DbContextOptions<PetAppContext> options)
            : base(options)
        {
        }

        public DbSet<Animal> Animais { get; set; } = null!;
        public DbSet<Tutor> Tutores { get; set; } = null!;
        public DbSet<Castracao> Castracoes { get; set; } = null!;
        public DbSet<Clinica> Clinicas { get; set; } = null!;
        public DbSet<UsuarioSistema> UsuariosSistema { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Animal>(entity =>
            {
                entity.HasKey(a => a.Id);

                entity.Property(a => a.Nome)
                    .IsRequired()
                    .HasMaxLength(200);

                entity.Property(a => a.Especie)
                    .IsRequired()
                    .HasMaxLength(25);

                entity.Property(a => a.Raca)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(a => a.Sexo)
                    .IsRequired()
                    .HasMaxLength(1);

                entity.Property(a => a.Idade)
                    .IsRequired();

                entity.Property(a => a.Peso);

                entity.Property(a => a.EhCastrado);

                entity.HasOne(a => a.Tutor)
                    .WithMany(t => t.Animais)
                    .HasForeignKey(a => a.IdTutor)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(a => a.Castracao)
                    .WithOne(c => c.Animal)
                    .HasForeignKey<Castracao>(c => c.IdAnimal)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<Tutor>(entity =>
            {
                entity.HasKey(t => t.Id);

                entity.Property(t => t.Nome)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(t => t.Endereco)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(t => t.Telefone)
                    .HasMaxLength(15);

                entity.HasCheckConstraint(
                    "CK_Tutores_Nome_NotEmpty",
                    "\"Nome\" IS NOT NULL AND TRIM(\"Nome\") != ''");
            });

            modelBuilder.Entity<Castracao>(entity =>
            {
                entity.HasKey(c => c.Id);

                entity.Property(c => c.DataCastracao)
                    .IsRequired();

                entity.Property(c => c.Valor)
                    .IsRequired();

                entity.Property(c => c.IdAnimal)
                    .IsRequired();

                entity.Property(c => c.IdClinica)
                    .IsRequired();

                entity.Property(c => c.Observacoes)
                    .HasMaxLength(200);

                entity.HasOne(c => c.Clinica)
                    .WithMany(cl => cl.Castracoes)
                    .HasForeignKey(c => c.IdClinica)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<Clinica>(entity =>
            {
                entity.HasKey(cl => cl.Id);

                entity.Property(cl => cl.Nome)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(cl => cl.Telefone)
                    .HasMaxLength(15);
            });

            modelBuilder.Entity<UsuarioSistema>(entity =>
            {
                entity.ToTable("UsuariosSistema");

                entity.HasKey(u => u.Id);

                entity.Property(u => u.NomeUsuario)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(u => u.NomeUsuarioNormalizado)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(u => u.Nome)
                    .IsRequired()
                    .HasMaxLength(150);

                entity.Property(u => u.SenhaHash)
                    .IsRequired();

                entity.Property(u => u.Ativo)
                    .IsRequired();

                entity.Property(u => u.CriadoEmUtc)
                    .IsRequired();

                entity.HasIndex(u => u.NomeUsuarioNormalizado)
                    .IsUnique();
            });
        }
    }
}
