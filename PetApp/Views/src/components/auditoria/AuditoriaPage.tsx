import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../store';
import { carregarAuditorias } from '../../store/auditoriaSlice';
import { Auditoria } from '../../api/auditoriaApi';

const formatarDataHora = (dataUtc: string): string => {
    if (!dataUtc) {
        return '';
    }

    return new Date(dataUtc).toLocaleString('pt-BR');
};

const formatarIsoParaDataBr = (valor: string): string => {
    if (!valor) {
        return '';
    }

    const somenteData = valor.split('T')[0];
    const [ano, mes, dia] = somenteData.split('-');

    if (!ano || !mes || !dia) {
        return valor;
    }

    return `${dia}/${mes}/${ano}`;
};

const calcularIdadeDescricao = (dataNascimento?: string | null, idade?: number): string => {
    if (!dataNascimento) {
        if (idade === undefined || idade === null) {
            return '-';
        }

        return idade === 1 ? '1 ano' : `${idade} anos`;
    }

    const somenteData = dataNascimento.split('T')[0];
    const [anoTexto, mesTexto, diaTexto] = somenteData.split('-');

    const ano = Number(anoTexto);
    const mes = Number(mesTexto);
    const dia = Number(diaTexto);

    if (!ano || !mes || !dia) {
        if (idade === undefined || idade === null) {
            return '-';
        }

        return idade === 1 ? '1 ano' : `${idade} anos`;
    }

    const nascimento = new Date(ano, mes - 1, dia);
    const hoje = new Date();

    if (nascimento > hoje) {
        return 'Data futura';
    }

    let anos = hoje.getFullYear() - nascimento.getFullYear();
    let meses = hoje.getMonth() - nascimento.getMonth();

    if (hoje.getDate() < nascimento.getDate()) {
        meses--;
    }

    if (meses < 0) {
        anos--;
        meses += 12;
    }

    anos = Math.max(anos, 0);
    meses = Math.max(meses, 0);

    if (anos === 0 && meses === 0) {
        return 'Menos de 1 mês';
    }

    if (anos === 0) {
        return meses === 1 ? '1 mês' : `${meses} meses`;
    }

    if (meses === 0) {
        return anos === 1 ? '1 ano' : `${anos} anos`;
    }

    const textoAnos = anos === 1 ? '1 ano' : `${anos} anos`;
    const textoMeses = meses === 1 ? '1 mês' : `${meses} meses`;

    return `${textoAnos} e ${textoMeses}`;
};

const transformarObjetoAuditoria = (objeto: any): any => {
    if (!objeto || typeof objeto !== 'object' || Array.isArray(objeto)) {
        return objeto;
    }

    const copia: any = { ...objeto };

    if (typeof copia.DataNascimento === 'string') {
        copia.DataNascimento = formatarIsoParaDataBr(copia.DataNascimento);
    }

    if ('Idade' in copia) {
        copia.Idade = calcularIdadeDescricao(
            typeof objeto.DataNascimento === 'string' ? objeto.DataNascimento : null,
            typeof objeto.Idade === 'number' ? objeto.Idade : undefined
        );
    }

    return copia;
};

const formatarJson = (valor?: string | null): string => {
    if (!valor) {
        return '-';
    }

    try {
        const parsed = JSON.parse(valor);
        const tratado = transformarObjetoAuditoria(parsed);

        return JSON.stringify(tratado, null, 2);
    } catch {
        return valor;
    }
};

const badgeAcao = (acao: string): string => {
    switch (acao) {
        case 'LOGIN':
            return 'bg-info';
        case 'CADASTRO':
            return 'bg-success';
        case 'ALTERACAO':
            return 'bg-warning text-dark';
        case 'EXCLUSAO':
            return 'bg-danger';
        default:
            return 'bg-secondary';
    }
};

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

export const AuditoriaPage: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const {
        itens,
        carregando,
        erro,
        pagina,
        tamanhoPagina,
        totalRegistros,
        totalPaginas
    } = useSelector((state: RootState) => state.auditoria);

    const [entidade, setEntidade] = useState('');
    const [acao, setAcao] = useState('');
    const [usuario, setUsuario] = useState('');
    const [tamanhoPaginaLocal, setTamanhoPaginaLocal] = useState(25);
    const [detalhe, setDetalhe] = useState<Auditoria | null>(null);

    const carregar = (paginaSolicitada = 1, tamanhoSolicitado = tamanhoPaginaLocal) => {
        dispatch(carregarAuditorias({
            pagina: paginaSolicitada,
            tamanhoPagina: tamanhoSolicitado,
            entidade: entidade || undefined,
            acao: acao || undefined,
            usuario: usuario || undefined
        }));
    };

    useEffect(() => {
        carregar(1, tamanhoPaginaLocal);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dispatch]);

    const handleFiltrar = () => {
        carregar(1, tamanhoPaginaLocal);
    };

    const handleAtualizar = () => {
        carregar(pagina, tamanhoPaginaLocal);
    };

    const handleTamanhoPagina = (novoTamanho: number) => {
        setTamanhoPaginaLocal(novoTamanho);
        carregar(1, novoTamanho);
    };

    const inicio = totalRegistros === 0
        ? 0
        : ((pagina - 1) * tamanhoPagina) + 1;

    const fim = Math.min(pagina * tamanhoPagina, totalRegistros);

    const paginasVisiveis = criarPaginasVisiveis(pagina, totalPaginas);

    return (
        <div className="row">
            <div className="col-12 mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                    <div>
                        <h2 className="h4 mb-0">Auditoria e Fluxo de Dados</h2>
                        <small className="text-muted">
                            Histórico de logins, cadastros, edições e exclusões realizadas no sistema.
                        </small>
                    </div>

                    <button className="btn btn-primary btn-sm" onClick={handleAtualizar}>
                        Atualizar
                    </button>
                </div>

                <div className="card mb-3">
                    <div className="card-body">
                        <div className="row g-2">
                            <div className="col-md-3">
                                <label className="form-label">Entidade</label>
                                <select
                                    className="form-select form-select-sm"
                                    value={entidade}
                                    onChange={(e) => setEntidade(e.target.value)}
                                >
                                    <option value="">Todas</option>
                                    <option value="Auth">Auth</option>
                                    <option value="Animal">Animal</option>
                                    <option value="Tutor">Tutor</option>
                                    <option value="Clinica">Clinica</option>
                                    <option value="Castracao">Castracao</option>
                                    <option value="UsuarioSistema">UsuarioSistema</option>
                                </select>
                            </div>

                            <div className="col-md-3">
                                <label className="form-label">Ação</label>
                                <select
                                    className="form-select form-select-sm"
                                    value={acao}
                                    onChange={(e) => setAcao(e.target.value)}
                                >
                                    <option value="">Todas</option>
                                    <option value="LOGIN">LOGIN</option>
                                    <option value="CADASTRO">CADASTRO</option>
                                    <option value="ALTERACAO">ALTERAÇÃO</option>
                                    <option value="EXCLUSAO">EXCLUSÃO</option>
                                </select>
                            </div>

                            <div className="col-md-3">
                                <label className="form-label">Usuário</label>
                                <input
                                    className="form-control form-control-sm"
                                    value={usuario}
                                    onChange={(e) => setUsuario(e.target.value)}
                                    placeholder="Ex.: admin"
                                />
                            </div>

                            <div className="col-md-1">
                                <label className="form-label">Linhas</label>
                                <select
                                    className="form-select form-select-sm"
                                    value={tamanhoPaginaLocal}
                                    onChange={(e) => handleTamanhoPagina(Number(e.target.value))}
                                >
                                    <option value={10}>10</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                            </div>

                            <div className="col-md-2 d-flex align-items-end">
                                <button className="btn btn-secondary btn-sm w-100" onClick={handleFiltrar}>
                                    Filtrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {carregando && <div className="alert alert-info">Carregando auditoria...</div>}
                {erro && <div className="alert alert-danger">{erro}</div>}

                {!carregando && itens.length === 0 && (
                    <div className="alert alert-secondary">Nenhum registro de auditoria encontrado.</div>
                )}

                {itens.length > 0 && (
                    <>
                        <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                            <small className="text-muted">
                                Mostrando {inicio} até {fim} de {totalRegistros} registros.
                            </small>

                            <small className="text-muted">
                                Página {pagina} de {totalPaginas}
                            </small>
                        </div>

                        <div className="table-responsive">
                            <table className="table table-sm table-striped align-middle">
                                <thead className="table-light">
                                    <tr>
                                        <th>Data/Hora</th>
                                        <th>Usuário</th>
                                        <th>Ação</th>
                                        <th>Entidade</th>
                                        <th>ID Registro</th>
                                        <th>IP</th>
                                        <th style={{ width: 100 }}>Detalhes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {itens.map(item => (
                                        <tr key={item.id}>
                                            <td>{formatarDataHora(item.dataHoraUtc)}</td>
                                            <td>{item.usuarioNome}</td>
                                            <td>
                                                <span className={`badge ${badgeAcao(item.acao)}`}>
                                                    {item.acao}
                                                </span>
                                            </td>
                                            <td>{item.entidade}</td>
                                            <td>{item.entidadeId ?? '-'}</td>
                                            <td>{item.ipOrigem ?? '-'}</td>
                                            <td>
                                                <button
                                                    className="btn btn-outline-primary btn-sm"
                                                    onClick={() => setDetalhe(item)}
                                                >
                                                    Ver
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
                            <button
                                className="btn btn-outline-secondary btn-sm"
                                disabled={pagina <= 1 || carregando}
                                onClick={() => carregar(pagina - 1, tamanhoPaginaLocal)}
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
                                                className={`btn ${numeroPagina === pagina ? 'btn-primary' : 'btn-outline-primary'}`}
                                                disabled={carregando}
                                                onClick={() => carregar(numeroPagina, tamanhoPaginaLocal)}
                                            >
                                                {numeroPagina}
                                            </button>
                                        </React.Fragment>
                                    );
                                })}
                            </div>

                            <button
                                className="btn btn-outline-secondary btn-sm"
                                disabled={pagina >= totalPaginas || carregando}
                                onClick={() => carregar(pagina + 1, tamanhoPaginaLocal)}
                            >
                                Próxima
                            </button>
                        </div>
                    </>
                )}
            </div>

            {detalhe && (
                <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-xl">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Detalhes da Auditoria #{detalhe.id}</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setDetalhe(null)}
                                ></button>
                            </div>

                            <div className="modal-body">
                                <div className="row mb-3">
                                    <div className="col-md-3">
                                        <strong>Data/Hora:</strong><br />
                                        {formatarDataHora(detalhe.dataHoraUtc)}
                                    </div>
                                    <div className="col-md-3">
                                        <strong>Usuário:</strong><br />
                                        {detalhe.usuarioNome}
                                    </div>
                                    <div className="col-md-3">
                                        <strong>Ação:</strong><br />
                                        {detalhe.acao}
                                    </div>
                                    <div className="col-md-3">
                                        <strong>Entidade:</strong><br />
                                        {detalhe.entidade} #{detalhe.entidadeId ?? '-'}
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <strong>User-Agent:</strong><br />
                                    <small>{detalhe.userAgent ?? '-'}</small>
                                </div>

                                <div className="row">
                                    <div className="col-md-6">
                                        <h6>Valores antes</h6>
                                        <pre className="bg-light p-3 rounded small" style={{ whiteSpace: 'pre-wrap' }}>
                                            {formatarJson(detalhe.valoresAntes)}
                                        </pre>
                                    </div>

                                    <div className="col-md-6">
                                        <h6>Valores depois</h6>
                                        <pre className="bg-light p-3 rounded small" style={{ whiteSpace: 'pre-wrap' }}>
                                            {formatarJson(detalhe.valoresDepois)}
                                        </pre>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setDetalhe(null)}>
                                    Fechar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
