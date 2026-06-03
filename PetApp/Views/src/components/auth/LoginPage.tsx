import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../store';
import { loginUsuario } from '../../store/authSlice';
import logo from '../../assets/logo.jpg';

export const LoginPage: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { carregando, erro } = useSelector((state: RootState) => state.auth);

    const [nomeUsuario, setNomeUsuario] = useState('');
    const [senha, setSenha] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        await dispatch(loginUsuario({
            nomeUsuario,
            senha
        }));
    };

    return (
        <div
            className="min-vh-100 d-flex align-items-center justify-content-center"
            style={{ background: 'linear-gradient(135deg, #589eaa 0%, #f4f7f8 100%)' }}
        >
            <div className="card shadow" style={{ width: '100%', maxWidth: 420 }}>
                <div className="card-body p-4">
                    <div className="text-center mb-3">
                        <img
                            src={logo}
                            alt="ACAT"
                            style={{ maxWidth: 140, height: 'auto' }}
                        />
                    </div>

                    <h1 className="h4 text-center mb-1">Acesso ao sistema</h1>
                    <p className="text-muted text-center mb-4">PetApp ACAT</p>

                    {erro && (
                        <div className="alert alert-danger">
                            {erro}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label className="form-label">Usuário</label>
                            <input
                                className="form-control"
                                value={nomeUsuario}
                                onChange={(e) => setNomeUsuario(e.target.value)}
                                autoComplete="username"
                                required
                                autoFocus
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Senha</label>
                            <input
                                type="password"
                                className="form-control"
                                value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                                autoComplete="current-password"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary w-100"
                            disabled={carregando}
                        >
                            {carregando ? 'Entrando...' : 'Entrar'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
