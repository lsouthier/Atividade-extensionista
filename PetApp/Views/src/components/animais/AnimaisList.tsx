import React from 'react';
import { Animal } from '../../api/animaisApi';

export type AnimalOrdenacaoCampo =
    | 'nome'
    | 'especie'
    | 'raca'
    | 'sexo'
    | 'idade'
    | 'peso'
    | 'tutor'
    | 'castrado';

export type OrdenacaoDirecao = 'asc' | 'desc';

interface AnimaisListProps {
    animais: Animal[];
    onEditar: (animal: Animal) => void;
    onExcluir: (id: number) => void;
    ordenarPor: AnimalOrdenacaoCampo;
    direcaoOrdenacao: OrdenacaoDirecao;
    onOrdenar: (campo: AnimalOrdenacaoCampo) => void;
}

const formatarPeso = (peso: number): string => {
    return peso.toLocaleString('pt-BR', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 2
    });
};

const renderIndicadorOrdenacao = (
    campo: AnimalOrdenacaoCampo,
    ordenarPor: AnimalOrdenacaoCampo,
    direcaoOrdenacao: OrdenacaoDirecao
): string => {
    if (campo !== ordenarPor) {
        return '↕';
    }

    return direcaoOrdenacao === 'asc' ? '↑' : '↓';
};

interface CabecalhoOrdenavelProps {
    campo: AnimalOrdenacaoCampo;
    titulo: string;
    ordenarPor: AnimalOrdenacaoCampo;
    direcaoOrdenacao: OrdenacaoDirecao;
    onOrdenar: (campo: AnimalOrdenacaoCampo) => void;
}

const CabecalhoOrdenavel: React.FC<CabecalhoOrdenavelProps> = ({
    campo,
    titulo,
    ordenarPor,
    direcaoOrdenacao,
    onOrdenar
}) => {
    return (
        <th>
            <button
                type="button"
                className="btn btn-link btn-sm p-0 text-decoration-none fw-semibold text-dark"
                onClick={() => onOrdenar(campo)}
                title={`Ordenar por ${titulo}`}
            >
                {titulo} {renderIndicadorOrdenacao(campo, ordenarPor, direcaoOrdenacao)}
            </button>
        </th>
    );
};

export const AnimaisList: React.FC<AnimaisListProps> = ({
    animais,
    onEditar,
    onExcluir,
    ordenarPor,
    direcaoOrdenacao,
    onOrdenar
}) => {
    if (!animais.length) {
        return <div className="alert alert-secondary">Nenhum pet encontrado para os filtros aplicados.</div>;
    }

    return (
        <div className="table-responsive">
            <table className="table table-sm table-striped align-middle">
                <thead className="table-light">
                    <tr>
                        <CabecalhoOrdenavel
                            campo="nome"
                            titulo="Nome"
                            ordenarPor={ordenarPor}
                            direcaoOrdenacao={direcaoOrdenacao}
                            onOrdenar={onOrdenar}
                        />
                        <CabecalhoOrdenavel
                            campo="especie"
                            titulo="Espécie"
                            ordenarPor={ordenarPor}
                            direcaoOrdenacao={direcaoOrdenacao}
                            onOrdenar={onOrdenar}
                        />
                        <CabecalhoOrdenavel
                            campo="raca"
                            titulo="Raça"
                            ordenarPor={ordenarPor}
                            direcaoOrdenacao={direcaoOrdenacao}
                            onOrdenar={onOrdenar}
                        />
                        <CabecalhoOrdenavel
                            campo="sexo"
                            titulo="Sexo"
                            ordenarPor={ordenarPor}
                            direcaoOrdenacao={direcaoOrdenacao}
                            onOrdenar={onOrdenar}
                        />
                        <CabecalhoOrdenavel
                            campo="idade"
                            titulo="Idade"
                            ordenarPor={ordenarPor}
                            direcaoOrdenacao={direcaoOrdenacao}
                            onOrdenar={onOrdenar}
                        />
                        <CabecalhoOrdenavel
                            campo="peso"
                            titulo="Peso (kg)"
                            ordenarPor={ordenarPor}
                            direcaoOrdenacao={direcaoOrdenacao}
                            onOrdenar={onOrdenar}
                        />
                        <CabecalhoOrdenavel
                            campo="tutor"
                            titulo="Tutor"
                            ordenarPor={ordenarPor}
                            direcaoOrdenacao={direcaoOrdenacao}
                            onOrdenar={onOrdenar}
                        />
                        <CabecalhoOrdenavel
                            campo="castrado"
                            titulo="Castrado"
                            ordenarPor={ordenarPor}
                            direcaoOrdenacao={direcaoOrdenacao}
                            onOrdenar={onOrdenar}
                        />
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
                            <td>{animal.idadeDescricao || `${animal.idade} ano(s)`}</td>
                            <td>{formatarPeso(animal.peso)}</td>
                            <td>{animal.tutor?.nome || 'Sem tutor'}</td>
                            <td>{animal.ehCastrado ? 'Sim' : 'Não'}</td>
                            <td>
                                <div className="btn-group btn-group-sm">
                                    <button
                                        className="btn btn-outline-primary"
                                        type="button"
                                        onClick={() => onEditar(animal)}
                                    >
                                        Editar
                                    </button>
                                    <button
                                        className="btn btn-outline-danger"
                                        type="button"
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
