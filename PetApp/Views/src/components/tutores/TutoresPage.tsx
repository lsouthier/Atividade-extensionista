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
import { TutoresList } from './TutoresList';
import { TutorForm } from './TutorForm';
import { TutorDeleteModal } from './TutorDeleteModal';
import { Paginacao } from '../common/Paginacao';

export const TutoresPage: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { itens, carregando, erro, selecionado, confirmacaoExclusao } = useSelector(
        (state: RootState) => state.tutores
    );

    const [modoEdicao, setModoEdicao] = useState(false);
    const [showFormModal, setShowFormModal] = useState(false);
    const [pagina, setPagina] = useState(1);
    const [tamanhoPagina, setTamanhoPagina] = useState(10);

    useEffect(() => {
        dispatch(carregarTutores());
    }, [dispatch]);

    const totalPaginas = Math.max(1, Math.ceil(itens.length / tamanhoPagina));

    useEffect(() => {
        if (pagina > totalPaginas) {
            setPagina(totalPaginas);
        }
    }, [pagina, totalPaginas]);

    const tutoresPaginados = useMemo(() => {
        const inicio = (pagina - 1) * tamanhoPagina;
        return itens.slice(inicio, inicio + tamanhoPagina);
    }, [itens, pagina, tamanhoPagina]);

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

    return (
        <div className="row">
            <div className="col-12 mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                    <h2 className="h4 mb-0">Lista de Tutores</h2>
                    <button className="btn btn-primary btn-sm" onClick={handleNovo}>
                        Novo Tutor
                    </button>
                </div>

                {carregando && <div className="alert alert-info">Carregando...</div>}
                {erro && <div className="alert alert-danger">{erro}</div>}

                <TutoresList
                    tutores={tutoresPaginados}
                    onEditar={handleEditar}
                    onExcluir={handleSolicitarExcluir}
                />

                {itens.length > 0 && (
                    <Paginacao
                        pagina={pagina}
                        tamanhoPagina={tamanhoPagina}
                        totalRegistros={itens.length}
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
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowFormModal(false)}
                                ></button>
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
