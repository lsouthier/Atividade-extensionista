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

                entity.Property(a => a.DataNascimento)
                    .HasColumnType("date");

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
                    .HasMaxLength(300);

                entity.Property(t => t.Cep)
                    .HasMaxLength(9);

                entity.Property(t => t.Logradouro)
                    .HasMaxLength(200);

                entity.Property(t => t.Numero)
                    .HasMaxLength(20);

                entity.Property(t => t.Complemento)
                    .HasMaxLength(100);

                entity.Property(t => t.Bairro)
                    .HasMaxLength(100);

                entity.Property(t => t.Cidade)
                    .HasMaxLength(100);

                entity.Property(t => t.Uf)
                    .HasMaxLength(2);

                entity.Property(t => t.Telefone)
                    .HasMaxLength(20);

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


                entity.Property(u => u.PerfilAcesso)
                    .IsRequired()
                    .HasMaxLength(30);

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
                var auditorias = new List<AuditoriaSistema>();

                foreach (var pendente in auditoriasPendentes)
                {
                    var auditoria = await CriarAuditoriaFinalAsync(pendente, cancellationToken);

                    if (auditoria != null)
                    {
                        auditorias.Add(auditoria);
                    }
                }

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
                    RegistroAntes = CriarContextoRegistro(entry, true),
                    RegistroDepois = CriarContextoRegistro(entry, false),
                    IpOrigem = ipOrigem,
                    UserAgent = userAgent
                });
            }

            return pendentes;
        }

        private async Task<AuditoriaSistema?> CriarAuditoriaFinalAsync(
            AuditoriaPendente pendente,
            CancellationToken cancellationToken)
        {
            var entidadeId = ObterEntidadeId(pendente.Entry);

            await EnriquecerContextoAsync(pendente.RegistroAntes, cancellationToken);
            await EnriquecerContextoAsync(pendente.RegistroDepois, cancellationToken);

            var valoresAntes = pendente.ValoresAntes.Count > 0
                ? CriarPayloadAuditoria(pendente, entidadeId, pendente.RegistroAntes, pendente.ValoresAntes)
                : null;

            var valoresDepois = pendente.ValoresDepois.Count > 0
                ? CriarPayloadAuditoria(pendente, entidadeId, pendente.RegistroDepois, pendente.ValoresDepois)
                : null;

            return new AuditoriaSistema
            {
                DataHoraUtc = pendente.DataHoraUtc,
                UsuarioId = pendente.UsuarioId,
                UsuarioNome = pendente.UsuarioNome,
                Acao = pendente.Acao,
                Entidade = pendente.Entidade,
                EntidadeId = entidadeId,
                ValoresAntes = SerializarObjeto(valoresAntes),
                ValoresDepois = SerializarObjeto(valoresDepois),
                IpOrigem = pendente.IpOrigem,
                UserAgent = pendente.UserAgent
            };
        }

        private Dictionary<string, object?> CriarPayloadAuditoria(
            AuditoriaPendente pendente,
            string? entidadeId,
            Dictionary<string, object?> registro,
            Dictionary<string, object?> alteracoes)
        {
            var registroFormatado = FormatarDicionario(registro);
            var alteracoesFormatadas = FormatarAlteracoes(alteracoes, registro);

            return new Dictionary<string, object?>
            {
                ["Resumo"] = CriarResumo(pendente, registro),
                ["Usuario"] = pendente.UsuarioNome,
                ["Acao"] = pendente.Acao,
                ["Entidade"] = pendente.Entidade,
                ["RegistroId"] = entidadeId,
                ["Registro"] = registroFormatado,
                ["CamposAlterados"] = alteracoes.Keys.ToList(),
                ["Alteracoes"] = alteracoesFormatadas
            };
        }

        private static Dictionary<string, object?> CriarContextoRegistro(EntityEntry entry, bool antes)
        {
            var entidade = entry.Entity.GetType().Name;
            var contexto = new Dictionary<string, object?>();

            switch (entidade)
            {
                case nameof(Animal):
                    AdicionarSeExiste(contexto, "Id", ObterValor(entry, "Id", antes));
                    AdicionarSeExiste(contexto, "Nome", ObterValor(entry, "Nome", antes));
                    AdicionarSeExiste(contexto, "Especie", ObterValor(entry, "Especie", antes));
                    AdicionarSeExiste(contexto, "Raca", ObterValor(entry, "Raca", antes));
                    AdicionarSeExiste(contexto, "Sexo", ObterValor(entry, "Sexo", antes));
                    AdicionarSeExiste(contexto, "DataNascimento", ObterValor(entry, "DataNascimento", antes));
                    AdicionarSeExiste(contexto, "Idade", ObterValor(entry, "Idade", antes));
                    AdicionarSeExiste(contexto, "Peso", ObterValor(entry, "Peso", antes));
                    AdicionarSeExiste(contexto, "TutorId", ObterValor(entry, "IdTutor", antes));
                    AdicionarSeExiste(contexto, "EhCastrado", ObterValor(entry, "EhCastrado", antes));
                    break;

                case nameof(Tutor):
                    AdicionarSeExiste(contexto, "Id", ObterValor(entry, "Id", antes));
                    AdicionarSeExiste(contexto, "Nome", ObterValor(entry, "Nome", antes));
                    AdicionarSeExiste(contexto, "Endereco", ObterValor(entry, "Endereco", antes));
                    AdicionarSeExiste(contexto, "Telefone", ObterValor(entry, "Telefone", antes));
                    break;

                case nameof(Clinica):
                    AdicionarSeExiste(contexto, "Id", ObterValor(entry, "Id", antes));
                    AdicionarSeExiste(contexto, "Nome", ObterValor(entry, "Nome", antes));
                    AdicionarSeExiste(contexto, "Telefone", ObterValor(entry, "Telefone", antes));
                    AdicionarSeExiste(contexto, "VeterinarioResponsavel", ObterValor(entry, "VeterinarioResponsavel", antes));
                    break;

                case nameof(Castracao):
                    AdicionarSeExiste(contexto, "Id", ObterValor(entry, "Id", antes));
                    AdicionarSeExiste(contexto, "DataCastracao", ObterValor(entry, "DataCastracao", antes));
                    AdicionarSeExiste(contexto, "Valor", ObterValor(entry, "Valor", antes));
                    AdicionarSeExiste(contexto, "AnimalId", ObterValor(entry, "IdAnimal", antes));
                    AdicionarSeExiste(contexto, "ClinicaId", ObterValor(entry, "IdClinica", antes));
                    AdicionarSeExiste(contexto, "Observacoes", ObterValor(entry, "Observacoes", antes));
                    break;

                case nameof(UsuarioSistema):
                    AdicionarSeExiste(contexto, "Id", ObterValor(entry, "Id", antes));
                    AdicionarSeExiste(contexto, "NomeUsuario", ObterValor(entry, "NomeUsuario", antes));
                    AdicionarSeExiste(contexto, "Nome", ObterValor(entry, "Nome", antes));
                    AdicionarSeExiste(contexto, "PerfilAcesso", ObterValor(entry, "PerfilAcesso", antes));
                    AdicionarSeExiste(contexto, "Ativo", ObterValor(entry, "Ativo", antes));
                    break;

                default:
                    foreach (var property in entry.Properties)
                    {
                        if (property.Metadata.IsShadowProperty() ||
                            PropriedadeSensivel(property.Metadata.Name))
                        {
                            continue;
                        }

                        AdicionarSeExiste(
                            contexto,
                            property.Metadata.Name,
                            ObterValor(entry, property.Metadata.Name, antes));
                    }

                    break;
            }

            return contexto;
        }

        private async Task EnriquecerContextoAsync(
            Dictionary<string, object?> contexto,
            CancellationToken cancellationToken)
        {
            if (contexto.Count == 0)
            {
                return;
            }

            if (contexto.TryGetValue("TutorId", out var tutorId))
            {
                var nomeTutor = await ObterNomeTutorAsync(tutorId, cancellationToken);

                if (!string.IsNullOrWhiteSpace(nomeTutor))
                {
                    contexto["Tutor"] = nomeTutor;
                }
            }

            if (contexto.TryGetValue("AnimalId", out var animalId))
            {
                var nomeAnimal = await ObterNomeAnimalAsync(animalId, cancellationToken);

                if (!string.IsNullOrWhiteSpace(nomeAnimal))
                {
                    contexto["Animal"] = nomeAnimal;
                }
            }

            if (contexto.TryGetValue("ClinicaId", out var clinicaId))
            {
                var nomeClinica = await ObterNomeClinicaAsync(clinicaId, cancellationToken);

                if (!string.IsNullOrWhiteSpace(nomeClinica))
                {
                    contexto["Clinica"] = nomeClinica;
                }
            }
        }

        private async Task<string?> ObterNomeTutorAsync(object? id, CancellationToken cancellationToken)
        {
            var tutorId = ConverterParaInt(id);

            if (!tutorId.HasValue)
            {
                return null;
            }

            return await Tutores
                .AsNoTracking()
                .Where(t => t.Id == tutorId.Value)
                .Select(t => t.Nome)
                .FirstOrDefaultAsync(cancellationToken);
        }

        private async Task<string?> ObterNomeAnimalAsync(object? id, CancellationToken cancellationToken)
        {
            var animalId = ConverterParaInt(id);

            if (!animalId.HasValue)
            {
                return null;
            }

            return await Animais
                .AsNoTracking()
                .Where(a => a.Id == animalId.Value)
                .Select(a => a.Nome)
                .FirstOrDefaultAsync(cancellationToken);
        }

        private async Task<string?> ObterNomeClinicaAsync(object? id, CancellationToken cancellationToken)
        {
            var clinicaId = ConverterParaInt(id);

            if (!clinicaId.HasValue)
            {
                return null;
            }

            return await Clinicas
                .AsNoTracking()
                .Where(c => c.Id == clinicaId.Value)
                .Select(c => c.Nome)
                .FirstOrDefaultAsync(cancellationToken);
        }

        private static int? ConverterParaInt(object? valor)
        {
            if (valor == null)
            {
                return null;
            }

            if (valor is int inteiro)
            {
                return inteiro;
            }

            if (int.TryParse(valor.ToString(), out var convertido))
            {
                return convertido;
            }

            return null;
        }

        private static object? ObterValor(EntityEntry entry, string nomePropriedade, bool antes)
        {
            var propriedade = entry.Properties
                .FirstOrDefault(p => p.Metadata.Name == nomePropriedade);

            if (propriedade == null)
            {
                return null;
            }

            return entry.State switch
            {
                EntityState.Added => antes ? null : propriedade.CurrentValue,
                EntityState.Deleted => propriedade.OriginalValue,
                EntityState.Modified => antes ? propriedade.OriginalValue : propriedade.CurrentValue,
                _ => propriedade.CurrentValue
            };
        }

        private static void AdicionarSeExiste(
            Dictionary<string, object?> dicionario,
            string chave,
            object? valor)
        {
            if (valor == null)
            {
                return;
            }

            dicionario[chave] = valor;
        }

        private static string CriarResumo(AuditoriaPendente pendente, Dictionary<string, object?> registro)
        {
            var nome = ObterPrimeiroTexto(registro, "Nome", "Animal", "Tutor", "Clinica", "NomeUsuario");

            if (!string.IsNullOrWhiteSpace(nome))
            {
                return $"{pendente.Entidade} {nome} - {TraduzirAcao(pendente.Acao)}";
            }

            return $"{pendente.Entidade} - {TraduzirAcao(pendente.Acao)}";
        }

        private static string? ObterPrimeiroTexto(Dictionary<string, object?> dicionario, params string[] chaves)
        {
            foreach (var chave in chaves)
            {
                if (dicionario.TryGetValue(chave, out var valor) &&
                    !string.IsNullOrWhiteSpace(valor?.ToString()))
                {
                    return valor.ToString();
                }
            }

            return null;
        }

        private static string TraduzirAcao(string acao)
        {
            return acao switch
            {
                "CADASTRO" => "cadastrado",
                "ALTERACAO" => "alterado",
                "EXCLUSAO" => "excluído",
                "LOGIN" => "login realizado",
                _ => acao
            };
        }

        private static Dictionary<string, object?> FormatarDicionario(Dictionary<string, object?> valores)
        {
            var formatado = new Dictionary<string, object?>();

            foreach (var item in valores)
            {
                formatado[item.Key] = FormatarValor(item.Key, item.Value);
            }

            if (valores.TryGetValue("DataNascimento", out var dataNascimento))
            {
                formatado["IdadeDetalhada"] = CalcularIdadeDescricao(dataNascimento);
            }

            return formatado;
        }

        private static Dictionary<string, object?> FormatarAlteracoes(
            Dictionary<string, object?> alteracoes,
            Dictionary<string, object?> registro)
        {
            var formatado = new Dictionary<string, object?>();

            foreach (var item in alteracoes)
            {
                if (item.Key == "Idade" && registro.TryGetValue("DataNascimento", out var dataNascimento))
                {
                    formatado[item.Key] = CalcularIdadeDescricao(dataNascimento);
                    continue;
                }

                formatado[item.Key] = FormatarValor(item.Key, item.Value);
            }

            if (alteracoes.ContainsKey("DataNascimento") && registro.TryGetValue("DataNascimento", out var data))
            {
                formatado["IdadeDetalhada"] = CalcularIdadeDescricao(data);
            }

            return formatado;
        }

        private static object? FormatarValor(string propriedade, object? valor)
        {
            if (valor == null)
            {
                return null;
            }

            if (valor is DateTime data)
            {
                if (propriedade.Contains("Data", StringComparison.OrdinalIgnoreCase))
                {
                    return data.ToString("dd/MM/yyyy");
                }

                return data.ToString("dd/MM/yyyy HH:mm:ss");
            }

            if (valor is bool booleano)
            {
                return booleano ? "Sim" : "Não";
            }

            if (valor is decimal decimalValor)
            {
                return decimalValor.ToString("N2");
            }

            return valor;
        }

        private static string CalcularIdadeDescricao(object? dataNascimento)
        {
            if (dataNascimento == null)
            {
                return "Não informado";
            }

            DateTime data;

            if (dataNascimento is DateTime dataConvertida)
            {
                data = dataConvertida.Date;
            }
            else if (!DateTime.TryParse(dataNascimento.ToString(), out data))
            {
                return "Não informado";
            }

            var hoje = DateTime.Today;

            if (data > hoje)
            {
                return "Data futura";
            }

            var anos = hoje.Year - data.Year;
            var meses = hoje.Month - data.Month;

            if (hoje.Day < data.Day)
            {
                meses--;
            }

            if (meses < 0)
            {
                anos--;
                meses += 12;
            }

            anos = Math.Max(anos, 0);
            meses = Math.Max(meses, 0);

            if (anos == 0 && meses == 0)
            {
                return "Menos de 1 mês";
            }

            if (anos == 0)
            {
                return meses == 1 ? "1 mês" : $"{meses} meses";
            }

            if (meses == 0)
            {
                return anos == 1 ? "1 ano" : $"{anos} anos";
            }

            var textoAnos = anos == 1 ? "1 ano" : $"{anos} anos";
            var textoMeses = meses == 1 ? "1 mês" : $"{meses} meses";

            return $"{textoAnos} e {textoMeses}";
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

        private static string? SerializarObjeto(object? valor)
        {
            if (valor == null)
            {
                return null;
            }

            return JsonSerializer.Serialize(
                valor,
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
            public Dictionary<string, object?> RegistroAntes { get; set; } = new();
            public Dictionary<string, object?> RegistroDepois { get; set; } = new();
            public string? IpOrigem { get; set; }
            public string? UserAgent { get; set; }
        }
    }
}
