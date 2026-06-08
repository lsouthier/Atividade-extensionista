import React from 'react';
import { Clinica } from '../../api/clinicasApi';

interface ClinicaDeleteModalProps {
    clinica: Clinica | null;
    totalCastracoes: number;
    mensagem: string;
    onCancel: () => void;
    onConfirm: () => void;
}

export const ClinicaDeleteModal: React.FC<ClinicaDeleteModalProps> = ({
    clinica,
    totalCastracoes,
    mensagem,
    onCancel,
    onConfirm
}) => {
    if (!clinica) {
        return null;
    }

    return (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title text-danger">Confirmar exclusão em cascata</h5>
                        <button type="button" className="btn-close" onClick={onCancel}></button>
                    </div>

                    <div className="modal-body">
                        <p>
                            A clínica <strong>{clinica.nome}</strong> possui{' '}
                            <strong>{totalCastracoes}</strong>{' '}
                            {totalCastracoes === 1 ? 'castração vinculada' : 'castrações vinculadas'}.
                        </p>

                        <div className="alert alert-warning mb-3">
                            {mensagem}
                        </div>

                        <p className="text-muted mb-0">
                            Esta ação também removerá as castrações vinculadas a esta clínica.
                            Os pets relacionados voltarão a ficar marcados como não castrados para evitar dados inconsistentes.
                        </p>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onCancel}>
                            Cancelar
                        </button>
                        <button type="button" className="btn btn-danger" onClick={onConfirm}>
                            Excluir clínica e castrações
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
