import React from 'react';
import { Tutor } from '../../api/tutoresApi';

export type TutorOrdenacaoCampo = 'nome' | 'cep' | 'endereco' | 'bairro' | 'cidade' | 'uf' | 'telefone';
export type OrdenacaoDirecao = 'asc' | 'desc';

interface TutoresListProps {
    tutores: Tutor[];
    onEditar: (tutor: Tutor) => void;
    onExcluir: (id: number) => void;
    ordenarPor: TutorOrdenacaoCampo;
    direcaoOrdenacao: OrdenacaoDirecao;
    onOrdenar: (campo: TutorOrdenacaoCampo) => void;
}

const indicador = (
    campo: TutorOrdenacaoCampo,
    ordenarPor: TutorOrdenacaoCampo,
    direcao: OrdenacaoDirecao
): string => {
    if (campo !== ordenarPor) {
        return '↕';
    }

    return direcao === 'asc' ? '↑' : '↓';
};

const Cabecalho: React.FC<{
    campo: TutorOrdenacaoCampo;
    titulo: string;
    ordenarPor: TutorOrdenacaoCampo;
    direcaoOrdenacao: OrdenacaoDirecao;
    onOrdenar: (campo: TutorOrdenacaoCampo) => void;
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

export const TutoresList: React.FC<TutoresListProps> = ({
    tutores,
    onEditar,
    onExcluir,
    ordenarPor,
    direcaoOrdenacao,
    onOrdenar
}) => {
    if (!tutores.length) {
        return <div className="alert alert-secondary">Nenhum tutor encontrado para os filtros aplicados.</div>;
    }

    return (
        <div className="table-responsive">
            <table className="table table-sm table-striped align-middle">
                <thead className="table-light">
                    <tr>
                        <Cabecalho campo="nome" titulo="Nome" ordenarPor={ordenarPor} direcaoOrdenacao={direcaoOrdenacao} onOrdenar={onOrdenar} />
                        <Cabecalho campo="cep" titulo="CEP" ordenarPor={ordenarPor} direcaoOrdenacao={direcaoOrdenacao} onOrdenar={onOrdenar} />
                        <Cabecalho campo="endereco" titulo="Endereço" ordenarPor={ordenarPor} direcaoOrdenacao={direcaoOrdenacao} onOrdenar={onOrdenar} />
                        <Cabecalho campo="bairro" titulo="Bairro" ordenarPor={ordenarPor} direcaoOrdenacao={direcaoOrdenacao} onOrdenar={onOrdenar} />
                        <Cabecalho campo="cidade" titulo="Cidade" ordenarPor={ordenarPor} direcaoOrdenacao={direcaoOrdenacao} onOrdenar={onOrdenar} />
                        <Cabecalho campo="uf" titulo="UF" ordenarPor={ordenarPor} direcaoOrdenacao={direcaoOrdenacao} onOrdenar={onOrdenar} />
                        <Cabecalho campo="telefone" titulo="Telefone" ordenarPor={ordenarPor} direcaoOrdenacao={direcaoOrdenacao} onOrdenar={onOrdenar} />
                        <th style={{ width: 130 }}>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {tutores.map(tutor => (
                        <tr key={tutor.id}>
                            <td>{tutor.nome}</td>
                            <td>{tutor.cep}</td>
                            <td>{tutor.enderecoCompleto || tutor.endereco}</td>
                            <td>{tutor.bairro}</td>
                            <td>{tutor.cidade}</td>
                            <td>{tutor.uf}</td>
                            <td>{tutor.telefone}</td>
                            <td>
                                <div className="btn-group btn-group-sm">
                                    <button className="btn btn-outline-primary" type="button" onClick={() => onEditar(tutor)}>
                                        Editar
                                    </button>
                                    <button className="btn btn-outline-danger" type="button" onClick={() => onExcluir(tutor.id)}>
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
