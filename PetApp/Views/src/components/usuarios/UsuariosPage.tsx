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
import {
    PerfilAcesso,
    UsuarioSistema,
    UsuarioSistemaCreate,
    UsuarioSistemaUpdate
} from '../../api/usuariosApi';
import { Paginacao } from '../common/Paginacao';

interface FormState {
    id?: number;
    nomeUsuario: string;
    nome: string;
    senha: string;
    perfilAcesso: PerfilAcesso;
    ativo: boolean;
}

type UsuarioOrdenacaoCampo = 'nomeUsuario' | 'nome' | 'perfilAcesso' | 'status' | 'criadoEmUtc';
type OrdenacaoDirecao = 'asc' | 'desc';

const initialForm: FormState = {
    nomeUsuario: '',
    nome: '',
    senha: '',
    perfilAcesso: 'Leitura',
    ativo: true
};

const senhaAtendePolitica = (senha: string): boolean => {
    return senha.length >= 6 &&
        /[A-Z]/.test(senha) &&
        /[a-z]/.test(senha) &&
        /\d/.test(senha) &&
        /[^A-Za-z0-9]/.test(senha);
};

const mensagemSenhaInvalida = 'A senha deve ter pelo menos 6 caracteres, contendo letra maiúscula, letra minúscula, número e caractere especial.';


const normalizarTexto = (valor?: string | null): string => {
    return (valor ?? '')
        .toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
};

const formatarDataHora = (data?: string | null): string => {
    if (!data) {
        return '-';
    }

    return new Date(data).toLocaleString('pt-BR');
};

const obterValorOrdenacao = (
    usuario: UsuarioSistema,
    campo: UsuarioOrdenacaoCampo
): string | number => {
    switch (campo) {
        case 'nomeUsuario':
            return normalizarTexto(usuario.nomeUsuario);
        case 'nome':
            return normalizarTexto(usuario.nome);
        case 'perfilAcesso':
            return normalizarTexto(usuario.perfilAcesso);
        case 'status':
            return usuario.ativo ? 1 : 0;
        case 'criadoEmUtc':
            return usuario.criadoEmUtc ? new Date(usuario.criadoEmUtc).getTime() : 0;
        default:
            return normalizarTexto(usuario.nomeUsuario);
    }
};

const indicador = (
    campo: UsuarioOrdenacaoCampo,
    ordenarPor: UsuarioOrdenacaoCampo,
    direcao: OrdenacaoDirecao
): string => {
    if (campo !== ordenarPor) {
        return '↕';
    }

    return direcao === 'asc' ? '↑' : '↓';
};

const CabecalhoOrdenavel: React.FC<{
    campo: UsuarioOrdenacaoCampo;
    titulo: string;
    ordenarPor: UsuarioOrdenacaoCampo;
    direcaoOrdenacao: OrdenacaoDirecao;
    onOrdenar: (campo: UsuarioOrdenacaoCampo) => void;
}> = ({ campo, titulo, ordenarPor, direcaoOrdenacao, onOrdenar }) => (
    <th>
        <button
            type="button"
            className="btn btn-link btn-sm p-0 text-decoration-none fw-semibold text-dark"
            onClick={() => onOrdenar(campo)}
            title={`Ordenar por ${titulo}`}
        >
            {titulo} {indicador(campo, ordenarPor, direcaoOrdenacao)}
        </button>
    </th>
);

const badgePerfil = (perfil: PerfilAcesso): string => {
    switch (perfil) {
        case 'Administrador':
            return 'bg-danger';
        case 'Cadastro':
            return 'bg-primary';
        case 'Leitura':
            return 'bg-secondary';
        default:
            return 'bg-secondary';
    }
};

export const UsuariosPage: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { itens, carregando, erro, selecionado } = useSelector((state: RootState) => state.usuarios);
    const usuarioLogado = useSelector((state: RootState) => state.auth.usuario);

    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState<FormState>(initialForm);
    const [erroFormulario, setErroFormulario] = useState<string | undefined>();
    const [pagina, setPagina] = useState(1);
    const [tamanhoPagina, setTamanhoPagina] = useState(10);

    const [pesquisa, setPesquisa] = useState('');
    const [filtroStatus, setFiltroStatus] = useState('');
    const [filtroPerfil, setFiltroPerfil] = useState('');
    const [ordenarPor, setOrdenarPor] = useState<UsuarioOrdenacaoCampo>('nomeUsuario');
    const [direcaoOrdenacao, setDirecaoOrdenacao] = useState<OrdenacaoDirecao>('asc');

    useEffect(() => {
        dispatch(carregarUsuarios());
    }, [dispatch]);

    const usuariosFiltradosOrdenados = useMemo(() => {
        const termo = normalizarTexto(pesquisa);

        const filtrados = itens.filter(usuario => {
            const textoBusca = [
                usuario.nomeUsuario,
                usuario.nome,
                usuario.perfilAcesso
            ]
                .map(normalizarTexto)
                .join(' ');

            const atendePesquisa = !termo || textoBusca.includes(termo);

            const atendeStatus =
                !filtroStatus ||
                (filtroStatus === 'ativo' && usuario.ativo) ||
                (filtroStatus === 'inativo' && !usuario.ativo);

            const atendePerfil =
                !filtroPerfil ||
                usuario.perfilAcesso === filtroPerfil;

            return atendePesquisa && atendeStatus && atendePerfil;
        });

        return [...filtrados].sort((a, b) => {
            const valorA = obterValorOrdenacao(a, ordenarPor);
            const valorB = obterValorOrdenacao(b, ordenarPor);

            if (typeof valorA === 'number' && typeof valorB === 'number') {
                return direcaoOrdenacao === 'asc'
                    ? valorA - valorB
                    : valorB - valorA;
            }

            const comparacao = String(valorA).localeCompare(String(valorB), 'pt-BR', {
                numeric: true,
                sensitivity: 'base'
            });

            return direcaoOrdenacao === 'asc' ? comparacao : comparacao * -1;
        });
    }, [itens, pesquisa, filtroStatus, filtroPerfil, ordenarPor, direcaoOrdenacao]);

    const totalPaginas = Math.max(1, Math.ceil(usuariosFiltradosOrdenados.length / tamanhoPagina));

    useEffect(() => {
        if (pagina > totalPaginas) {
            setPagina(totalPaginas);
        }
    }, [pagina, totalPaginas]);

    useEffect(() => {
        setPagina(1);
    }, [pesquisa, filtroStatus, filtroPerfil, ordenarPor, direcaoOrdenacao]);

    const usuariosPaginados = useMemo(() => {
        const inicio = (pagina - 1) * tamanhoPagina;
        return usuariosFiltradosOrdenados.slice(inicio, inicio + tamanhoPagina);
    }, [usuariosFiltradosOrdenados, pagina, tamanhoPagina]);

    const abrirNovo = () => {
        dispatch(selecionarUsuario(null));
        setForm(initialForm);
        setErroFormulario(undefined);
        setShowModal(true);
    };

    const abrirEditar = (usuario: UsuarioSistema) => {
        dispatch(selecionarUsuario(usuario));
        setErroFormulario(undefined);
        setForm({
            id: usuario.id,
            nomeUsuario: usuario.nomeUsuario,
            nome: usuario.nome,
            senha: '',
            perfilAcesso: usuario.perfilAcesso ?? 'Leitura',
            ativo: usuario.ativo
        });
        setShowModal(true);
    };

    const salvar = async (e: React.FormEvent) => {
        e.preventDefault();
        setErroFormulario(undefined);

        if (form.id && form.id > 0) {
            if (form.senha && !senhaAtendePolitica(form.senha)) {
                setErroFormulario(mensagemSenhaInvalida);
                return;
            }

            const payload: UsuarioSistemaUpdate = {
                id: form.id,
                nomeUsuario: form.nomeUsuario,
                nome: form.nome,
                novaSenha: form.senha || undefined,
                perfilAcesso: form.perfilAcesso,
                ativo: form.ativo
            };

            const result = await dispatch(atualizarUsuario(payload));

            if (atualizarUsuario.fulfilled.match(result)) {
                setShowModal(false);
            }

            return;
        }

        if (!senhaAtendePolitica(form.senha)) {
            setErroFormulario(mensagemSenhaInvalida);
            return;
        }

        const payload: UsuarioSistemaCreate = {
            nomeUsuario: form.nomeUsuario,
            nome: form.nome,
            senha: form.senha,
            perfilAcesso: form.perfilAcesso,
            ativo: form.ativo
        };

        const result = await dispatch(criarUsuario(payload));

        if (criarUsuario.fulfilled.match(result)) {
            setShowModal(false);
            setPagina(1);
        }
    };

    const excluir = async (usuario: UsuarioSistema) => {
        if (usuarioLogado?.id === usuario.id) {
            window.alert('O usuário logado não pode excluir o próprio usuário.');
            return;
        }

        if (!window.confirm(`Deseja excluir o usuário ${usuario.nomeUsuario}?`)) {
            return;
        }

        await dispatch(excluirUsuario(usuario.id));
    };

    const handleMudarTamanhoPagina = (novoTamanho: number) => {
        setTamanhoPagina(novoTamanho);
        setPagina(1);
    };

    const handleOrdenar = (campo: UsuarioOrdenacaoCampo) => {
        if (ordenarPor === campo) {
            setDirecaoOrdenacao(direcaoOrdenacao === 'asc' ? 'desc' : 'asc');
            return;
        }

        setOrdenarPor(campo);
        setDirecaoOrdenacao(campo === 'criadoEmUtc' ? 'desc' : 'asc');
    };

    const limparFiltros = () => {
        setPesquisa('');
        setFiltroStatus('');
        setFiltroPerfil('');
        setOrdenarPor('nomeUsuario');
        setDirecaoOrdenacao('asc');
        setPagina(1);
    };

    return (
        <div className="row">
            <div className="col-12 mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                    <div>
                        <h2 className="h4 mb-0">Gestão de Usuários</h2>
                        <small className="text-muted">
                            {usuariosFiltradosOrdenados.length} de {itens.length} usuários exibidos.
                        </small>
                    </div>

                    <button className="btn btn-primary btn-sm" onClick={abrirNovo}>
                        Novo Usuário
                    </button>
                </div>

                <div className="card mb-3">
                    <div className="card-body">
                        <div className="row g-2">
                            <div className="col-md-5">
                                <label className="form-label">Pesquisar</label>
                                <input
                                    className="form-control form-control-sm"
                                    value={pesquisa}
                                    onChange={(e) => setPesquisa(e.target.value)}
                                    placeholder="Usuário, nome ou perfil"
                                />
                            </div>

                            <div className="col-md-2">
                                <label className="form-label">Perfil</label>
                                <select
                                    className="form-select form-select-sm"
                                    value={filtroPerfil}
                                    onChange={(e) => setFiltroPerfil(e.target.value)}
                                >
                                    <option value="">Todos</option>
                                    <option value="Leitura">Leitura</option>
                                    <option value="Cadastro">Cadastro</option>
                                    <option value="Administrador">Administrador</option>
                                </select>
                            </div>

                            <div className="col-md-3">
                                <label className="form-label">Status</label>
                                <select
                                    className="form-select form-select-sm"
                                    value={filtroStatus}
                                    onChange={(e) => setFiltroStatus(e.target.value)}
                                >
                                    <option value="">Todos</option>
                                    <option value="ativo">Ativo</option>
                                    <option value="inativo">Inativo</option>
                                </select>
                            </div>

                            <div className="col-md-2 d-flex align-items-end">
                                <button
                                    className="btn btn-outline-secondary btn-sm w-100"
                                    type="button"
                                    onClick={limparFiltros}
                                >
                                    Limpar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {carregando && <div className="alert alert-info">Carregando...</div>}
                {erro && <div className="alert alert-danger">{erro}</div>}

                <div className="table-responsive">
                    <table className="table table-sm table-striped align-middle">
                        <thead className="table-light">
                            <tr>
                                <CabecalhoOrdenavel campo="nomeUsuario" titulo="Usuário" ordenarPor={ordenarPor} direcaoOrdenacao={direcaoOrdenacao} onOrdenar={handleOrdenar} />
                                <CabecalhoOrdenavel campo="nome" titulo="Nome" ordenarPor={ordenarPor} direcaoOrdenacao={direcaoOrdenacao} onOrdenar={handleOrdenar} />
                                <CabecalhoOrdenavel campo="perfilAcesso" titulo="Perfil" ordenarPor={ordenarPor} direcaoOrdenacao={direcaoOrdenacao} onOrdenar={handleOrdenar} />
                                <CabecalhoOrdenavel campo="status" titulo="Status" ordenarPor={ordenarPor} direcaoOrdenacao={direcaoOrdenacao} onOrdenar={handleOrdenar} />
                                <CabecalhoOrdenavel campo="criadoEmUtc" titulo="Criado em" ordenarPor={ordenarPor} direcaoOrdenacao={direcaoOrdenacao} onOrdenar={handleOrdenar} />
                                <th style={{ width: 130 }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {usuariosPaginados.map(usuario => (
                                <tr key={usuario.id}>
                                    <td>{usuario.nomeUsuario}</td>
                                    <td>{usuario.nome}</td>
                                    <td>
                                        <span className={`badge ${badgePerfil(usuario.perfilAcesso)}`}>
                                            {usuario.perfilAcesso}
                                        </span>
                                    </td>
                                    <td>
                                        {usuario.ativo ? (
                                            <span className="badge bg-success">Ativo</span>
                                        ) : (
                                            <span className="badge bg-secondary">Inativo</span>
                                        )}
                                    </td>
                                    <td>{formatarDataHora(usuario.criadoEmUtc)}</td>
                                    <td>
                                        <div className="btn-group btn-group-sm">
                                            <button
                                                className="btn btn-outline-primary"
                                                type="button"
                                                onClick={() => abrirEditar(usuario)}
                                            >
                                                Editar
                                            </button>
                                            <button
                                                className="btn btn-outline-danger"
                                                type="button"
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

                {!usuariosFiltradosOrdenados.length && !carregando && (
                    <div className="alert alert-secondary">Nenhum usuário encontrado para os filtros aplicados.</div>
                )}

                {usuariosFiltradosOrdenados.length > 0 && (
                    <Paginacao
                        pagina={pagina}
                        tamanhoPagina={tamanhoPagina}
                        totalRegistros={usuariosFiltradosOrdenados.length}
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
                                    {erroFormulario && (
                                        <div className="alert alert-danger py-2">
                                            {erroFormulario}
                                        </div>
                                    )}

                                    <div className="mb-2">
                                        <label className="form-label">Usuário <span className="text-danger">*</span></label>
                                        <input
                                            className="form-control form-control-sm"
                                            value={form.nomeUsuario}
                                            onChange={(e) => setForm(prev => ({ ...prev, nomeUsuario: e.target.value }))}
                                            required
                                        />
                                    </div>

                                    <div className="mb-2">
                                        <label className="form-label">Nome <span className="text-danger">*</span></label>
                                        <input
                                            className="form-control form-control-sm"
                                            value={form.nome}
                                            onChange={(e) => setForm(prev => ({ ...prev, nome: e.target.value }))}
                                            required
                                        />
                                    </div>

                                    <div className="mb-2">
                                        <label className="form-label">Tipo de usuário <span className="text-danger">*</span></label>
                                        <select
                                            className="form-select form-select-sm"
                                            value={form.perfilAcesso}
                                            onChange={(e) => setForm(prev => ({
                                                ...prev,
                                                perfilAcesso: e.target.value as PerfilAcesso
                                            }))}
                                            required
                                        >
                                            <option value="Leitura">Leitura</option>
                                            <option value="Cadastro">Cadastro</option>
                                            <option value="Administrador">Administrador</option>
                                        </select>
                                        <small className="text-muted">
                                            Leitura visualiza dados. Cadastro cria, edita e exclui cadastros. Administrador possui acesso total.
                                        </small>
                                    </div>

                                    <div className="mb-2">
                                        <label className="form-label">
                                            {selecionado ? (
                                                'Nova senha'
                                            ) : (
                                                <>
                                                    Senha <span className="text-danger">*</span>
                                                </>
                                            )}
                                        </label>
                                        <input
                                            type="password"
                                            className="form-control form-control-sm"
                                            value={form.senha}
                                            onChange={(e) => setForm(prev => ({ ...prev, senha: e.target.value }))}
                                            required={!selecionado}
                                            minLength={6}
                                        />
                                        <small className="text-muted d-block">
                                            {selecionado
                                                ? 'Deixe em branco para manter a senha atual.'
                                                : 'Senha obrigatória.'}
                                        </small>
                                        <small className="text-muted d-block">
                                            Mínimo 6 caracteres, com maiúscula, minúscula, número e caractere especial.
                                        </small>
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
