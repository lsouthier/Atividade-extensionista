import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from './store';
import { logout } from './store/authSlice';
import { AnimaisPage } from './components/animais/AnimaisPage';
import { TutoresPage } from './components/tutores/TutoresPage';
import { ClinicasPage } from './components/clinicas/ClinicasPage';
import { CastracoesPa } from './components/castracoes/CastracoesPa';
import { UsuariosPage } from './components/usuarios/UsuariosPage';
import { LoginPage } from './components/auth/LoginPage';
import logo from './assets/logo.jpg';

type Pagina = 'animais' | 'tutores' | 'clinicas' | 'castracoes' | 'usuarios';

export const App: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { autenticado, usuario } = useSelector((state: RootState) => state.auth);
    const [paginaAtual, setPaginaAtual] = useState<Pagina>('animais');

    if (!autenticado) {
        return <LoginPage />;
    }

    const navegar = (pagina: Pagina) => (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        setPaginaAtual(pagina);
    };

    const sair = () => {
        dispatch(logout());
        setPaginaAtual('animais');
    };

    return (
        <div>
            <nav style={{ backgroundColor: '#589eaa' }} className="navbar navbar-expand-md navbar-dark mb-4 p-3">
                <div className="container">
                    <div style={{ display: 'flex', justifyContent: 'flex-start', width: '100%', margin: '0' }}>
                        <a
                            className="navbar-brand"
                            href="#"
                            onClick={navegar('animais')}
                            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}
                        >
                            <img src={logo} alt="PetApp Logo" style={{ height: '80px', width: 'auto' }} />
                        </a>
                    </div>

                    <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarMenu" aria-controls="navbarMenu" aria-expanded="false" aria-label="Alternar navegação">
                        <span className="navbar-toggler-icon"></span>
                    </button>

                    <div className="collapse navbar-collapse" id="navbarMenu">
                        <ul className="navbar-nav">
                            <li className="nav-item">
                                <a className={`nav-link ${paginaAtual === 'animais' ? 'active fw-bold' : ''}`} href="#" onClick={navegar('animais')}>
                                    Animais
                                </a>
                            </li>
                            <li className="nav-item">
                                <a className={`nav-link ${paginaAtual === 'tutores' ? 'active fw-bold' : ''}`} href="#" onClick={navegar('tutores')}>
                                    Tutores
                                </a>
                            </li>
                            <li className="nav-item">
                                <a className={`nav-link ${paginaAtual === 'clinicas' ? 'active fw-bold' : ''}`} href="#" onClick={navegar('clinicas')}>
                                    Clínicas
                                </a>
                            </li>
                            <li className="nav-item">
                                <a className={`nav-link ${paginaAtual === 'castracoes' ? 'active fw-bold' : ''}`} href="#" onClick={navegar('castracoes')}>
                                    Castrações
                                </a>
                            </li>
                            <li className="nav-item">
                                <a className={`nav-link ${paginaAtual === 'usuarios' ? 'active fw-bold' : ''}`} href="#" onClick={navegar('usuarios')}>
                                    Usuários
                                </a>
                            </li>
                        </ul>

                        <div className="d-flex align-items-center gap-2 ms-md-3 mt-3 mt-md-0">
                            <span className="text-white small text-nowrap">
                                {usuario?.nomeUsuario}
                            </span>
                            <button className="btn btn-sm btn-outline-light" onClick={sair}>
                                Sair
                            </button>
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
            </div>
        </div>
    );
};
