import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../../store';
import {
    carregarCastracoes,
    criarCastracao,
    atualizarCastracao,
    excluirCastracao,
    selecionarCastracao
} from '../../store/castracoeSlice';
import { Castracao, CastracaoCreate, CastracaoUpdate } from '../../api/castracoeApi';
import { CastracoesList, CastracaoOrdenacaoCampo, OrdenacaoDirecao } from './CastracoesList';
import { CastracaoForm } from './CastracaoForm';
import { CastracaoDeleteModal } from './CastracaoDeleteModal';
import { Paginacao } from '../common/Paginacao';

const normalizarTexto = (valor?: string | null): string => {
    return (valor ?? '')
        .toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
};

const obterDataIso = (data: string): string => {
    if (!data) {
        return '';
    }

    return data.split('T')[0];
};

const dentroDoPeriodo = (data: string, inicio: string, fim: string): boolean => {
    const dataIso = obterDataIso(data);

    if (!dataIso) {
        return false;
    }

    if (inicio && dataIso < inicio) {
        return false;
    }

    if (fim && dataIso > fim) {
        return false;
    }

    return true;
};

const obterValorOrdenacao = (castracao: Castracao, campo: CastracaoOrdenacaoCampo): string | number => {
    switch (campo) {
        case 'data':
            return obterDataIso(castracao.dataCastracao);
        case 'animal':
            return normalizarTexto(castracao.nomeAnimal);
        case 'clinica':
            return normalizarTexto(castracao.nomeClinica);
        case 'valor':
            return castracao.valor ?? 0;
        default:
            return obterDataIso(castracao.dataCastracao);
    }
};

export const CastracoesPa: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { itens, carregando, erro, selecionado } = useSelector(
        (state: RootState) => state.castracoes
    );

    const [modoEdicao, setModoEdicao] = useState(false);
    const [idParaExcluir, setIdParaExcluir] = useState<number | null>(null);
    const [showFormModal, setShowFormModal] = useState(false);
    const [pagina, setPagina] = useState(1);
    const [tamanhoPagina, setTamanhoPagina] = useState(10);

    const [pesquisa, setPesquisa] = useState('');
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');
    const [ordenarPor, setOrdenarPor] = useState<CastracaoOrdenacaoCampo>('data');
    const [direcaoOrdenacao, setDirecaoOrdenacao] = useState<OrdenacaoDirecao>('desc');

    useEffect(() => {
        dispatch(carregarCastracoes());
    }, [dispatch]);

    const castracoesFiltradasOrdenadas = useMemo(() => {
        const termo = normalizarTexto(pesquisa);

        const filtradas = itens.filter(castracao => {
            const textoBusca = [
                castracao.nomeAnimal,
                castracao.nomeClinica,
                castracao.observacoes
            ]
                .map(normalizarTexto)
                .join(' ');

            const atendePesquisa = !termo || textoBusca.includes(termo);
            const atendePeriodo = dentroDoPeriodo(castracao.dataCastracao, dataInicio, dataFim);

            return atendePesquisa && atendePeriodo;
        });

        return [...filtradas].sort((a, b) => {
            const valorA = obterValorOrdenacao(a, ordenarPor);
            const valorB = obterValorOrdenacao(b, ordenarPor);

            if (typeof valorA === 'number' && typeof valorB === 'number') {
                return direcaoOrdenacao === 'asc'
                    ? valorA - valorB
                    : valorB - valorA;
            }

            const comparacao = String(valorA).localeCompare(String(valorB), 'pt-BR', {
                numeric: true,
                sensitivity: 'base'
            });

            return direcaoOrdenacao === 'asc' ? comparacao : comparacao * -1;
        });
    }, [itens, pesquisa, dataInicio, dataFim, ordenarPor, direcaoOrdenacao]);

    const totalPaginas = Math.max(1, Math.ceil(castracoesFiltradasOrdenadas.length / tamanhoPagina));

    useEffect(() => {
        if (pagina > totalPaginas) {
            setPagina(totalPaginas);
        }
    }, [pagina, totalPaginas]);

    useEffect(() => {
        setPagina(1);
    }, [pesquisa, dataInicio, dataFim, ordenarPor, direcaoOrdenacao]);

    const castracoesPaginadas = useMemo(() => {
        const inicio = (pagina - 1) * tamanhoPagina;
        return castracoesFiltradasOrdenadas.slice(inicio, inicio + tamanhoPagina);
    }, [castracoesFiltradasOrdenadas, pagina, tamanhoPagina]);

    const handleNovo = () => {
        dispatch(selecionarCastracao(null));
        setModoEdicao(false);
        setShowFormModal(true);
    };

    const handleEditar = (castracao: Castracao) => {
        dispatch(selecionarCastracao(castracao));
        setModoEdicao(true);
        setShowFormModal(true);
    };

    const handleSalvar = async (dados: CastracaoCreate | CastracaoUpdate) => {
        if ('id' in dados && dados.id > 0) {
            await dispatch(atualizarCastracao(dados as CastracaoUpdate));
        } else {
            await dispatch(criarCastracao(dados as CastracaoCreate));
            setPagina(1);
        }

        setShowFormModal(false);
    };

    const handleCancelar = () => {
        setShowFormModal(false);
    };

    const handleConfirmarExcluir = async () => {
        if (idParaExcluir !== null) {
            await dispatch(excluirCastracao(idParaExcluir));
            setIdParaExcluir(null);
        }
    };

    const handleMudarTamanhoPagina = (novoTamanho: number) => {
        setTamanhoPagina(novoTamanho);
        setPagina(1);
    };

    const handleOrdenar = (campo: CastracaoOrdenacaoCampo) => {
        if (ordenarPor === campo) {
            setDirecaoOrdenacao(direcaoOrdenacao === 'asc' ? 'desc' : 'asc');
            return;
        }

        setOrdenarPor(campo);
        setDirecaoOrdenacao(campo === 'data' ? 'desc' : 'asc');
    };

    const limparFiltros = () => {
        setPesquisa('');
        setDataInicio('');
        setDataFim('');
        setOrdenarPor('data');
        setDirecaoOrdenacao('desc');
        setPagina(1);
    };

    return (
        <div className="row">
            <div className="col-12 mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                    <div>
                        <h2 className="h4 mb-0">Lista de Castrações</h2>
                        <small className="text-muted">
                            {castracoesFiltradasOrdenadas.length} de {itens.length} castrações exibidas.
                        </small>
                    </div>

                    <button className="btn btn-primary btn-sm" onClick={handleNovo}>
                        Nova Castração
                    </button>
                </div>

                <div className="card mb-3">
                    <div className="card-body">
                        <div className="row g-2">
                            <div className="col-md-5">
                                <label className="form-label">Pesquisar</label>
                                <input
                                    className="form-control form-control-sm"
                                    value={pesquisa}
                                    onChange={(e) => setPesquisa(e.target.value)}
                                    placeholder="Animal, clínica ou observações"
                                />
                            </div>

                            <div className="col-md-2">
                                <label className="form-label">Data inicial</label>
                                <input
                                    type="date"
                                    className="form-control form-control-sm"
                                    value={dataInicio}
                                    onChange={(e) => setDataInicio(e.target.value)}
                                />
                            </div>

                            <div className="col-md-2">
                                <label className="form-label">Data final</label>
                                <input
                                    type="date"
                                    className="form-control form-control-sm"
                                    value={dataFim}
                                    onChange={(e) => setDataFim(e.target.value)}
                                />
                            </div>

                            <div className="col-md-3 d-flex align-items-end">
                                <button
                                    className="btn btn-outline-secondary btn-sm w-100"
                                    type="button"
                                    onClick={limparFiltros}
                                >
                                    Limpar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {carregando && <div className="alert alert-info">Carregando...</div>}
                {erro && <div className="alert alert-danger">{erro}</div>}

                <CastracoesList
                    castracoes={castracoesPaginadas}
                    onEditar={handleEditar}
                    onExcluir={(id) => setIdParaExcluir(id)}
                    ordenarPor={ordenarPor}
                    direcaoOrdenacao={direcaoOrdenacao}
                    onOrdenar={handleOrdenar}
                />

                {castracoesFiltradasOrdenadas.length > 0 && (
                    <Paginacao
                        pagina={pagina}
                        tamanhoPagina={tamanhoPagina}
                        totalRegistros={castracoesFiltradasOrdenadas.length}
                        onMudarPagina={setPagina}
                        onMudarTamanhoPagina={handleMudarTamanhoPagina}
                    />
                )}
            </div>

            {showFormModal && (
                <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {modoEdicao && selecionado ? 'Editar Castração' : 'Nova Castração'}
                                </h5>
                                <button type="button" className="btn-close" onClick={handleCancelar}></button>
                            </div>
                            <div className="modal-body">
                                <CastracaoForm
                                    castracao={selecionado || undefined}
                                    onSubmit={handleSalvar}
                                    onCancel={handleCancelar}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <CastracaoDeleteModal
                id={idParaExcluir}
                onCancel={() => setIdParaExcluir(null)}
                onConfirm={handleConfirmarExcluir}
            />
        </div>
    );
};
