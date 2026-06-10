using Microsoft.EntityFrameworkCore;
using PetApp.Models;

namespace PetApp.Services
{
    public class AtualizacaoCastracoesService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<AtualizacaoCastracoesService> _logger;

        public AtualizacaoCastracoesService(
            IServiceScopeFactory scopeFactory,
            ILogger<AtualizacaoCastracoesService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Serviço de atualização automática de castrações iniciado.");

            await ExecutarAtualizacaoAsync(stoppingToken);

            using var timer = new PeriodicTimer(TimeSpan.FromMinutes(30));

            try
            {
                while (await timer.WaitForNextTickAsync(stoppingToken))
                {
                    await ExecutarAtualizacaoAsync(stoppingToken);
                }
            }
            catch (OperationCanceledException)
            {
                _logger.LogInformation("Serviço de atualização automática de castrações finalizado.");
            }
        }

        private async Task ExecutarAtualizacaoAsync(CancellationToken cancellationToken)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<PetAppContext>();

                var hoje = DateTime.Today;

                var castracoesVencidas = await context.Castracoes
                    .Where(c => c.DataCastracao.Date <= hoje)
                    .OrderBy(c => c.DataCastracao)
                    .ToListAsync(cancellationToken);

                if (castracoesVencidas.Count == 0)
                {
                    return;
                }

                var idsAnimais = castracoesVencidas
                    .Select(c => c.IdAnimal)
                    .Distinct()
                    .ToList();

                var animais = await context.Animais
                    .Where(a => idsAnimais.Contains(a.Id))
                    .ToListAsync(cancellationToken);

                var totalAtualizados = 0;

                foreach (var animal in animais)
                {
                    if (animal.EhCastrado)
                    {
                        continue;
                    }

                    var castracaoPrincipal = castracoesVencidas
                        .Where(c => c.IdAnimal == animal.Id)
                        .OrderByDescending(c => c.DataCastracao)
                        .FirstOrDefault();

                    if (castracaoPrincipal == null)
                    {
                        continue;
                    }

                    animal.EhCastrado = true;
                    animal.IdCastracao = castracaoPrincipal.Id;
                    totalAtualizados++;
                }

                if (totalAtualizados > 0)
                {
                    await context.SaveChangesAsync(cancellationToken);

                    _logger.LogInformation(
                        "Atualização automática de castrações marcou {Total} pet(s) como castrado(s).",
                        totalAtualizados
                    );
                }
            }
            catch (OperationCanceledException)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao executar atualização automática de castrações.");
            }
        }
    }
}
