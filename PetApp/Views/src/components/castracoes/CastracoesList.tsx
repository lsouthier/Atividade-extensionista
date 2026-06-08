import React from 'react';
import { Castracao } from '../../api/castracoeApi';

export type CastracaoOrdenacaoCampo = 'data' | 'animal' | 'clinica' | 'valor';
export type OrdenacaoDirecao = 'asc' | 'desc';

interface CastracoeListProps {
    castracoes: Castracao[];
    onEditar: (castracao: Castracao) => void;
    onExcluir: (id: number) => void;
    ordenarPor: CastracaoOrdenacaoCampo;
    direcaoOrdenacao: OrdenacaoDirecao;
    onOrdenar: (campo: CastracaoOrdenacaoCampo) => void;
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

const indicador = (
    campo: CastracaoOrdenacaoCampo,
    ordenarPor: CastracaoOrdenacaoCampo,
    direcao: OrdenacaoDirecao
): string => {
    if (campo !== ordenarPor) {
        return '↕';
    }

    return direcao === 'asc' ? '↑' : '↓';
};

const Cabecalho: React.FC<{
    campo: CastracaoOrdenacaoCampo;
    titulo: string;
    ordenarPor: CastracaoOrdenacaoCampo;
    direcaoOrdenacao: OrdenacaoDirecao;
    onOrdenar: (campo: CastracaoOrdenacaoCampo) => void;
}> = ({ campo, titulo, ordenarPor, direcaoOrdenacao, onOrdenar }) => (
    <th>
        <button
            type="button"
            className="btn btn-link btn-sm p-0 text-decoration-none fw-semibold text-dark"
            onClick={() => onOrdenar(campo)}
        >
            {titulo} {indicador(campo, ordenarPor, direcaoOrdenacao)}
        </button>
    </th>
);

export const CastracoesList: React.FC<CastracoeListProps> = ({
    castracoes,
    onEditar,
    onExcluir,
    ordenarPor,
    direcaoOrdenacao,
    onOrdenar
}) => {
    if (!castracoes.length) {
        return <div className="alert alert-secondary">Nenhuma castração encontrada para os filtros aplicados.</div>;
    }

    return (
        <div className="table-responsive">
            <table className="table table-sm table-striped align-middle">
                <thead className="table-light">
                    <tr>
                        <Cabecalho campo="data" titulo="Data" ordenarPor={ordenarPor} direcaoOrdenacao={direcaoOrdenacao} onOrdenar={onOrdenar} />
                        <Cabecalho campo="animal" titulo="Pet" ordenarPor={ordenarPor} direcaoOrdenacao={direcaoOrdenacao} onOrdenar={onOrdenar} />
                        <Cabecalho campo="clinica" titulo="Clínica" ordenarPor={ordenarPor} direcaoOrdenacao={direcaoOrdenacao} onOrdenar={onOrdenar} />
                        <Cabecalho campo="valor" titulo="Valor" ordenarPor={ordenarPor} direcaoOrdenacao={direcaoOrdenacao} onOrdenar={onOrdenar} />
                        <th style={{ width: 130 }}>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {castracoes.map(castracao => (
                        <tr key={castracao.id}>
                            <td>{formatarDataSemTimezone(castracao.dataCastracao)}</td>
                            <td>{castracao.nomePet}</td>
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
