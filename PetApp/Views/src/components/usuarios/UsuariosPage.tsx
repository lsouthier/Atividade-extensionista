import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../store';
import {
    carregarUsuarios,
    criarUsuario,
    atualizarUsuario,
    excluirUsuario,
    selecionarUsuario
} from '../../store/usuariosSlice';
import { UsuarioSistema, UsuarioSistemaCreate, UsuarioSistemaUpdate } from '../../api/usuariosApi';
import { Paginacao } from '../common/Paginacao';

interface FormState {
    id?: number;
    nomeUsuario: string;
    nome: string;
    senha: string;
    ativo: boolean;
}

const initialForm: FormState = {
    nomeUsuario: '',
    nome: '',
    senha: '',
    ativo: true
};

export const UsuariosPage: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { itens, carregando, erro, selecionado } = useSelector((state: RootState) => state.usuarios);

    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState<FormState>(initialForm);
    const [pagina, setPagina] = useState(1);
    const [tamanhoPagina, setTamanhoPagina] = useState(10);

    useEffect(() => {
        dispatch(carregarUsuarios());
    }, [dispatch]);

    const totalPaginas = Math.max(1, Math.ceil(itens.length / tamanhoPagina));

    useEffect(() => {
        if (pagina > totalPaginas) {
            setPagina(totalPaginas);
        }
    }, [pagina, totalPaginas]);

    const usuariosPaginados = useMemo(() => {
        const inicio = (pagina - 1) * tamanhoPagina;
        return itens.slice(inicio, inicio + tamanhoPagina);
    }, [itens, pagina, tamanhoPagina]);

    const abrirNovo = () => {
        dispatch(selecionarUsuario(null));
        setForm(initialForm);
        setShowModal(true);
    };

    const abrirEditar = (usuario: UsuarioSistema) => {
        dispatch(selecionarUsuario(usuario));
        setForm({
            id: usuario.id,
            nomeUsuario: usuario.nomeUsuario,
            nome: usuario.nome,
            senha: '',
            ativo: usuario.ativo
        });
        setShowModal(true);
    };

    const salvar = async (e: React.FormEvent) => {
        e.preventDefault();

        if (form.id && form.id > 0) {
            const payload: UsuarioSistemaUpdate = {
                id: form.id,
                nomeUsuario: form.nomeUsuario,
                nome: form.nome,
                novaSenha: form.senha || undefined,
                ativo: form.ativo
            };

            const result = await dispatch(atualizarUsuario(payload));

            if (atualizarUsuario.fulfilled.match(result)) {
                setShowModal(false);
            }

            return;
        }

        const payload: UsuarioSistemaCreate = {
            nomeUsuario: form.nomeUsuario,
            nome: form.nome,
            senha: form.senha,
            ativo: form.ativo
        };

        const result = await dispatch(criarUsuario(payload));

        if (criarUsuario.fulfilled.match(result)) {
            setShowModal(false);
            setPagina(1);
        }
    };

    const excluir = async (usuario: UsuarioSistema) => {
        if (!window.confirm(`Deseja excluir o usuário ${usuario.nomeUsuario}?`)) {
            return;
        }

        await dispatch(excluirUsuario(usuario.id));
    };

    const handleMudarTamanhoPagina = (novoTamanho: number) => {
        setTamanhoPagina(novoTamanho);
        setPagina(1);
    };

    return (
        <div className="row">
            <div className="col-12 mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                    <h2 className="h4 mb-0">Gestão de Usuários</h2>
                    <button className="btn btn-primary btn-sm" onClick={abrirNovo}>
                        Novo Usuário
                    </button>
                </div>

                {carregando && <div className="alert alert-info">Carregando...</div>}
                {erro && <div className="alert alert-danger">{erro}</div>}

                <div className="table-responsive">
                    <table className="table table-sm table-striped align-middle">
                        <thead className="table-light">
                            <tr>
                                <th>Usuário</th>
                                <th>Nome</th>
                                <th>Status</th>
                                <th style={{ width: 130 }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {usuariosPaginados.map(usuario => (
                                <tr key={usuario.id}>
                                    <td>{usuario.nomeUsuario}</td>
                                    <td>{usuario.nome}</td>
                                    <td>
                                        {usuario.ativo ? (
                                            <span className="badge bg-success">Ativo</span>
                                        ) : (
                                            <span className="badge bg-secondary">Inativo</span>
                                        )}
                                    </td>
                                    <td>
                                        <div className="btn-group btn-group-sm">
                                            <button
                                                className="btn btn-outline-primary"
                                                onClick={() => abrirEditar(usuario)}
                                            >
                                                Editar
                                            </button>
                                            <button
                                                className="btn btn-outline-danger"
                                                onClick={() => excluir(usuario)}
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

                {!itens.length && !carregando && (
                    <div className="alert alert-secondary">Nenhum usuário cadastrado.</div>
                )}

                {itens.length > 0 && (
                    <Paginacao
                        pagina={pagina}
                        tamanhoPagina={tamanhoPagina}
                        totalRegistros={itens.length}
                        onMudarPagina={setPagina}
                        onMudarTamanhoPagina={handleMudarTamanhoPagina}
                    />
                )}
            </div>

            {showModal && (
                <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <form onSubmit={salvar}>
                                <div className="modal-header">
                                    <h5 className="modal-title">
                                        {selecionado ? 'Editar Usuário' : 'Novo Usuário'}
                                    </h5>
                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={() => setShowModal(false)}
                                    ></button>
                                </div>

                                <div className="modal-body">
                                    <div className="mb-2">
                                        <label className="form-label">Usuário *</label>
                                        <input
                                            className="form-control form-control-sm"
                                            value={form.nomeUsuario}
                                            onChange={(e) => setForm(prev => ({ ...prev, nomeUsuario: e.target.value }))}
                                            required
                                        />
                                    </div>

                                    <div className="mb-2">
                                        <label className="form-label">Nome *</label>
                                        <input
                                            className="form-control form-control-sm"
                                            value={form.nome}
                                            onChange={(e) => setForm(prev => ({ ...prev, nome: e.target.value }))}
                                            required
                                        />
                                    </div>

                                    <div className="mb-2">
                                        <label className="form-label">
                                            {selecionado ? 'Nova senha' : 'Senha *'}
                                        </label>
                                        <input
                                            type="password"
                                            className="form-control form-control-sm"
                                            value={form.senha}
                                            onChange={(e) => setForm(prev => ({ ...prev, senha: e.target.value }))}
                                            required={!selecionado}
                                            minLength={4}
                                        />
                                        {selecionado && (
                                            <small className="text-muted">
                                                Deixe em branco para manter a senha atual.
                                            </small>
                                        )}
                                    </div>

                                    <div className="form-check mt-3">
                                        <input
                                            id="usuarioAtivo"
                                            type="checkbox"
                                            className="form-check-input"
                                            checked={form.ativo}
                                            onChange={(e) => setForm(prev => ({ ...prev, ativo: e.target.checked }))}
                                        />
                                        <label className="form-check-label" htmlFor="usuarioAtivo">
                                            Usuário ativo
                                        </label>
                                    </div>
                                </div>

                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => setShowModal(false)}
                                    >
                                        Cancelar
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        Salvar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
