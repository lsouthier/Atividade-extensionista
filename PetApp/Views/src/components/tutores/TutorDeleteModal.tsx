import React from 'react';
import { Tutor } from '../../api/tutoresApi';

interface TutorDeleteModalProps {
    tutor?: Tutor | null;
    totalAnimais: number;
    mensagem: string;
    onCancel: () => void;
    onConfirm: () => void;
}

export const TutorDeleteModal: React.FC<TutorDeleteModalProps> = ({
    tutor,
    totalAnimais,
    mensagem,
    onCancel,
    onConfirm
}) => {
    if (!tutor) {
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
                            O tutor <strong>{tutor.nome}</strong> possui{' '}
                            <strong>{totalAnimais}</strong>{' '}
                            {totalAnimais === 1 ? 'pet cadastrado' : 'pets cadastrados'}.
                        </p>

                        <div className="alert alert-warning mb-0">
                            {mensagem}
                        </div>

                        <p className="text-muted mt-3 mb-0">
                            Esta ação também removerá os pets vinculados e as castrações relacionadas a esses pets, quando existirem.
                        </p>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onCancel}>
                            Cancelar
                        </button>
                        <button type="button" className="btn btn-danger" onClick={onConfirm}>
                            Excluir tutor e pets
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
