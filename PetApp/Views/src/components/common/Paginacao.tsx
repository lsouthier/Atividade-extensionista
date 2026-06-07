import React from 'react';

interface PaginacaoProps {
    pagina: number;
    tamanhoPagina: number;
    totalRegistros: number;
    opcoesTamanho?: number[];
    onMudarPagina: (pagina: number) => void;
    onMudarTamanhoPagina: (tamanhoPagina: number) => void;
}

const criarPaginasVisiveis = (paginaAtual: number, totalPaginas: number): number[] => {
    const paginas = new Set<number>();

    paginas.add(1);
    paginas.add(totalPaginas);

    for (let i = paginaAtual - 2; i <= paginaAtual + 2; i++) {
        if (i >= 1 && i <= totalPaginas) {
            paginas.add(i);
        }
    }

    return Array.from(paginas).sort((a, b) => a - b);
};

export const Paginacao: React.FC<PaginacaoProps> = ({
    pagina,
    tamanhoPagina,
    totalRegistros,
    opcoesTamanho = [10, 25, 50, 100],
    onMudarPagina,
    onMudarTamanhoPagina
}) => {
    const totalPaginas = totalRegistros === 0
        ? 1
        : Math.ceil(totalRegistros / tamanhoPagina);

    const paginaAtual = Math.min(Math.max(pagina, 1), totalPaginas);

    const inicio = totalRegistros === 0
        ? 0
        : ((paginaAtual - 1) * tamanhoPagina) + 1;

    const fim = Math.min(paginaAtual * tamanhoPagina, totalRegistros);

    const paginasVisiveis = criarPaginasVisiveis(paginaAtual, totalPaginas);

    return (
        <div className="mt-3">
            <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                <small className="text-muted">
                    Mostrando {inicio} até {fim} de {totalRegistros} registros.
                </small>

                <div className="d-flex align-items-center gap-2">
                    <small className="text-muted">Linhas</small>
                    <select
                        className="form-select form-select-sm"
                        style={{ width: 90 }}
                        value={tamanhoPagina}
                        onChange={(e) => onMudarTamanhoPagina(Number(e.target.value))}
                    >
                        {opcoesTamanho.map(opcao => (
                            <option key={opcao} value={opcao}>
                                {opcao}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                <button
                    className="btn btn-outline-secondary btn-sm"
                    disabled={paginaAtual <= 1}
                    onClick={() => onMudarPagina(paginaAtual - 1)}
                >
                    Anterior
                </button>

                <div className="btn-group btn-group-sm flex-wrap">
                    {paginasVisiveis.map((numeroPagina, index) => {
                        const paginaAnterior = paginasVisiveis[index - 1];
                        const mostrarSeparador = paginaAnterior && numeroPagina - paginaAnterior > 1;

                        return (
                            <React.Fragment key={numeroPagina}>
                                {mostrarSeparador && (
                                    <button className="btn btn-outline-secondary" disabled>
                                        ...
                                    </button>
                                )}

                                <button
                                    className={`btn ${numeroPagina === paginaAtual ? 'btn-primary' : 'btn-outline-primary'}`}
                                    onClick={() => onMudarPagina(numeroPagina)}
                                >
                                    {numeroPagina}
                                </button>
                            </React.Fragment>
                        );
                    })}
                </div>

                <button
                    className="btn btn-outline-secondary btn-sm"
                    disabled={paginaAtual >= totalPaginas}
                    onClick={() => onMudarPagina(paginaAtual + 1)}
                >
                    Próxima
                </button>
            </div>
        </div>
    );
};
