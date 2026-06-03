import React from 'react';
import { Animal } from '../../api/animaisApi';

interface AnimalDeleteModalProps {
    animal?: Animal | null;
    totalCastracoes: number;
    mensagem: string;
    onCancel: () => void;
    onConfirm: () => void;
}

export const AnimalDeleteModal: React.FC<AnimalDeleteModalProps> = ({
    animal,
    totalCastracoes,
    mensagem,
    onCancel,
    onConfirm
}) => {
    if (!animal) {
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
                            O pet <strong>{animal.nome}</strong> possui{' '}
                            <strong>{totalCastracoes}</strong>{' '}
                            {totalCastracoes === 1 ? 'castração vinculada' : 'castrações vinculadas'}.
                        </p>

                        <div className="alert alert-warning mb-0">
                            {mensagem}
                        </div>

                        <p className="text-muted mt-3 mb-0">
                            Esta ação removerá o pet e os registros de castração vinculados a ele.
                        </p>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onCancel}>
                            Cancelar
                        </button>
                        <button type="button" className="btn btn-danger" onClick={onConfirm}>
                            Excluir pet e castrações
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
