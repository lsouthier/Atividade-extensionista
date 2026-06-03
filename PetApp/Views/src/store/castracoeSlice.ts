import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
    Castracao,
    CastracaoCreate,
    CastracaoUpdate,
    createCastracao,
    deleteCastracao,
    getCastracoes,
    updateCastracao
} from '../api/castracoeApi';

export interface CastracoeState {
    itens: Castracao[];
    carregando: boolean;
    erro?: string;
    selecionado?: Castracao | null;
}

const initialState: CastracoeState = {
    itens: [],
    carregando: false,
    selecionado: null
};

const extrairMensagemErro = (payload: unknown, fallback: string): string => {
    if (!payload) {
        return fallback;
    }

    if (typeof payload === 'string') {
        return payload;
    }

    if (payload instanceof Error) {
        return payload.message;
    }

    if (typeof payload === 'object') {
        const obj = payload as Record<string, any>;

        if (typeof obj.erro === 'string') {
            return obj.erro;
        }

        if (typeof obj.message === 'string') {
            return obj.message;
        }

        if (typeof obj.title === 'string') {
            return obj.title;
        }

        const mensagens = Object.values(obj)
            .flatMap((valor) => {
                if (Array.isArray(valor)) {
                    return valor;
                }

                if (typeof valor === 'string') {
                    return [valor];
                }

                return [];
            })
            .filter(Boolean);

        if (mensagens.length > 0) {
            return mensagens.join(', ');
        }

        return JSON.stringify(obj);
    }

    return fallback;
};

export const carregarCastracoes = createAsyncThunk(
    'castracoes/carregar',
    async (_, { rejectWithValue }) => {
        try {
            return await getCastracoes();
        } catch (e: any) {
            return rejectWithValue(e?.message ?? 'Erro ao carregar castrações');
        }
    }
);

export const criarCastracao = createAsyncThunk(
    'castracoes/criar',
    async (dados: CastracaoCreate, { rejectWithValue }) => {
        try {
            return await createCastracao(dados);
        } catch (e: any) {
            return rejectWithValue(e?.message ?? e?.response?.data ?? 'Erro ao criar castração');
        }
    }
);

export const atualizarCastracao = createAsyncThunk(
    'castracoes/atualizar',
    async (dados: CastracaoUpdate, { rejectWithValue }) => {
        try {
            await updateCastracao(dados);
            return dados;
        } catch (e: any) {
            return rejectWithValue(e?.message ?? e?.response?.data ?? 'Erro ao atualizar castração');
        }
    }
);

export const excluirCastracao = createAsyncThunk(
    'castracoes/excluir',
    async (id: number, { rejectWithValue }) => {
        try {
            await deleteCastracao(id);
            return id;
        } catch (e: any) {
            return rejectWithValue(e?.message ?? e?.response?.data ?? 'Erro ao excluir castração');
        }
    }
);

const castracoeSlice = createSlice({
    name: 'castracoes',
    initialState,
    reducers: {
        selecionarCastracao(state, action: PayloadAction<Castracao | null>) {
            state.selecionado = action.payload;
            state.erro = undefined;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(carregarCastracoes.pending, (state) => {
                state.carregando = true;
                state.erro = undefined;
            })
            .addCase(carregarCastracoes.fulfilled, (state, action) => {
                state.carregando = false;
                state.itens = action.payload;
            })
            .addCase(carregarCastracoes.rejected, (state, action) => {
                state.carregando = false;
                state.erro = extrairMensagemErro(action.payload ?? action.error.message, 'Erro ao carregar castrações');
            })
            .addCase(criarCastracao.pending, (state) => {
                state.carregando = true;
                state.erro = undefined;
            })
            .addCase(criarCastracao.fulfilled, (state, action) => {
                state.carregando = false;
                state.itens.push(action.payload);
                state.selecionado = null;
            })
            .addCase(criarCastracao.rejected, (state, action) => {
                state.carregando = false;
                state.erro = extrairMensagemErro(action.payload ?? action.error.message, 'Erro ao criar castração');
            })
            .addCase(atualizarCastracao.pending, (state) => {
                state.carregando = true;
                state.erro = undefined;
            })
            .addCase(atualizarCastracao.fulfilled, (state, action) => {
                state.carregando = false;

                const index = state.itens.findIndex(c => c.id === action.payload.id);
                if (index >= 0) {
                    state.itens[index] = { ...state.itens[index], ...action.payload };
                }

                state.selecionado = null;
            })
            .addCase(atualizarCastracao.rejected, (state, action) => {
                state.carregando = false;
                state.erro = extrairMensagemErro(action.payload ?? action.error.message, 'Erro ao atualizar castração');
            })
            .addCase(excluirCastracao.pending, (state) => {
                state.carregando = true;
                state.erro = undefined;
            })
            .addCase(excluirCastracao.fulfilled, (state, action) => {
                state.carregando = false;
                state.itens = state.itens.filter(c => c.id !== action.payload);
            })
            .addCase(excluirCastracao.rejected, (state, action) => {
                state.carregando = false;
                state.erro = extrairMensagemErro(action.payload ?? action.error.message, 'Erro ao excluir castração');
            });
    }
});

export const { selecionarCastracao } = castracoeSlice.actions;
export default castracoeSlice.reducer;
