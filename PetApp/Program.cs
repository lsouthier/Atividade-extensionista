using System.Net;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using PetApp.Models;
using PetApp.Services;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddHttpContextAccessor();
builder.Services.AddHostedService<AtualizacaoCastracoesService>();

builder.Services.AddDbContext<PetAppContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders =
        ForwardedHeaders.XForwardedFor |
        ForwardedHeaders.XForwardedProto |
        ForwardedHeaders.XForwardedHost;

    options.KnownIPNetworks.Clear();
    options.KnownProxies.Clear();

    options.KnownIPNetworks.Add(System.Net.IPNetwork.Parse("172.16.0.0/12"));
    options.KnownIPNetworks.Add(System.Net.IPNetwork.Parse("10.0.0.0/8"));
    options.KnownIPNetworks.Add(System.Net.IPNetwork.Parse("192.168.0.0/16"));
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var jwtKey = builder.Configuration["Jwt:Key"];

if (string.IsNullOrWhiteSpace(jwtKey) || jwtKey.Length < 32)
{
    throw new InvalidOperationException("Jwt:Key precisa estar configurada com pelo menos 32 caracteres.");
}

var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "PetApp";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "PetAppFrontend";

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = false;
        options.SaveToken = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,
            ValidateAudience = true,
            ValidAudience = jwtAudience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(2)
        };

        options.Events = new JwtBearerEvents
        {
            OnTokenValidated = async context =>
            {
                var idUsuario = context.Principal?.FindFirstValue(ClaimTypes.NameIdentifier);
                var sessionStampToken = context.Principal?.FindFirstValue("sessionStamp");

                if (!int.TryParse(idUsuario, out var usuarioId) ||
                    string.IsNullOrWhiteSpace(sessionStampToken))
                {
                    context.Fail("Sessão inválida.");
                    return;
                }

                var db = context.HttpContext.RequestServices.GetRequiredService<PetAppContext>();

                var usuario = await db.UsuariosSistema
                    .AsNoTracking()
                    .FirstOrDefaultAsync(u => u.Id == usuarioId);

                if (usuario == null || !usuario.Ativo)
                {
                    context.Fail("Usuário inativo ou inexistente.");
                    return;
                }

                var sessionStampAtual = ObterSessionStamp(usuario);

                if (!string.Equals(sessionStampAtual, sessionStampToken, StringComparison.Ordinal))
                {
                    context.Fail("Sessão expirada por alteração no cadastro do usuário.");
                }
            }
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("PodeLer", policy =>
        policy.RequireRole("Leitura", "Cadastro", "Administrador"));

    options.AddPolicy("PodeCadastrar", policy =>
        policy.RequireRole("Cadastro", "Administrador"));

    options.AddPolicy("Administrador", policy =>
        policy.RequireRole("Administrador"));

    options.FallbackPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("DefaultCorsPolicy", policy =>
    {
        policy
            .AllowAnyOrigin()
            .AllowAnyMethod()
            .AllowAnyHeader();
    });
});

var app = builder.Build();

await InicializarBancoEUsuarioAdminAsync(app);

app.UseForwardedHeaders();

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "PetApp API v1");
    c.RoutePrefix = "swagger";
});

app.UseCors("DefaultCorsPolicy");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

static string ObterSessionStamp(UsuarioSistema usuario)
{
    var dataBase = usuario.AtualizadoEmUtc ?? usuario.CriadoEmUtc;
    return dataBase.ToUniversalTime().Ticks.ToString();
}

static async Task GarantirColunasComplementaresAsync(PetAppContext context)
{
    await context.Database.ExecuteSqlRawAsync(@"
ALTER TABLE ""UsuariosSistema""
ADD COLUMN IF NOT EXISTS ""PerfilAcesso"" character varying(30) NOT NULL DEFAULT 'Administrador';

UPDATE ""UsuariosSistema""
SET ""PerfilAcesso"" = 'Administrador'
WHERE ""PerfilAcesso"" IS NULL
   OR BTRIM(""PerfilAcesso"") = '';

ALTER TABLE ""Animais""
ADD COLUMN IF NOT EXISTS ""DataNascimento"" date;

ALTER TABLE ""Tutores""
ADD COLUMN IF NOT EXISTS ""Cep"" character varying(9) NOT NULL DEFAULT '';

ALTER TABLE ""Tutores""
ADD COLUMN IF NOT EXISTS ""Logradouro"" character varying(200) NOT NULL DEFAULT '';

ALTER TABLE ""Tutores""
ADD COLUMN IF NOT EXISTS ""Numero"" character varying(20) NOT NULL DEFAULT '';

ALTER TABLE ""Tutores""
ADD COLUMN IF NOT EXISTS ""Complemento"" character varying(100) NOT NULL DEFAULT '';

ALTER TABLE ""Tutores""
ADD COLUMN IF NOT EXISTS ""Bairro"" character varying(100) NOT NULL DEFAULT '';

ALTER TABLE ""Tutores""
ADD COLUMN IF NOT EXISTS ""Cidade"" character varying(100) NOT NULL DEFAULT '';

ALTER TABLE ""Tutores""
ADD COLUMN IF NOT EXISTS ""Uf"" character varying(2) NOT NULL DEFAULT '';

ALTER TABLE ""Tutores""
ALTER COLUMN ""Endereco"" TYPE character varying(300);
");
}

static async Task InicializarBancoEUsuarioAdminAsync(WebApplication app)
{
    await using var scope = app.Services.CreateAsyncScope();

    var context = scope.ServiceProvider.GetRequiredService<PetAppContext>();

    await context.Database.MigrateAsync();
    await GarantirColunasComplementaresAsync(context);

    var existeUsuario = await context.UsuariosSistema.AnyAsync();

    if (existeUsuario)
    {
        var usuariosSemPerfil = await context.UsuariosSistema
            .Where(u => string.IsNullOrWhiteSpace(u.PerfilAcesso))
            .ToListAsync();

        foreach (var usuarioSemPerfil in usuariosSemPerfil)
        {
            usuarioSemPerfil.PerfilAcesso = "Administrador";
        }

        var existeAdministradorAtivo = await context.UsuariosSistema
            .AnyAsync(u => u.Ativo && u.PerfilAcesso == "Administrador");

        if (!existeAdministradorAtivo)
        {
            var primeiroUsuarioAtivo = await context.UsuariosSistema
                .Where(u => u.Ativo)
                .OrderBy(u => u.Id)
                .FirstOrDefaultAsync();

            if (primeiroUsuarioAtivo != null)
            {
                primeiroUsuarioAtivo.PerfilAcesso = "Administrador";
            }
        }

        await context.SaveChangesAsync();
        return;
    }

    var usuario = new UsuarioSistema
    {
        NomeUsuario = "admin",
        NomeUsuarioNormalizado = "ADMIN",
        Nome = "Administrador",
        SenhaHash = string.Empty,
        PerfilAcesso = "Administrador",
        Ativo = true,
        CriadoEmUtc = DateTime.UtcNow
    };

    var hasher = new PasswordHasher<UsuarioSistema>();
    usuario.SenhaHash = hasher.HashPassword(usuario, "admin");

    context.UsuariosSistema.Add(usuario);
    await context.SaveChangesAsync();
}
