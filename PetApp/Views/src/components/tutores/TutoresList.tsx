import React from 'react';
import { Tutor } from '../../api/tutoresApi';

interface TutoresListProps {
    tutores: Tutor[];
    onEditar: (tutor: Tutor) => void;
    onExcluir: (id: number) => void;
}

export const TutoresList: React.FC<TutoresListProps> = ({
    tutores,
    onEditar,
    onExcluir
}) => {
    if (!tutores.length) {
        return <div className="alert alert-secondary">Nenhum tutor cadastrado.</div>;
    }

    return (
        <div className="table-responsive">
            <table className="table table-sm table-striped align-middle">
                <thead className="table-light">
                    <tr>
                        <th>Nome</th>
                        <th>Endereço</th>
                        <th>Telefone</th>
                        <th style={{ width: 130 }}>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {tutores.map(tutor => (
                        <tr key={tutor.id}>
                            <td>{tutor.nome}</td>
                            <td>{tutor.endereco}</td>
                            <td>{tutor.telefone}</td>
                            <td>
                                <div className="btn-group btn-group-sm">
                                    <button
                                        className="btn btn-outline-primary"
                                        onClick={() => onEditar(tutor)}
                                    >
                                        Editar
                                    </button>
                                    <button
                                        className="btn btn-outline-danger"
                                        onClick={() => onExcluir(tutor.id)}
                                    >
                                        Excluir
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};