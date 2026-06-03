import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
    UsuarioSistema,
    UsuarioSistemaCreate,
    UsuarioSistemaUpdate,
    getUsuarios,
    createUsuario,
    updateUsuario,
    deleteUsuario
} from '../api/usuariosApi';

interface UsuariosState {
    itens: UsuarioSistema[];
    carregando: boolean;
    erro?: string;
    selecionado?: UsuarioSistema | null;
}

const initialState: UsuariosState = {
    itens: [],
    carregando: false,
    selecionado: null
};

const extrairErro = (e: any, fallback: string): string => {
    return e?.message ?? e?.data?.erro ?? fallback;
};

export const carregarUsuarios = createAsyncThunk(
    'usuarios/carregar',
    async (_, { rejectWithValue }) => {
        try {
            return await getUsuarios();
        } catch (e: any) {
            return rejectWithValue(extrairErro(e, 'Erro ao carregar usuários.'));
        }
    }
);

export const criarUsuario = createAsyncThunk(
    'usuarios/criar',
    async (dados: UsuarioSistemaCreate, { rejectWithValue }) => {
        try {
            return await createUsuario(dados);
        } catch (e: any) {
            return rejectWithValue(extrairErro(e, 'Erro ao criar usuário.'));
        }
    }
);

export const atualizarUsuario = createAsyncThunk(
    'usuarios/atualizar',
    async (dados: UsuarioSistemaUpdate, { rejectWithValue }) => {
        try {
            await updateUsuario(dados);
            return dados;
        } catch (e: any) {
            return rejectWithValue(extrairErro(e, 'Erro ao atualizar usuário.'));
        }
    }
);

export const excluirUsuario = createAsyncThunk(
    'usuarios/excluir',
    async (id: number, { rejectWithValue }) => {
        try {
            await deleteUsuario(id);
            return id;
        } catch (e: any) {
            return rejectWithValue(extrairErro(e, 'Erro ao excluir usuário.'));
        }
    }
);

const usuariosSlice = createSlice({
    name: 'usuarios',
    initialState,
    reducers: {
        selecionarUsuario(state, action: PayloadAction<UsuarioSistema | null>) {
            state.selecionado = action.payload;
            state.erro = undefined;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(carregarUsuarios.pending, (state) => {
                state.carregando = true;
                state.erro = undefined;
            })
            .addCase(carregarUsuarios.fulfilled, (state, action) => {
                state.carregando = false;
                state.itens = action.payload;
            })
            .addCase(carregarUsuarios.rejected, (state, action) => {
                state.carregando = false;
                state.erro = String(action.payload ?? action.error.message ?? 'Erro ao carregar usuários.');
            })
            .addCase(criarUsuario.fulfilled, (state, action) => {
                state.itens.push(action.payload);
                state.selecionado = null;
            })
            .addCase(criarUsuario.rejected, (state, action) => {
                state.erro = String(action.payload ?? action.error.message ?? 'Erro ao criar usuário.');
            })
            .addCase(atualizarUsuario.fulfilled, (state, action) => {
                const index = state.itens.findIndex(u => u.id === action.payload.id);
                if (index >= 0) {
                    state.itens[index] = {
                        ...state.itens[index],
                        nomeUsuario: action.payload.nomeUsuario,
                        nome: action.payload.nome,
                        ativo: action.payload.ativo
                    };
                }

                state.selecionado = null;
            })
            .addCase(atualizarUsuario.rejected, (state, action) => {
                state.erro = String(action.payload ?? action.error.message ?? 'Erro ao atualizar usuário.');
            })
            .addCase(excluirUsuario.fulfilled, (state, action) => {
                state.itens = state.itens.filter(u => u.id !== action.payload);
            })
            .addCase(excluirUsuario.rejected, (state, action) => {
                state.erro = String(action.payload ?? action.error.message ?? 'Erro ao excluir usuário.');
            });
    }
});

export const { selecionarUsuario } = usuariosSlice.actions;
export default usuariosSlice.reducer;
