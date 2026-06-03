import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
    Tutor,
    TutorCreate,
    TutorUpdate,
    getTutores,
    createTutor,
    updateTutor,
    deleteTutor
} from '../api/tutoresApi';

export interface TutorDeletePayload {
    id: number;
    excluirAnimais?: boolean;
}

export interface TutorDeleteConfirmacao {
    id: number;
    requerConfirmacao: boolean;
    totalAnimais: number;
    erro: string;
}

export interface TutoresState {
    itens: Tutor[];
    carregando: boolean;
    erro?: string;
    selecionado?: Tutor | null;
    confirmacaoExclusao?: TutorDeleteConfirmacao | null;
}

const initialState: TutoresState = {
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

export const carregarTutores = createAsyncThunk(
    'tutores/carregar',
    async (_, { rejectWithValue }) => {
        try {
            return await getTutores();
        } catch (e: any) {
            return rejectWithValue(e?.message ?? e?.data ?? 'Erro ao carregar tutores');
        }
    }
);

export const criarTutor = createAsyncThunk(
    'tutores/criar',
    async (dados: TutorCreate, { rejectWithValue }) => {
        if (!dados.nome || !dados.nome.trim()) {
            return rejectWithValue('Nome do tutor é obrigatório e não pode estar vazio.');
        }

        try {
            return await createTutor({
                ...dados,
                nome: dados.nome.trim(),
                endereco: dados.endereco?.trim() ?? '',
                telefone: dados.telefone?.trim() ?? ''
            });
        } catch (e: any) {
            return rejectWithValue(e?.data ?? e?.message ?? 'Erro ao criar tutor');
        }
    }
);

export const atualizarTutor = createAsyncThunk(
    'tutores/atualizar',
    async (dados: TutorUpdate, { rejectWithValue }) => {
        if (!dados.nome || !dados.nome.trim()) {
            return rejectWithValue('Nome do tutor é obrigatório e não pode estar vazio.');
        }

        try {
            const tutorAtualizado = {
                ...dados,
                nome: dados.nome.trim(),
                endereco: dados.endereco?.trim() ?? '',
                telefone: dados.telefone?.trim() ?? ''
            };

            await updateTutor(tutorAtualizado);
            return tutorAtualizado;
        } catch (e: any) {
            return rejectWithValue(e?.data ?? e?.message ?? 'Erro ao atualizar tutor');
        }
    }
);

export const excluirTutor = createAsyncThunk(
    'tutores/excluir',
    async (dados: TutorDeletePayload, { rejectWithValue }) => {
        try {
            await deleteTutor(dados.id, dados.excluirAnimais ?? false);
            return dados.id;
        } catch (e: any) {
            const data = e?.data;

            if (e?.status === 409 && data?.requerConfirmacao) {
                return rejectWithValue({
                    id: dados.id,
                    requerConfirmacao: true,
                    totalAnimais: data.totalAnimais ?? 0,
                    erro: data.erro ?? 'Este tutor possui pets vinculados.'
                });
            }

            return rejectWithValue(data ?? e?.message ?? 'Erro ao excluir tutor');
        }
    }
);

const tutoresSlice = createSlice({
    name: 'tutores',
    initialState,
    reducers: {
        selecionarTutor(state, action: PayloadAction<Tutor | null>) {
            state.selecionado = action.payload;
            state.erro = undefined;
        },
        limparConfirmacaoExclusao(state) {
            state.confirmacaoExclusao = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(carregarTutores.pending, (state) => {
                state.carregando = true;
                state.erro = undefined;
            })
            .addCase(carregarTutores.fulfilled, (state, action) => {
                state.carregando = false;
                state.itens = action.payload;
            })
            .addCase(carregarTutores.rejected, (state, action) => {
                state.carregando = false;
                state.erro = extrairMensagemErro(action.payload ?? action.error.message, 'Erro ao carregar tutores');
            })
            .addCase(criarTutor.pending, (state) => {
                state.carregando = true;
                state.erro = undefined;
            })
            .addCase(criarTutor.fulfilled, (state, action) => {
                state.carregando = false;
                state.itens.push(action.payload);
                state.selecionado = null;
            })
            .addCase(criarTutor.rejected, (state, action) => {
                state.carregando = false;
                state.erro = extrairMensagemErro(action.payload ?? action.error.message, 'Erro ao criar tutor');
            })
            .addCase(atualizarTutor.pending, (state) => {
                state.carregando = true;
                state.erro = undefined;
            })
            .addCase(atualizarTutor.fulfilled, (state, action) => {
                state.carregando = false;

                const index = state.itens.findIndex(t => t.id === action.payload.id);
                if (index >= 0) {
                    state.itens[index] = { ...state.itens[index], ...action.payload };
                }

                state.selecionado = null;
            })
            .addCase(atualizarTutor.rejected, (state, action) => {
                state.carregando = false;
                state.erro = extrairMensagemErro(action.payload ?? action.error.message, 'Erro ao atualizar tutor');
            })
            .addCase(excluirTutor.pending, (state) => {
                state.carregando = true;
                state.erro = undefined;
            })
            .addCase(excluirTutor.fulfilled, (state, action) => {
                state.carregando = false;
                state.itens = state.itens.filter(t => t.id !== action.payload);
                state.confirmacaoExclusao = null;
            })
            .addCase(excluirTutor.rejected, (state, action) => {
                state.carregando = false;

                const payload = action.payload as any;

                if (payload?.requerConfirmacao) {
                    state.confirmacaoExclusao = payload as TutorDeleteConfirmacao;
                    state.erro = undefined;
                    return;
                }

                state.erro = extrairMensagemErro(action.payload ?? action.error.message, 'Erro ao excluir tutor');
            });
    }
});

export const { selecionarTutor, limparConfirmacaoExclusao } = tutoresSlice.actions;
export default tutoresSlice.reducer;
