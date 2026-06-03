import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
    Animal,
    AnimalCreate,
    AnimalUpdate,
    getAnimais,
    createAnimal,
    updateAnimal,
    deleteAnimal
} from '../api/animaisApi';

export interface AnimalDeletePayload {
    id: number;
    excluirCastracoes?: boolean;
}

export interface AnimalDeleteConfirmacao {
    id: number;
    requerConfirmacao: boolean;
    totalCastracoes: number;
    erro: string;
}

export interface AnimaisState {
    itens: Animal[];
    carregando: boolean;
    erro?: string;
    selecionado?: Animal | null;
    confirmacaoExclusao?: AnimalDeleteConfirmacao | null;
}

const initialState: AnimaisState = {
    itens: [],
    carregando: false,
    selecionado: null,
    confirmacaoExclusao: null
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

export const carregarAnimais = createAsyncThunk(
    'animais/carregar',
    async (_, { rejectWithValue }) => {
        try {
            return await getAnimais();
        } catch (e: any) {
            return rejectWithValue(e?.data ?? e?.message ?? 'Erro ao carregar animais');
        }
    }
);

export const criarAnimal = createAsyncThunk(
    'animais/criar',
    async (dados: AnimalCreate, { rejectWithValue }) => {
        try {
            return await createAnimal(dados);
        } catch (e: any) {
            return rejectWithValue(e?.data ?? e?.message ?? 'Erro ao criar animal');
        }
    }
);

export const atualizarAnimal = createAsyncThunk(
    'animais/atualizar',
    async (dados: AnimalUpdate, { rejectWithValue }) => {
        try {
            await updateAnimal(dados);
            return dados;
        } catch (e: any) {
            return rejectWithValue(e?.data ?? e?.message ?? 'Erro ao atualizar animal');
        }
    }
);

export const excluirAnimal = createAsyncThunk(
    'animais/excluir',
    async (dados: AnimalDeletePayload, { rejectWithValue }) => {
        try {
            await deleteAnimal(dados.id, dados.excluirCastracoes ?? false);
            return dados.id;
        } catch (e: any) {
            const data = e?.data;

            if (e?.status === 409 && data?.requerConfirmacao) {
                return rejectWithValue({
                    id: dados.id,
                    requerConfirmacao: true,
                    totalCastracoes: data.totalCastracoes ?? 0,
                    erro: data.erro ?? 'Este pet possui castrações vinculadas.'
                });
            }

            return rejectWithValue(data ?? e?.message ?? 'Erro ao excluir animal');
        }
    }
);

const animaisSlice = createSlice({
    name: 'animais',
    initialState,
    reducers: {
        selecionarAnimal(state, action: PayloadAction<Animal | null>) {
            state.selecionado = action.payload;
            state.erro = undefined;
        },
        limparConfirmacaoExclusaoAnimal(state) {
            state.confirmacaoExclusao = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(carregarAnimais.pending, (state) => {
                state.carregando = true;
                state.erro = undefined;
            })
            .addCase(carregarAnimais.fulfilled, (state, action) => {
                state.carregando = false;
                state.itens = action.payload;
            })
            .addCase(carregarAnimais.rejected, (state, action) => {
                state.carregando = false;
                state.erro = extrairMensagemErro(action.payload ?? action.error.message, 'Erro ao carregar animais');
            })
            .addCase(criarAnimal.pending, (state) => {
                state.carregando = true;
                state.erro = undefined;
            })
            .addCase(criarAnimal.fulfilled, (state, action) => {
                state.carregando = false;
                state.itens.push(action.payload);
                state.selecionado = null;
            })
            .addCase(criarAnimal.rejected, (state, action) => {
                state.carregando = false;
                state.erro = extrairMensagemErro(action.payload ?? action.error.message, 'Erro ao criar animal');
            })
            .addCase(atualizarAnimal.pending, (state) => {
                state.carregando = true;
                state.erro = undefined;
            })
            .addCase(atualizarAnimal.fulfilled, (state, action) => {
                state.carregando = false;

                const index = state.itens.findIndex(a => a.id === action.payload.id);
                if (index >= 0) {
                    state.itens[index] = { ...state.itens[index], ...action.payload };
                }

                state.selecionado = null;
            })
            .addCase(atualizarAnimal.rejected, (state, action) => {
                state.carregando = false;
                state.erro = extrairMensagemErro(action.payload ?? action.error.message, 'Erro ao atualizar animal');
            })
            .addCase(excluirAnimal.pending, (state) => {
                state.carregando = true;
                state.erro = undefined;
            })
            .addCase(excluirAnimal.fulfilled, (state, action) => {
                state.carregando = false;
                state.itens = state.itens.filter(a => a.id !== action.payload);
                state.confirmacaoExclusao = null;
            })
            .addCase(excluirAnimal.rejected, (state, action) => {
                state.carregando = false;

                const payload = action.payload as any;

                if (payload?.requerConfirmacao) {
                    state.confirmacaoExclusao = payload as AnimalDeleteConfirmacao;
                    state.erro = undefined;
                    return;
                }

                state.erro = extrairMensagemErro(action.payload ?? action.error.message, 'Erro ao excluir animal');
            });
    }
});

export const { selecionarAnimal, limparConfirmacaoExclusaoAnimal } = animaisSlice.actions;
export default animaisSlice.reducer;
