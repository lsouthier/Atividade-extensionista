import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../../store';
import {
    carregarTutores,
    criarTutor,
    atualizarTutor,
    excluirTutor,
    selecionarTutor,
    limparConfirmacaoExclusao
} from '../../store/tutoresSlice';
import { Tutor, TutorCreate, TutorUpdate } from '../../api/tutoresApi';
import { TutoresList, TutorOrdenacaoCampo, OrdenacaoDirecao } from './TutoresList';
import { TutorForm } from './TutorForm';
import { TutorDeleteModal } from './TutorDeleteModal';
import { Paginacao } from '../common/Paginacao';

const normalizarTexto = (valor?: string | null): string => {
    return (valor ?? '')
        .toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
};

const obterValorOrdenacao = (tutor: Tutor, campo: TutorOrdenacaoCampo): string => {
    switch (campo) {
        case 'nome':
            return normalizarTexto(tutor.nome);
        case 'cep':
            return normalizarTexto(tutor.cep);
        case 'endereco':
            return normalizarTexto(tutor.enderecoCompleto || tutor.endereco);
        case 'bairro':
            return normalizarTexto(tutor.bairro);
        case 'cidade':
            return normalizarTexto(tutor.cidade);
        case 'uf':
            return normalizarTexto(tutor.uf);
        case 'telefone':
            return normalizarTexto(tutor.telefone);
        default:
            return normalizarTexto(tutor.nome);
    }
};

export const TutoresPage: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { itens, carregando, erro, selecionado, confirmacaoExclusao } = useSelector(
        (state: RootState) => state.tutores
    );

    const [modoEdicao, setModoEdicao] = useState(false);
    const [showFormModal, setShowFormModal] = useState(false);
    const [pagina, setPagina] = useState(1);
    const [tamanhoPagina, setTamanhoPagina] = useState(10);
    const [pesquisa, setPesquisa] = useState('');
    const [ordenarPor, setOrdenarPor] = useState<TutorOrdenacaoCampo>('nome');
    const [direcaoOrdenacao, setDirecaoOrdenacao] = useState<OrdenacaoDirecao>('asc');

    useEffect(() => {
        dispatch(carregarTutores());
    }, [dispatch]);

    const tutoresFiltradosOrdenados = useMemo(() => {
        const termo = normalizarTexto(pesquisa);

        const filtrados = itens.filter(tutor => {
            const textoBusca = [
                tutor.nome,
                tutor.cep,
                tutor.endereco,
                tutor.enderecoCompleto,
                tutor.logradouro,
                tutor.numero,
                tutor.complemento,
                tutor.bairro,
                tutor.cidade,
                tutor.uf,
                tutor.telefone
            ]
                .map(normalizarTexto)
                .join(' ');

            return !termo || textoBusca.includes(termo);
        });

        return [...filtrados].sort((a, b) => {
            const valorA = obterValorOrdenacao(a, ordenarPor);
            const valorB = obterValorOrdenacao(b, ordenarPor);

            const comparacao = valorA.localeCompare(valorB, 'pt-BR', {
                numeric: true,
                sensitivity: 'base'
            });

            return direcaoOrdenacao === 'asc' ? comparacao : comparacao * -1;
        });
    }, [itens, pesquisa, ordenarPor, direcaoOrdenacao]);

    const totalPaginas = Math.max(1, Math.ceil(tutoresFiltradosOrdenados.length / tamanhoPagina));

    useEffect(() => {
        if (pagina > totalPaginas) {
            setPagina(totalPaginas);
        }
    }, [pagina, totalPaginas]);

    useEffect(() => {
        setPagina(1);
    }, [pesquisa, ordenarPor, direcaoOrdenacao]);

    const tutoresPaginados = useMemo(() => {
        const inicio = (pagina - 1) * tamanhoPagina;
        return tutoresFiltradosOrdenados.slice(inicio, inicio + tamanhoPagina);
    }, [tutoresFiltradosOrdenados, pagina, tamanhoPagina]);

    const tutorConfirmacao = useMemo(() => {
        if (!confirmacaoExclusao) {
            return null;
        }

        return itens.find(t => t.id === confirmacaoExclusao.id) ?? null;
    }, [confirmacaoExclusao, itens]);

    const handleNovo = () => {
        dispatch(selecionarTutor(null));
        setModoEdicao(false);
        setShowFormModal(true);
    };

    const handleEditar = (tutor: Tutor) => {
        dispatch(selecionarTutor(tutor));
        setModoEdicao(true);
        setShowFormModal(true);
    };

    const handleSalvar = async (dados: TutorCreate | TutorUpdate) => {
        if ('id' in dados && dados.id > 0) {
            const result = await dispatch(atualizarTutor(dados as TutorUpdate));

            if (atualizarTutor.fulfilled.match(result)) {
                setShowFormModal(false);
            }

            return;
        }

        const result = await dispatch(criarTutor(dados as TutorCreate));

        if (criarTutor.fulfilled.match(result)) {
            setShowFormModal(false);
            setPagina(1);
        }
    };

    const handleSolicitarExcluir = async (id: number) => {
        await dispatch(excluirTutor({ id }));
    };

    const handleConfirmarExcluirComPets = async () => {
        if (!confirmacaoExclusao) {
            return;
        }

        await dispatch(excluirTutor({
            id: confirmacaoExclusao.id,
            excluirAnimais: true
        }));
    };

    const handleCancelarExclusaoComPets = () => {
        dispatch(limparConfirmacaoExclusao());
    };

    const handleMudarTamanhoPagina = (novoTamanho: number) => {
        setTamanhoPagina(novoTamanho);
        setPagina(1);
    };

    const handleOrdenar = (campo: TutorOrdenacaoCampo) => {
        if (ordenarPor === campo) {
            setDirecaoOrdenacao(direcaoOrdenacao === 'asc' ? 'desc' : 'asc');
            return;
        }

        setOrdenarPor(campo);
        setDirecaoOrdenacao('asc');
    };

    const limparFiltros = () => {
        setPesquisa('');
        setOrdenarPor('nome');
        setDirecaoOrdenacao('asc');
        setPagina(1);
    };

    return (
        <div className="row">
            <div className="col-12 mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                    <div>
                        <h2 className="h4 mb-0">Lista de Tutores</h2>
                        <small className="text-muted">
                            {tutoresFiltradosOrdenados.length} de {itens.length} tutores exibidos.
                        </small>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={handleNovo}>
                        Novo Tutor
                    </button>
                </div>

                <div className="card mb-3">
                    <div className="card-body">
                        <div className="row g-2">
                            <div className="col-md-10">
                                <label className="form-label">Pesquisar</label>
                                <input
                                    className="form-control form-control-sm"
                                    value={pesquisa}
                                    onChange={(e) => setPesquisa(e.target.value)}
                                    placeholder="Nome, CEP, endereço, bairro, cidade, UF ou telefone"
                                />
                            </div>
                            <div className="col-md-2 d-flex align-items-end">
                                <button className="btn btn-outline-secondary btn-sm w-100" type="button" onClick={limparFiltros}>
                                    Limpar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {carregando && <div className="alert alert-info">Carregando...</div>}
                {erro && <div className="alert alert-danger">{erro}</div>}

                <TutoresList
                    tutores={tutoresPaginados}
                    onEditar={handleEditar}
                    onExcluir={handleSolicitarExcluir}
                    ordenarPor={ordenarPor}
                    direcaoOrdenacao={direcaoOrdenacao}
                    onOrdenar={handleOrdenar}
                />

                {tutoresFiltradosOrdenados.length > 0 && (
                    <Paginacao
                        pagina={pagina}
                        tamanhoPagina={tamanhoPagina}
                        totalRegistros={tutoresFiltradosOrdenados.length}
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
                                    {modoEdicao && selecionado ? 'Editar Tutor' : 'Novo Tutor'}
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setShowFormModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <TutorForm
                                    tutor={modoEdicao ? selecionado ?? undefined : undefined}
                                    onSubmit={handleSalvar}
                                    onCancel={() => setShowFormModal(false)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <TutorDeleteModal
                tutor={tutorConfirmacao}
                totalAnimais={confirmacaoExclusao?.totalAnimais ?? 0}
                mensagem={confirmacaoExclusao?.erro ?? ''}
                onCancel={handleCancelarExclusaoComPets}
                onConfirm={handleConfirmarExcluirComPets}
            />
        </div>
    );
};
