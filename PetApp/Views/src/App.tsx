import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from './store';
import { logout, validarSessaoAtual } from './store/authSlice';
import { AnimaisPage } from './components/animais/AnimaisPage';
import { TutoresPage } from './components/tutores/TutoresPage';
import { ClinicasPage } from './components/clinicas/ClinicasPage';
import { CastracoesPa } from './components/castracoes/CastracoesPa';
import { UsuariosPage } from './components/usuarios/UsuariosPage';
import { AuditoriaPage } from './components/auditoria/AuditoriaPage';
import { LoginPage } from './components/auth/LoginPage';
import logo from './assets/logo.jpg';
import './styles/responsive.css';

type Pagina = 'animais' | 'tutores' | 'clinicas' | 'castracoes' | 'usuarios' | 'auditoria';

export const App: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { autenticado, usuario } = useSelector((state: RootState) => state.auth);
    const [paginaAtual, setPaginaAtual] = useState<Pagina>('animais');
    const [menuAberto, setMenuAberto] = useState(false);

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

    if (!autenticado) {
        return <LoginPage />;
    }

    const navegar = (pagina: Pagina) => (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        setPaginaAtual(pagina);
        setMenuAberto(false);
    };

    const sair = () => {
        dispatch(logout());
        setPaginaAtual('animais');
        setMenuAberto(false);
    };

    return (
        <div>
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
                                    Animais
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
                                <a className={`petapp-menu-link ${paginaAtual === 'usuarios' ? 'active fw-bold' : ''}`} href="#" onClick={navegar('usuarios')}>
                                    Usuários
                                </a>
                                <a className={`petapp-menu-link ${paginaAtual === 'auditoria' ? 'active fw-bold' : ''}`} href="#" onClick={navegar('auditoria')}>
                                    Auditoria
                                </a>
                            </div>

                            <div className="petapp-user-area">
                                <span className="text-white small text-nowrap">
                                    {usuario?.nomeUsuario}
                                </span>
                                <button className="btn btn-sm btn-outline-light" onClick={sair}>
                                    Sair
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="container">
                {paginaAtual === 'animais' && <AnimaisPage />}
                {paginaAtual === 'tutores' && <TutoresPage />}
                {paginaAtual === 'clinicas' && <ClinicasPage />}
                {paginaAtual === 'castracoes' && <CastracoesPa />}
                {paginaAtual === 'usuarios' && <UsuariosPage />}
                {paginaAtual === 'auditoria' && <AuditoriaPage />}
            </div>
        </div>
    );
};
