import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../store';
import { carregarAuditorias } from '../../store/auditoriaSlice';
import { Auditoria } from '../../api/auditoriaApi';

const formatarDataHora = (dataUtc: string): string => {
    if (!dataUtc) {
        return '';
    }

    return new Date(dataUtc).toLocaleString('pt-BR');
};

const formatarJson = (valor?: string | null): string => {
    if (!valor) {
        return '-';
    }

    try {
        return JSON.stringify(JSON.parse(valor), null, 2);
    } catch {
        return valor;
    }
};

const badgeAcao = (acao: string): string => {
    switch (acao) {
        case 'LOGIN':
            return 'bg-info';
        case 'CADASTRO':
            return 'bg-success';
        case 'ALTERACAO':
            return 'bg-warning text-dark';
        case 'EXCLUSAO':
            return 'bg-danger';
        default:
            return 'bg-secondary';
    }
};

export const AuditoriaPage: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { itens, carregando, erro } = useSelector((state: RootState) => state.auditoria);

    const [entidade, setEntidade] = useState('');
    const [acao, setAcao] = useState('');
    const [usuario, setUsuario] = useState('');
    const [detalhe, setDetalhe] = useState<Auditoria | null>(null);

    const carregar = () => {
        dispatch(carregarAuditorias({
            limite: 300,
            entidade: entidade || undefined,
            acao: acao || undefined,
            usuario: usuario || undefined
        }));
    };

    useEffect(() => {
        carregar();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dispatch]);

    return (
        <div className="row">
            <div className="col-12 mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                        <h2 className="h4 mb-0">Auditoria e Fluxo de Dados</h2>
                        <small className="text-muted">
                            Histórico de logins, cadastros, edições e exclusões realizadas no sistema.
                        </small>
                    </div>

                    <button className="btn btn-primary btn-sm" onClick={carregar}>
                        Atualizar
                    </button>
                </div>

                <div className="card mb-3">
                    <div className="card-body">
                        <div className="row g-2">
                            <div className="col-md-3">
                                <label className="form-label">Entidade</label>
                                <select
                                    className="form-select form-select-sm"
                                    value={entidade}
                                    onChange={(e) => setEntidade(e.target.value)}
                                >
                                    <option value="">Todas</option>
                                    <option value="Auth">Auth</option>
                                    <option value="Animal">Animal</option>
                                    <option value="Tutor">Tutor</option>
                                    <option value="Clinica">Clinica</option>
                                    <option value="Castracao">Castracao</option>
                                    <option value="UsuarioSistema">UsuarioSistema</option>
                                </select>
                            </div>

                            <div className="col-md-3">
                                <label className="form-label">Ação</label>
                                <select
                                    className="form-select form-select-sm"
                                    value={acao}
                                    onChange={(e) => setAcao(e.target.value)}
                                >
                                    <option value="">Todas</option>
                                    <option value="LOGIN">LOGIN</option>
                                    <option value="CADASTRO">CADASTRO</option>
                                    <option value="ALTERACAO">ALTERAÇÃO</option>
                                    <option value="EXCLUSAO">EXCLUSÃO</option>
                                </select>
                            </div>

                            <div className="col-md-4">
                                <label className="form-label">Usuário</label>
                                <input
                                    className="form-control form-control-sm"
                                    value={usuario}
                                    onChange={(e) => setUsuario(e.target.value)}
                                    placeholder="Ex.: admin"
                                />
                            </div>

                            <div className="col-md-2 d-flex align-items-end">
                                <button className="btn btn-secondary btn-sm w-100" onClick={carregar}>
                                    Filtrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {carregando && <div className="alert alert-info">Carregando auditoria...</div>}
                {erro && <div className="alert alert-danger">{erro}</div>}

                {!carregando && itens.length === 0 && (
                    <div className="alert alert-secondary">Nenhum registro de auditoria encontrado.</div>
                )}

                {itens.length > 0 && (
                    <div className="table-responsive">
                        <table className="table table-sm table-striped align-middle">
                            <thead className="table-light">
                                <tr>
                                    <th>Data/Hora</th>
                                    <th>Usuário</th>
                                    <th>Ação</th>
                                    <th>Entidade</th>
                                    <th>ID Registro</th>
                                    <th>IP</th>
                                    <th style={{ width: 100 }}>Detalhes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {itens.map(item => (
                                    <tr key={item.id}>
                                        <td>{formatarDataHora(item.dataHoraUtc)}</td>
                                        <td>{item.usuarioNome}</td>
                                        <td>
                                            <span className={`badge ${badgeAcao(item.acao)}`}>
                                                {item.acao}
                                            </span>
                                        </td>
                                        <td>{item.entidade}</td>
                                        <td>{item.entidadeId ?? '-'}</td>
                                        <td>{item.ipOrigem ?? '-'}</td>
                                        <td>
                                            <button
                                                className="btn btn-outline-primary btn-sm"
                                                onClick={() => setDetalhe(item)}
                                            >
                                                Ver
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {detalhe && (
                <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-xl">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Detalhes da Auditoria #{detalhe.id}</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setDetalhe(null)}
                                ></button>
                            </div>

                            <div className="modal-body">
                                <div className="row mb-3">
                                    <div className="col-md-3">
                                        <strong>Data/Hora:</strong><br />
                                        {formatarDataHora(detalhe.dataHoraUtc)}
                                    </div>
                                    <div className="col-md-3">
                                        <strong>Usuário:</strong><br />
                                        {detalhe.usuarioNome}
                                    </div>
                                    <div className="col-md-3">
                                        <strong>Ação:</strong><br />
                                        {detalhe.acao}
                                    </div>
                                    <div className="col-md-3">
                                        <strong>Entidade:</strong><br />
                                        {detalhe.entidade} #{detalhe.entidadeId ?? '-'}
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <strong>User-Agent:</strong><br />
                                    <small>{detalhe.userAgent ?? '-'}</small>
                                </div>

                                <div className="row">
                                    <div className="col-md-6">
                                        <h6>Valores antes</h6>
                                        <pre className="bg-light p-3 rounded small" style={{ whiteSpace: 'pre-wrap' }}>
                                            {formatarJson(detalhe.valoresAntes)}
                                        </pre>
                                    </div>

                                    <div className="col-md-6">
                                        <h6>Valores depois</h6>
                                        <pre className="bg-light p-3 rounded small" style={{ whiteSpace: 'pre-wrap' }}>
                                            {formatarJson(detalhe.valoresDepois)}
                                        </pre>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setDetalhe(null)}>
                                    Fechar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
