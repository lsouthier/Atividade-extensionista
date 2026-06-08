import React from 'react';
import { Clinica } from '../../api/clinicasApi';

export type ClinicaOrdenacaoCampo = 'nome' | 'telefone' | 'veterinarioResponsavel';
export type OrdenacaoDirecao = 'asc' | 'desc';

interface ClinicasListProps {
    clinicas: Clinica[];
    onEditar: (clinica: Clinica) => void;
    onExcluir: (id: number) => void;
    ordenarPor: ClinicaOrdenacaoCampo;
    direcaoOrdenacao: OrdenacaoDirecao;
    onOrdenar: (campo: ClinicaOrdenacaoCampo) => void;
}

const indicador = (
    campo: ClinicaOrdenacaoCampo,
    ordenarPor: ClinicaOrdenacaoCampo,
    direcao: OrdenacaoDirecao
): string => {
    if (campo !== ordenarPor) {
        return '↕';
    }

    return direcao === 'asc' ? '↑' : '↓';
};

const Cabecalho: React.FC<{
    campo: ClinicaOrdenacaoCampo;
    titulo: string;
    ordenarPor: ClinicaOrdenacaoCampo;
    direcaoOrdenacao: OrdenacaoDirecao;
    onOrdenar: (campo: ClinicaOrdenacaoCampo) => void;
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

export const ClinicasList: React.FC<ClinicasListProps> = ({
    clinicas,
    onEditar,
    onExcluir,
    ordenarPor,
    direcaoOrdenacao,
    onOrdenar
}) => {
    if (!clinicas.length) {
        return <div className="alert alert-secondary">Nenhuma clínica encontrada para os filtros aplicados.</div>;
    }

    return (
        <div className="table-responsive">
            <table className="table table-sm table-striped align-middle">
                <thead className="table-light">
                    <tr>
                        <Cabecalho campo="nome" titulo="Nome" ordenarPor={ordenarPor} direcaoOrdenacao={direcaoOrdenacao} onOrdenar={onOrdenar} />
                        <Cabecalho campo="telefone" titulo="Telefone" ordenarPor={ordenarPor} direcaoOrdenacao={direcaoOrdenacao} onOrdenar={onOrdenar} />
                        <Cabecalho campo="veterinarioResponsavel" titulo="Veterinário Responsável" ordenarPor={ordenarPor} direcaoOrdenacao={direcaoOrdenacao} onOrdenar={onOrdenar} />
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
                                        type="button"
                                        onClick={() => onEditar(clinica)}
                                    >
                                        Editar
                                    </button>
                                    <button
                                        className="btn btn-outline-danger"
                                        type="button"
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
