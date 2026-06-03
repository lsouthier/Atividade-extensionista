import React, { useEffect, useState } from 'react';
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
import { CastracoesList } from './CastracoesList';
import { CastracaoForm } from './CastracaoForm';
import { CastracaoDeleteModal } from './CastracaoDeleteModal';

export const CastracoesPa: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { itens, carregando, erro, selecionado } = useSelector(
        (state: RootState) => state.castracoes
    );

    const [modoEdicao, setModoEdicao] = useState(false);
    const [idParaExcluir, setIdParaExcluir] = useState<number | null>(null);
    const [showFormModal, setShowFormModal] = useState(false);

    useEffect(() => {
        dispatch(carregarCastracoes());
    }, [dispatch]);

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

    return (
        <div className="row">
            <div className="col-12 mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <h2 className="h4 mb-0">Lista de Castrações</h2>
                    <button className="btn btn-primary btn-sm" onClick={handleNovo}>
                        Nova Castração
                    </button>
                </div>

                {carregando && <div className="alert alert-info">Carregando...</div>}
                {erro && <div className="alert alert-danger">{erro}</div>}

                <CastracoesList
                    castracoes={itens}
                    onEditar={handleEditar}
                    onExcluir={(id) => setIdParaExcluir(id)}
                />
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
