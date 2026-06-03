import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../../store';
import {
    carregarClinicas,
    criarClinica,
    atualizarClinica,
    excluirClinica,
    selecionarClinica
} from '../../store/clinicasSlice';
import { Clinica, ClinicaCreate, ClinicaUpdate } from '../../api/clinicasApi';
import { ClinicasList } from './ClinicasList';
import { ClinicaForm } from './ClinicaForm';
import { ClinicaDeleteModal } from './ClinicaDeleteModal';

export const ClinicasPage: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { itens, carregando, erro, selecionado } = useSelector(
        (state: RootState) => state.clinicas
    );

    const [modoEdicao, setModoEdicao] = useState(false);
    const [idParaExcluir, setIdParaExcluir] = useState<number | null>(null);
    const [showFormModal, setShowFormModal] = useState(false);

    useEffect(() => {
        dispatch(carregarClinicas());
    }, [dispatch]);

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
        }
        setShowFormModal(false);
    };

    const handleConfirmarExcluir = async () => {
        if (idParaExcluir !== null) {
            await dispatch(excluirClinica(idParaExcluir));
            setIdParaExcluir(null);
        }
    };

    return (
        <div className="row">
            <div className="col-12 mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <h2 className="h4 mb-0">Lista de Clínicas</h2>
                    <button className="btn btn-primary btn-sm" onClick={handleNovo}>
                        Nova Clínica
                    </button>
                </div>

                {carregando && <div className="alert alert-info">Carregando...</div>}
                {erro && <div className="alert alert-danger">{erro}</div>}

                <ClinicasList
                    clinicas={itens}
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
                id={idParaExcluir}
                onCancel={() => setIdParaExcluir(null)}
                onConfirm={handleConfirmarExcluir}
            />
        </div>
    );
};
