import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from './store';
import { logout, validarSessaoAtual, validarSessaoServidor } from './store/authSlice';
import { AnimaisPage } from './components/animais/AnimaisPage';
import { TutoresPage } from './components/tutores/TutoresPage';
import { ClinicasPage } from './components/clinicas/ClinicasPage';
import { CastracoesPa } from './components/castracoes/CastracoesPa';
import { UsuariosPage } from './components/usuarios/UsuariosPage';
import { AuditoriaPage } from './components/auditoria/AuditoriaPage';
import { LoginPage } from './components/auth/LoginPage';
import { VersionFooter } from './components/common/VersionFooter';
import logo from './assets/logo.jpg';
import './styles/responsive.css';

type Pagina = 'animais' | 'tutores' | 'clinicas' | 'castracoes' | 'usuarios' | 'auditoria';
type PerfilAcesso = 'Leitura' | 'Cadastro' | 'Administrador';

const obterClassePerfil = (perfil: PerfilAcesso): string => {
    return `perfil-${perfil.toLowerCase()}`;
};

export const App: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { autenticado, usuario } = useSelector((state: RootState) => state.auth);
    const [paginaAtual, setPaginaAtual] = useState<Pagina>('animais');
    const [menuAberto, setMenuAberto] = useState(false);

    const perfilAcesso = (usuario?.perfilAcesso ?? 'Leitura') as PerfilAcesso;
    const ehAdministrador = perfilAcesso === 'Administrador';

    useEffect(() => {
        dispatch(validarSessaoAtual());

        const tratarSessaoExpirada = () => {
            dispatch(logout());
            setPaginaAtual('animais');
            setMenuAberto(false);
        };

        window.addEventListener('petapp:sessao-expirada', tratarSessaoExpirada);

        return () => {
            window.removeEventListener('petapp:sessao-expirada', tratarSessaoExpirada);
        };
    }, [dispatch]);

    useEffect(() => {
        if (autenticado) {
            dispatch(validarSessaoServidor());
        }
    }, [autenticado, dispatch]);

    useEffect(() => {
        if (!ehAdministrador && (paginaAtual === 'usuarios' || paginaAtual === 'auditoria')) {
            setPaginaAtual('animais');
            setMenuAberto(false);
        }
    }, [ehAdministrador, paginaAtual]);

    if (!autenticado) {
        return (
            <div className="petapp-shell-login">
                <LoginPage />
                <VersionFooter />
            </div>
        );
    }

    const navegar = (pagina: Pagina) => async (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();

        const validacao = await dispatch(validarSessaoServidor());

        if (validarSessaoServidor.rejected.match(validacao)) {
            setPaginaAtual('animais');
            setMenuAberto(false);
            return;
        }

        if (!ehAdministrador && (pagina === 'usuarios' || pagina === 'auditoria')) {
            setPaginaAtual('animais');
            setMenuAberto(false);
            return;
        }

        setPaginaAtual(pagina);
        setMenuAberto(false);
    };

    const sair = () => {
        dispatch(logout());
        setPaginaAtual('animais');
        setMenuAberto(false);
    };

    return (
        <div className={obterClassePerfil(perfilAcesso)}>
            <nav className="petapp-navbar mb-4 p-3">
                <div className="container">
                    <div className="petapp-navbar-inner">
                        <div className="d-flex flex-column align-items-start">
                            <a
                                href="#"
                                onClick={navegar('animais')}
                                style={{ textDecoration: 'none' }}
                            >
                                <img src={logo} alt="PetApp Logo" className="petapp-logo" />
                            </a>

                            <button
                                type="button"
                                className="petapp-menu-button"
                                onClick={() => setMenuAberto(prev => !prev)}
                                aria-label="Abrir menu"
                                aria-expanded={menuAberto}
                            >
                                ☰
                            </button>
                        </div>

                        <div className={`petapp-menu ${menuAberto ? 'aberto' : ''}`}>
                            <div className="petapp-menu-links">
                                <a className={`petapp-menu-link ${paginaAtual === 'animais' ? 'active fw-bold' : ''}`} href="#" onClick={navegar('animais')}>
                                    Pets
                                </a>
                                <a className={`petapp-menu-link ${paginaAtual === 'tutores' ? 'active fw-bold' : ''}`} href="#" onClick={navegar('tutores')}>
                                    Tutores
                                </a>
                                <a className={`petapp-menu-link ${paginaAtual === 'clinicas' ? 'active fw-bold' : ''}`} href="#" onClick={navegar('clinicas')}>
                                    Clínicas
                                </a>
                                <a className={`petapp-menu-link ${paginaAtual === 'castracoes' ? 'active fw-bold' : ''}`} href="#" onClick={navegar('castracoes')}>
                                    Castrações
                                </a>

                                {ehAdministrador && (
                                    <>
                                        <a className={`petapp-menu-link ${paginaAtual === 'usuarios' ? 'active fw-bold' : ''}`} href="#" onClick={navegar('usuarios')}>
                                            Usuários
                                        </a>
                                        <a className={`petapp-menu-link ${paginaAtual === 'auditoria' ? 'active fw-bold' : ''}`} href="#" onClick={navegar('auditoria')}>
                                            Auditoria
                                        </a>
                                    </>
                                )}
                            </div>

                            <div className="petapp-user-area">
                                <span className="text-white small text-nowrap">
                                    {usuario?.nomeUsuario} · {perfilAcesso}
                                </span>
                                <button className="btn btn-sm btn-outline-light" onClick={sair}>
                                    Sair
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="container petapp-main-content">
                {paginaAtual === 'animais' && <AnimaisPage />}
                {paginaAtual === 'tutores' && <TutoresPage />}
                {paginaAtual === 'clinicas' && <ClinicasPage />}
                {paginaAtual === 'castracoes' && <CastracoesPa />}
                {paginaAtual === 'usuarios' && ehAdministrador && <UsuariosPage />}
                {paginaAtual === 'auditoria' && ehAdministrador && <AuditoriaPage />}
            </main>

            <VersionFooter />
        </div>
    );
};
