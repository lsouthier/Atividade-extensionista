import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
    Clinica,
    ClinicaCreate,
    ClinicaUpdate,
    getClinicas,
    createClinica,
    updateClinica,
    deleteClinica
} from '../api/clinicasApi';

export interface ConfirmacaoExclusaoClinica {
    id: number;
    totalCastracoes: number;
    erro: string;
}

export interface ClinicasState {
    itens: Clinica[];
    carregando: boolean;
    erro?: string;
    selecionado?: Clinica | null;
    confirmacaoExclusao?: ConfirmacaoExclusaoClinica | null;
}

const initialState: ClinicasState = {
    itens: [],
    carregando: false,
    selecionado: null,
    confirmacaoExclusao: null
};

const obterDadosErro = (e: any): any => {
    return e?.response?.data ?? e?.data ?? e;
};

const extrairErro = (e: any, fallback: string): string => {
    const data = obterDadosErro(e);

    if (!data) {
        return e?.message ?? fallback;
    }

    if (typeof data === 'string') {
        return data;
    }

    if (typeof data?.erro === 'string') {
        return data.erro;
    }

    if (typeof data?.message === 'string') {
        return data.message;
    }

    if (typeof data?.title === 'string') {
        return data.title;
    }

    return fallback;
};

export const carregarClinicas = createAsyncThunk(
    'clinicas/carregar',
    async (_, { rejectWithValue }) => {
        try {
            return await getClinicas();
        } catch (e: any) {
            return rejectWithValue(extrairErro(e, 'Erro ao carregar clínicas.'));
        }
    }
);

export const criarClinica = createAsyncThunk(
    'clinicas/criar',
    async (dados: ClinicaCreate, { rejectWithValue }) => {
        try {
            return await createClinica(dados);
        } catch (e: any) {
            return rejectWithValue(extrairErro(e, 'Erro ao criar clínica.'));
        }
    }
);

export const atualizarClinica = createAsyncThunk(
    'clinicas/atualizar',
    async (dados: ClinicaUpdate, { rejectWithValue }) => {
        try {
            await updateClinica(dados);
            return dados;
        } catch (e: any) {
            return rejectWithValue(extrairErro(e, 'Erro ao atualizar clínica.'));
        }
    }
);

export const excluirClinica = createAsyncThunk(
    'clinicas/excluir',
    async (
        dados: { id: number; excluirCastracoes?: boolean },
        { rejectWithValue }
    ) => {
        try {
            await deleteClinica(dados.id, dados.excluirCastracoes ?? false);
            return dados.id;
        } catch (e: any) {
            const status = e?.response?.status ?? e?.status;
            const data = obterDadosErro(e);

            if (
                status === 409 ||
                data?.requerConfirmacao === true ||
                data?.totalCastracoes !== undefined
            ) {
                return rejectWithValue({
                    id: dados.id,
                    totalCastracoes: Number(data?.totalCastracoes ?? 0),
                    erro: data?.erro ?? 'Esta clínica possui castrações vinculadas.'
                });
            }

            return rejectWithValue(extrairErro(e, 'Erro ao excluir clínica.'));
        }
    }
);

const clinicasSlice = createSlice({
    name: 'clinicas',
    initialState,
    reducers: {
        selecionarClinica(state, action: PayloadAction<Clinica | null>) {
            state.selecionado = action.payload;
            state.erro = undefined;
        },
        limparConfirmacaoExclusaoClinica(state) {
            state.confirmacaoExclusao = null;
            state.erro = undefined;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(carregarClinicas.pending, (state) => {
                state.carregando = true;
                state.erro = undefined;
            })
            .addCase(carregarClinicas.fulfilled, (state, action) => {
                state.carregando = false;
                state.itens = action.payload;
                state.erro = undefined;
            })
            .addCase(carregarClinicas.rejected, (state, action) => {
                state.carregando = false;
                state.erro = String(action.payload ?? action.error.message ?? 'Erro ao carregar clínicas.');
            })
            .addCase(criarClinica.fulfilled, (state, action) => {
                state.itens.push(action.payload);
                state.selecionado = null;
                state.erro = undefined;
            })
            .addCase(criarClinica.rejected, (state, action) => {
                state.erro = String(action.payload ?? action.error.message ?? 'Erro ao criar clínica.');
            })
            .addCase(atualizarClinica.fulfilled, (state, action) => {
                const index = state.itens.findIndex(c => c.id === action.payload.id);

                if (index >= 0) {
                    state.itens[index] = { ...state.itens[index], ...action.payload };
                }

                state.selecionado = null;
                state.erro = undefined;
            })
            .addCase(atualizarClinica.rejected, (state, action) => {
                state.erro = String(action.payload ?? action.error.message ?? 'Erro ao atualizar clínica.');
            })
            .addCase(excluirClinica.fulfilled, (state, action) => {
                state.itens = state.itens.filter(c => c.id !== action.payload);
                state.confirmacaoExclusao = null;
                state.erro = undefined;
            })
            .addCase(excluirClinica.rejected, (state, action) => {
                const payload: any = action.payload;

                if (
                    payload &&
                    typeof payload === 'object' &&
                    payload.id !== undefined &&
                    payload.totalCastracoes !== undefined
                ) {
                    state.confirmacaoExclusao = {
                        id: Number(payload.id),
                        totalCastracoes: Number(payload.totalCastracoes ?? 0),
                        erro: String(payload.erro ?? 'Esta clínica possui castrações vinculadas.')
                    };

                    state.erro = undefined;
                    return;
                }

                state.erro = String(action.payload ?? action.error.message ?? 'Erro ao excluir clínica.');
            });
    }
});

export const {
    selecionarClinica,
    limparConfirmacaoExclusaoClinica
} = clinicasSlice.actions;

export default clinicasSlice.reducer;
