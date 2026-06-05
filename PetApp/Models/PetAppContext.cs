using System.Net;
using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace PetApp.Models
{
    public class PetAppContext : DbContext
    {
        private readonly IHttpContextAccessor? _httpContextAccessor;
        private bool _auditoriaDesabilitada;

        public PetAppContext(
            DbContextOptions<PetAppContext> options,
            IHttpContextAccessor? httpContextAccessor = null)
            : base(options)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public DbSet<Animal> Animais { get; set; } = null!;
        public DbSet<Tutor> Tutores { get; set; } = null!;
        public DbSet<Castracao> Castracoes { get; set; } = null!;
        public DbSet<Clinica> Clinicas { get; set; } = null!;
        public DbSet<UsuarioSistema> UsuariosSistema { get; set; } = null!;
        public DbSet<AuditoriaSistema> AuditoriasSistema { get; set; } = null!;

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

            modelBuilder.Entity<AuditoriaSistema>(entity =>
            {
                entity.ToTable("AuditoriasSistema");

                entity.HasKey(a => a.Id);

                entity.Property(a => a.DataHoraUtc)
                    .IsRequired();

                entity.Property(a => a.UsuarioNome)
                    .IsRequired()
                    .HasMaxLength(150);

                entity.Property(a => a.Acao)
                    .IsRequired()
                    .HasMaxLength(30);

                entity.Property(a => a.Entidade)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(a => a.EntidadeId)
                    .HasMaxLength(100);

                entity.Property(a => a.IpOrigem)
                    .HasMaxLength(100);

                entity.Property(a => a.UserAgent)
                    .HasMaxLength(500);

                entity.HasIndex(a => a.DataHoraUtc);
                entity.HasIndex(a => a.UsuarioNome);
                entity.HasIndex(a => a.Entidade);
                entity.HasIndex(a => a.Acao);
            });
        }

        public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            if (_auditoriaDesabilitada)
            {
                return await base.SaveChangesAsync(cancellationToken);
            }

            var auditoriasPendentes = CriarAuditoriasPendentes();

            var resultado = await base.SaveChangesAsync(cancellationToken);

            if (auditoriasPendentes.Count > 0)
            {
                var auditorias = auditoriasPendentes
                    .Select(CriarAuditoriaFinal)
                    .Where(a => a != null)
                    .Cast<AuditoriaSistema>()
                    .ToList();

                if (auditorias.Count > 0)
                {
                    _auditoriaDesabilitada = true;

                    try
                    {
                        AuditoriasSistema.AddRange(auditorias);
                        await base.SaveChangesAsync(cancellationToken);
                    }
                    finally
                    {
                        _auditoriaDesabilitada = false;
                    }
                }
            }

            return resultado;
        }

        private List<AuditoriaPendente> CriarAuditoriasPendentes()
        {
            ChangeTracker.DetectChanges();

            var httpContext = _httpContextAccessor?.HttpContext;
            var usuario = httpContext?.User;

            var usuarioId = ObterUsuarioId(usuario);
            var usuarioNome = ObterUsuarioNome(usuario);
            var ipOrigem = ObterIpOrigem(httpContext);
            var userAgent = httpContext?.Request?.Headers.UserAgent.ToString();

            var pendentes = new List<AuditoriaPendente>();

            foreach (var entry in ChangeTracker.Entries())
            {
                if (entry.Entity is AuditoriaSistema)
                {
                    continue;
                }

                if (entry.State != EntityState.Added &&
                    entry.State != EntityState.Modified &&
                    entry.State != EntityState.Deleted)
                {
                    continue;
                }

                var nomeEntidade = entry.Entity.GetType().Name;

                var valoresAntes = new Dictionary<string, object?>();
                var valoresDepois = new Dictionary<string, object?>();

                foreach (var property in entry.Properties)
                {
                    if (property.Metadata.IsShadowProperty())
                    {
                        continue;
                    }

                    var nomePropriedade = property.Metadata.Name;

                    if (PropriedadeSensivel(nomePropriedade))
                    {
                        continue;
                    }

                    if (entry.State == EntityState.Added)
                    {
                        valoresDepois[nomePropriedade] = property.CurrentValue;
                    }
                    else if (entry.State == EntityState.Deleted)
                    {
                        valoresAntes[nomePropriedade] = property.OriginalValue;
                    }
                    else if (entry.State == EntityState.Modified && property.IsModified)
                    {
                        var original = property.OriginalValue;
                        var atual = property.CurrentValue;

                        if (!Equals(original, atual))
                        {
                            valoresAntes[nomePropriedade] = original;
                            valoresDepois[nomePropriedade] = atual;
                        }
                    }
                }

                if (entry.State == EntityState.Modified &&
                    valoresAntes.Count == 0 &&
                    valoresDepois.Count == 0)
                {
                    continue;
                }

                pendentes.Add(new AuditoriaPendente
                {
                    Entry = entry,
                    DataHoraUtc = DateTime.UtcNow,
                    UsuarioId = usuarioId,
                    UsuarioNome = usuarioNome,
                    Acao = ObterAcao(entry.State),
                    Entidade = nomeEntidade,
                    ValoresAntes = valoresAntes,
                    ValoresDepois = valoresDepois,
                    IpOrigem = ipOrigem,
                    UserAgent = userAgent
                });
            }

            return pendentes;
        }

        private static AuditoriaSistema? CriarAuditoriaFinal(AuditoriaPendente pendente)
        {
            var entidadeId = ObterEntidadeId(pendente.Entry);

            return new AuditoriaSistema
            {
                DataHoraUtc = pendente.DataHoraUtc,
                UsuarioId = pendente.UsuarioId,
                UsuarioNome = pendente.UsuarioNome,
                Acao = pendente.Acao,
                Entidade = pendente.Entidade,
                EntidadeId = entidadeId,
                ValoresAntes = SerializarValores(pendente.ValoresAntes),
                ValoresDepois = SerializarValores(pendente.ValoresDepois),
                IpOrigem = pendente.IpOrigem,
                UserAgent = pendente.UserAgent
            };
        }

        private static string? ObterEntidadeId(EntityEntry entry)
        {
            var primaryKey = entry.Properties.FirstOrDefault(p => p.Metadata.IsPrimaryKey());

            if (primaryKey == null)
            {
                return null;
            }

            var valor = entry.State == EntityState.Deleted
                ? primaryKey.OriginalValue
                : primaryKey.CurrentValue;

            return valor?.ToString();
        }

        private static int? ObterUsuarioId(ClaimsPrincipal? usuario)
        {
            var id = usuario?.FindFirstValue(ClaimTypes.NameIdentifier);

            if (int.TryParse(id, out var usuarioId))
            {
                return usuarioId;
            }

            return null;
        }

        private static string ObterUsuarioNome(ClaimsPrincipal? usuario)
        {
            var nome = usuario?.FindFirstValue(ClaimTypes.Name);

            if (!string.IsNullOrWhiteSpace(nome))
            {
                return nome;
            }

            return "Sistema";
        }

        private static string ObterAcao(EntityState state)
        {
            return state switch
            {
                EntityState.Added => "CADASTRO",
                EntityState.Modified => "ALTERACAO",
                EntityState.Deleted => "EXCLUSAO",
                _ => "DESCONHECIDO"
            };
        }

        private static string? ObterIpOrigem(HttpContext? httpContext)
        {
            if (httpContext == null)
            {
                return null;
            }

            var headers = httpContext.Request.Headers;

            var candidatos = new List<string?>();

            if (headers.TryGetValue("CF-Connecting-IP", out var cfIp))
            {
                candidatos.Add(cfIp.FirstOrDefault());
            }

            if (headers.TryGetValue("X-Forwarded-For", out var xff))
            {
                candidatos.AddRange(
                    xff.ToString()
                        .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                );
            }

            if (headers.TryGetValue("X-Real-IP", out var realIp))
            {
                candidatos.Add(realIp.FirstOrDefault());
            }

            candidatos.Add(httpContext.Connection.RemoteIpAddress?.ToString());

            foreach (var candidato in candidatos)
            {
                var ip = NormalizarIp(candidato);

                if (string.IsNullOrWhiteSpace(ip))
                {
                    continue;
                }

                if (!EhIpDockerOuInterno(ip))
                {
                    return ip;
                }
            }

            return NormalizarIp(candidatos.FirstOrDefault(c => !string.IsNullOrWhiteSpace(c)));
        }

        private static string? NormalizarIp(string? ip)
        {
            if (string.IsNullOrWhiteSpace(ip))
            {
                return null;
            }

            ip = ip.Trim();

            if (ip.StartsWith("::ffff:", StringComparison.OrdinalIgnoreCase))
            {
                ip = ip.Replace("::ffff:", "", StringComparison.OrdinalIgnoreCase);
            }

            return ip;
        }

        private static bool EhIpDockerOuInterno(string ip)
        {
            if (!IPAddress.TryParse(ip, out var endereco))
            {
                return false;
            }

            if (IPAddress.IsLoopback(endereco))
            {
                return true;
            }

            if (endereco.AddressFamily != System.Net.Sockets.AddressFamily.InterNetwork)
            {
                return false;
            }

            var bytes = endereco.GetAddressBytes();

            if (bytes[0] == 10)
            {
                return true;
            }

            if (bytes[0] == 172 && bytes[1] >= 16 && bytes[1] <= 31)
            {
                return true;
            }

            if (bytes[0] == 192 && bytes[1] == 168)
            {
                return true;
            }

            return false;
        }

        private static bool PropriedadeSensivel(string propriedade)
        {
            var sensiveis = new[]
            {
                "Senha",
                "SenhaHash",
                "NovaSenha",
                "Token",
                "Jwt"
            };

            return sensiveis.Any(s =>
                propriedade.Contains(s, StringComparison.OrdinalIgnoreCase));
        }

        private static string? SerializarValores(Dictionary<string, object?> valores)
        {
            if (valores.Count == 0)
            {
                return null;
            }

            return JsonSerializer.Serialize(
                valores,
                new JsonSerializerOptions
                {
                    WriteIndented = false
                });
        }

        private class AuditoriaPendente
        {
            public required EntityEntry Entry { get; set; }
            public DateTime DataHoraUtc { get; set; }
            public int? UsuarioId { get; set; }
            public string UsuarioNome { get; set; } = "Sistema";
            public string Acao { get; set; } = string.Empty;
            public string Entidade { get; set; } = string.Empty;
            public Dictionary<string, object?> ValoresAntes { get; set; } = new();
            public Dictionary<string, object?> ValoresDepois { get; set; } = new();
            public string? IpOrigem { get; set; }
            public string? UserAgent { get; set; }
        }
    }
}
