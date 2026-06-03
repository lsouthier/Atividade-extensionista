import React from 'react';
import { Castracao } from '../../api/castracoeApi';

interface CastracoeListProps {
    castracoes: Castracao[];
    onEditar: (castracao: Castracao) => void;
    onExcluir: (id: number) => void;
}

const formatarDataSemTimezone = (data: string): string => {
    if (!data) {
        return '';
    }

    const somenteData = data.split('T')[0];
    const [ano, mes, dia] = somenteData.split('-');

    if (!ano || !mes || !dia) {
        return data;
    }

    return `${dia}/${mes}/${ano}`;
};

const formatarValor = (valor: number): string => {
    return valor.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

export const CastracoesList: React.FC<CastracoeListProps> = ({
    castracoes,
    onEditar,
    onExcluir
}) => {
    if (!castracoes.length) {
        return <div className="alert alert-secondary">Nenhuma castração cadastrada.</div>;
    }

    return (
        <div className="table-responsive">
            <table className="table table-sm table-striped align-middle">
                <thead className="table-light">
                    <tr>
                        <th>Data</th>
                        <th>Animal</th>
                        <th>Clínica</th>
                        <th>Valor</th>
                        <th style={{ width: 130 }}>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {castracoes.map(castracao => (
                        <tr key={castracao.id}>
                            <td>{formatarDataSemTimezone(castracao.dataCastracao)}</td>
                            <td>{castracao.nomeAnimal}</td>
                            <td>{castracao.nomeClinica}</td>
                            <td>R$ {formatarValor(castracao.valor)}</td>
                            <td>
                                <div className="btn-group btn-group-sm">
                                    <button
                                        className="btn btn-outline-primary"
                                        type="button"
                                        onClick={() => onEditar(castracao)}
                                    >
                                        Editar
                                    </button>
                                    <button
                                        className="btn btn-outline-danger"
                                        type="button"
                                        onClick={() => onExcluir(castracao.id)}
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
