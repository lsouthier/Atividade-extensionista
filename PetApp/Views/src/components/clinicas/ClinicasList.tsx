import React from 'react';
import { Clinica } from '../../api/clinicasApi';

interface ClinicasListProps {
    clinicas: Clinica[];
    onEditar: (clinica: Clinica) => void;
    onExcluir: (id: number) => void;
}

export const ClinicasList: React.FC<ClinicasListProps> = ({
    clinicas,
    onEditar,
    onExcluir
}) => {
    if (!clinicas.length) {
        return <div className="alert alert-secondary">Nenhuma clínica cadastrada.</div>;
    }

    return (
        <div className="table-responsive">
            <table className="table table-sm table-striped align-middle">
                <thead className="table-light">
                    <tr>
                        <th>Nome</th>
                        <th>Telefone</th>
                        <th>Veterinário Responsável</th>
                        <th style={{ width: 130 }}>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {clinicas.map(clinica => (
                        <tr key={clinica.id}>
                            <td>{clinica.nome}</td>
                            <td>{clinica.telefone}</td>
                            <td>{clinica.veterinarioResponsavel || '-'}</td>
                            <td>
                                <div className="btn-group btn-group-sm">
                                    <button
                                        className="btn btn-outline-primary"
                                        onClick={() => onEditar(clinica)}
                                    >
                                        Editar
                                    </button>
                                    <button
                                        className="btn btn-outline-danger"
                                        onClick={() => onExcluir(clinica.id)}
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
