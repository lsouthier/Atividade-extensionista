import React from 'react';
import { Animal } from '../../api/animaisApi';

interface AnimaisListProps {
    animais: Animal[];
    onEditar: (animal: Animal) => void;
    onExcluir: (id: number) => void;
}

export const AnimaisList: React.FC<AnimaisListProps> = ({
    animais,
    onEditar,
    onExcluir
}) => {
    if (!animais.length) {
        return <div className="alert alert-secondary">Nenhum animal cadastrado.</div>;
    }

    return (
        <div className="table-responsive">
            <table className="table table-sm table-striped align-middle">
                <thead className="table-light">
                    <tr>
                        <th>Nome</th>
                        <th>Espécie</th>
                        <th>Raça</th>
                        <th>Sexo</th>
                        <th>Idade</th>
                        <th>Peso (kg)</th>
                        <th>Tutor</th>
                        <th style={{ width: 130 }}>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {animais.map(animal => (
                        <tr key={animal.id}>
                            <td>{animal.nome}</td>
                            <td>{animal.especie}</td>
                            <td>{animal.raca}</td>
                            <td>{animal.sexo}</td>
                            <td>{animal.idade}</td>
                            <td>{animal.peso}</td>
                            <td>{animal.tutor?.nome || 'Sem tutor'}</td>
                            <td>
                                <div className="btn-group btn-group-sm">
                                    <button
                                        className="btn btn-outline-primary"
                                        onClick={() => onEditar(animal)}
                                    >
                                        Editar
                                    </button>
                                    <button
                                        className="btn btn-outline-danger"
                                        onClick={() => onExcluir(animal.id)}
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