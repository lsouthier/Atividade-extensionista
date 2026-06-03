import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { login, LoginRequest, UsuarioLogado } from '../api/authApi';

interface AuthState {
    token?: string | null;
    usuario?: UsuarioLogado | null;
    autenticado: boolean;
    carregando: boolean;
    erro?: string;
}

const tokenSalvo = localStorage.getItem('petapp_token');
const usuarioSalvo = localStorage.getItem('petapp_usuario');

const initialState: AuthState = {
    token: tokenSalvo,
    usuario: usuarioSalvo ? JSON.parse(usuarioSalvo) : null,
    autenticado: Boolean(tokenSalvo),
    carregando: false
};

export const loginUsuario = createAsyncThunk(
    'auth/login',
    async (dados: LoginRequest, { rejectWithValue }) => {
        try {
            return await login(dados);
        } catch (e: any) {
            return rejectWithValue(e?.message ?? 'Erro ao fazer login.');
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
            state.autenticado = false;
            state.erro = undefined;

            localStorage.removeItem('petapp_token');
            localStorage.removeItem('petapp_usuario');
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
                state.autenticado = true;

                localStorage.setItem('petapp_token', action.payload.token);
                localStorage.setItem('petapp_usuario', JSON.stringify(action.payload.usuario));
            })
            .addCase(loginUsuario.rejected, (state, action) => {
                state.carregando = false;
                state.autenticado = false;
                state.erro = String(action.payload ?? action.error.message ?? 'Erro ao fazer login.');
            });
    }
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
