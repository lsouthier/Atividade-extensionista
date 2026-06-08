import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { login, LoginRequest, UsuarioLogado, me } from '../api/authApi';

interface AuthState {
    token?: string | null;
    usuario?: UsuarioLogado | null;
    expiraEmUtc?: string | null;
    autenticado: boolean;
    carregando: boolean;
    erro?: string;
}

const limparSessao = () => {
    sessionStorage.removeItem('petapp_token');
    sessionStorage.removeItem('petapp_usuario');
    sessionStorage.removeItem('petapp_expira_em_utc');

    localStorage.removeItem('petapp_token');
    localStorage.removeItem('petapp_usuario');
    localStorage.removeItem('petapp_expira_em_utc');
};

const tokenEstaValido = (token?: string | null, expiraEmUtc?: string | null): boolean => {
    if (!token || !expiraEmUtc) {
        return false;
    }

    const expiraEm = new Date(expiraEmUtc).getTime();

    if (Number.isNaN(expiraEm)) {
        return false;
    }

    return expiraEm > Date.now();
};

const tokenSalvo = sessionStorage.getItem('petapp_token');
const usuarioSalvo = sessionStorage.getItem('petapp_usuario');
const expiraEmUtcSalvo = sessionStorage.getItem('petapp_expira_em_utc');

const sessaoValida = tokenEstaValido(tokenSalvo, expiraEmUtcSalvo);

if (!sessaoValida) {
    limparSessao();
}

const initialState: AuthState = {
    token: sessaoValida ? tokenSalvo : null,
    usuario: sessaoValida && usuarioSalvo ? JSON.parse(usuarioSalvo) : null,
    expiraEmUtc: sessaoValida ? expiraEmUtcSalvo : null,
    autenticado: sessaoValida,
    carregando: false
};

export const loginUsuario = createAsyncThunk(
    'auth/login',
    async (dados: LoginRequest, { rejectWithValue }) => {
        try {
            return await login(dados);
        } catch (e: any) {
            return rejectWithValue(e?.response?.data?.erro ?? e?.message ?? 'Erro ao fazer login.');
        }
    }
);

export const validarSessaoServidor = createAsyncThunk(
    'auth/validarSessaoServidor',
    async (_, { rejectWithValue }) => {
        try {
            return await me();
        } catch (e: any) {
            return rejectWithValue(e?.response?.data?.erro ?? e?.message ?? 'Sessão expirada.');
        }
    }
);

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout(state) {
            state.token = null;
            state.usuario = null;
            state.expiraEmUtc = null;
            state.autenticado = false;
            state.erro = undefined;

            limparSessao();
        },
        validarSessaoAtual(state) {
            if (!tokenEstaValido(state.token, state.expiraEmUtc)) {
                state.token = null;
                state.usuario = null;
                state.expiraEmUtc = null;
                state.autenticado = false;
                state.erro = undefined;

                limparSessao();
            }
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(loginUsuario.pending, (state) => {
                state.carregando = true;
                state.erro = undefined;
            })
            .addCase(loginUsuario.fulfilled, (state, action) => {
                state.carregando = false;
                state.token = action.payload.token;
                state.usuario = action.payload.usuario;
                state.expiraEmUtc = action.payload.expiraEmUtc;
                state.autenticado = true;

                sessionStorage.setItem('petapp_token', action.payload.token);
                sessionStorage.setItem('petapp_usuario', JSON.stringify(action.payload.usuario));
                sessionStorage.setItem('petapp_expira_em_utc', action.payload.expiraEmUtc);

                localStorage.removeItem('petapp_token');
                localStorage.removeItem('petapp_usuario');
                localStorage.removeItem('petapp_expira_em_utc');
            })
            .addCase(loginUsuario.rejected, (state, action) => {
                state.carregando = false;
                state.autenticado = false;
                state.erro = String(action.payload ?? action.error.message ?? 'Erro ao fazer login.');

                limparSessao();
            })
            .addCase(validarSessaoServidor.fulfilled, (state, action) => {
                state.usuario = action.payload;
                sessionStorage.setItem('petapp_usuario', JSON.stringify(action.payload));
            })
            .addCase(validarSessaoServidor.rejected, (state) => {
                state.token = null;
                state.usuario = null;
                state.expiraEmUtc = null;
                state.autenticado = false;
                state.erro = 'Sessão expirada. Faça login novamente.';

                limparSessao();
            });
    }
});

export const { logout, validarSessaoAtual } = authSlice.actions;
export default authSlice.reducer;
