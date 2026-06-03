import React from 'react';

interface CastracaoDeleteModalProps {
    id: number | null;
    onCancel: () => void;
    onConfirm: () => void;
}

export const CastracaoDeleteModal: React.FC<CastracaoDeleteModalProps> = ({
    id,
    onCancel,
    onConfirm,
}) => {
    if (id === null) return null;

    return (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title text-danger">Confirmar Exclusão</h5>
                        <button type="button" className="btn-close" onClick={onCancel}></button>
                    </div>
                    <div className="modal-body">
                        <p>Tem certeza que deseja excluir a castração com ID <strong>{id}</strong>?</p>
                        <p className="text-muted"><small>Esta ação não pode ser desfeita. Será necessário registrar novamente se precise.</small></p>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onCancel}>
                            Cancelar
                        </button>
                        <button type="button" className="btn btn-danger" onClick={onConfirm}>
                            Excluir
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
