import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../../store';
import {
    carregarClinicas,
    criarClinica,
    atualizarClinica,
    excluirClinica,
    selecionarClinica,
    limparConfirmacaoExclusaoClinica
} from '../../store/clinicasSlice';
import { Clinica, ClinicaCreate, ClinicaUpdate } from '../../api/clinicasApi';
import { ClinicasList, ClinicaOrdenacaoCampo, OrdenacaoDirecao } from './ClinicasList';
import { ClinicaForm } from './ClinicaForm';
import { ClinicaDeleteModal } from './ClinicaDeleteModal';
import { Paginacao } from '../common/Paginacao';

const normalizarTexto = (valor?: string | null): string => {
    return (valor ?? '')
        .toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
};

const obterValorOrdenacao = (clinica: Clinica, campo: ClinicaOrdenacaoCampo): string => {
    switch (campo) {
        case 'nome':
            return normalizarTexto(clinica.nome);
        case 'telefone':
            return normalizarTexto(clinica.telefone);
        case 'veterinarioResponsavel':
            return normalizarTexto(clinica.veterinarioResponsavel);
        default:
            return normalizarTexto(clinica.nome);
    }
};

export const ClinicasPage: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { itens, carregando, erro, selecionado, confirmacaoExclusao } = useSelector(
        (state: RootState) => state.clinicas
    );

    const [modoEdicao, setModoEdicao] = useState(false);
    const [showFormModal, setShowFormModal] = useState(false);
    const [pagina, setPagina] = useState(1);
    const [tamanhoPagina, setTamanhoPagina] = useState(10);

    const [pesquisa, setPesquisa] = useState('');
    const [ordenarPor, setOrdenarPor] = useState<ClinicaOrdenacaoCampo>('nome');
    const [direcaoOrdenacao, setDirecaoOrdenacao] = useState<OrdenacaoDirecao>('asc');

    useEffect(() => {
        dispatch(carregarClinicas());
    }, [dispatch]);

    const clinicasFiltradasOrdenadas = useMemo(() => {
        const termo = normalizarTexto(pesquisa);

        const filtradas = itens.filter(clinica => {
            const textoBusca = [
                clinica.nome,
                clinica.telefone,
                clinica.veterinarioResponsavel
            ]
                .map(normalizarTexto)
                .join(' ');

            return !termo || textoBusca.includes(termo);
        });

        return [...filtradas].sort((a, b) => {
            const valorA = obterValorOrdenacao(a, ordenarPor);
            const valorB = obterValorOrdenacao(b, ordenarPor);

            const comparacao = valorA.localeCompare(valorB, 'pt-BR', {
                numeric: true,
                sensitivity: 'base'
            });

            return direcaoOrdenacao === 'asc' ? comparacao : comparacao * -1;
        });
    }, [itens, pesquisa, ordenarPor, direcaoOrdenacao]);

    const totalPaginas = Math.max(1, Math.ceil(clinicasFiltradasOrdenadas.length / tamanhoPagina));

    useEffect(() => {
        if (pagina > totalPaginas) {
            setPagina(totalPaginas);
        }
    }, [pagina, totalPaginas]);

    useEffect(() => {
        setPagina(1);
    }, [pesquisa, ordenarPor, direcaoOrdenacao]);

    const clinicasPaginadas = useMemo(() => {
        const inicio = (pagina - 1) * tamanhoPagina;
        return clinicasFiltradasOrdenadas.slice(inicio, inicio + tamanhoPagina);
    }, [clinicasFiltradasOrdenadas, pagina, tamanhoPagina]);

    const clinicaConfirmacao = useMemo(() => {
        if (!confirmacaoExclusao) {
            return null;
        }

        return itens.find(c => c.id === confirmacaoExclusao.id) ?? null;
    }, [confirmacaoExclusao, itens]);

    const handleNovo = () => {
        dispatch(selecionarClinica(null));
        setModoEdicao(false);
        setShowFormModal(true);
    };

    const handleEditar = (clinica: Clinica) => {
        dispatch(selecionarClinica(clinica));
        setModoEdicao(true);
        setShowFormModal(true);
    };

    const handleSalvar = async (dados: ClinicaCreate | ClinicaUpdate) => {
        if ('id' in dados && dados.id > 0) {
            await dispatch(atualizarClinica(dados as ClinicaUpdate));
        } else {
            await dispatch(criarClinica(dados as ClinicaCreate));
            setPagina(1);
        }

        setShowFormModal(false);
    };

    const handleSolicitarExcluir = async (id: number) => {
        await dispatch(excluirClinica({ id }));
    };

    const handleConfirmarExcluirComCastracoes = async () => {
        if (!confirmacaoExclusao) {
            return;
        }

        await dispatch(excluirClinica({
            id: confirmacaoExclusao.id,
            excluirCastracoes: true
        }));
    };

    const handleCancelarExclusaoComCastracoes = () => {
        dispatch(limparConfirmacaoExclusaoClinica());
    };

    const handleMudarTamanhoPagina = (novoTamanho: number) => {
        setTamanhoPagina(novoTamanho);
        setPagina(1);
    };

    const handleOrdenar = (campo: ClinicaOrdenacaoCampo) => {
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
                        <h2 className="h4 mb-0">Lista de Clínicas</h2>
                        <small className="text-muted">
                            {clinicasFiltradasOrdenadas.length} de {itens.length} clínicas exibidas.
                        </small>
                    </div>

                    <button className="btn btn-primary btn-sm" onClick={handleNovo}>
                        Nova Clínica
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
                                    placeholder="Nome, telefone ou veterinário responsável"
                                />
                            </div>

                            <div className="col-md-2 d-flex align-items-end">
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

                <ClinicasList
                    clinicas={clinicasPaginadas}
                    onEditar={handleEditar}
                    onExcluir={handleSolicitarExcluir}
                    ordenarPor={ordenarPor}
                    direcaoOrdenacao={direcaoOrdenacao}
                    onOrdenar={handleOrdenar}
                />

                {clinicasFiltradasOrdenadas.length > 0 && (
                    <Paginacao
                        pagina={pagina}
                        tamanhoPagina={tamanhoPagina}
                        totalRegistros={clinicasFiltradasOrdenadas.length}
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
                                    {modoEdicao && selecionado ? 'Editar Clínica' : 'Nova Clínica'}
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setShowFormModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <ClinicaForm
                                    clinica={modoEdicao ? selecionado ?? undefined : undefined}
                                    onSubmit={handleSalvar}
                                    onCancel={() => setShowFormModal(false)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ClinicaDeleteModal
                clinica={clinicaConfirmacao}
                totalCastracoes={confirmacaoExclusao?.totalCastracoes ?? 0}
                mensagem={confirmacaoExclusao?.erro ?? ''}
                onCancel={handleCancelarExclusaoComCastracoes}
                onConfirm={handleConfirmarExcluirComCastracoes}
            />
        </div>
    );
};
