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

export interface ClinicasState {
    itens: Clinica[];
    carregando: boolean;
    erro?: string;
    selecionado?: Clinica | null;
}

const initialState: ClinicasState = {
    itens: [],
    carregando: false,
    selecionado: null
};

export const carregarClinicas = createAsyncThunk('clinicas/carregar', async () => {
    return await getClinicas();
});

export const criarClinica = createAsyncThunk(
    'clinicas/criar',
    async (dados: ClinicaCreate, { rejectWithValue }) => {
        try {
            return await createClinica(dados);
        } catch (e: any) {
            return rejectWithValue(e?.response?.data ?? 'Erro ao criar clínica');
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
            return rejectWithValue(e?.response?.data ?? 'Erro ao atualizar clínica');
        }
    }
);

export const excluirClinica = createAsyncThunk(
    'clinicas/excluir',
    async (id: number, { rejectWithValue }) => {
        try {
            await deleteClinica(id);
            return id;
        } catch (e: any) {
            return rejectWithValue(e?.response?.data ?? 'Erro ao excluir clínica');
        }
    }
);

const clinicasSlice = createSlice({
    name: 'clinicas',
    initialState,
    reducers: {
        selecionarClinica(state, action: PayloadAction<Clinica | null>) {
            state.selecionado = action.payload;
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
            })
            .addCase(carregarClinicas.rejected, (state, action) => {
                state.carregando = false;
                state.erro = String(action.error.message ?? 'Erro ao carregar clínicas');
            })
            .addCase(criarClinica.fulfilled, (state, action) => {
                state.itens.push(action.payload);
                state.selecionado = null;
            })
            .addCase(atualizarClinica.fulfilled, (state, action) => {
                const index = state.itens.findIndex(c => c.id === action.payload.id);
                if (index >= 0) {
                    state.itens[index] = { ...state.itens[index], ...action.payload };
                }
                state.selecionado = null;
            })
            .addCase(excluirClinica.fulfilled, (state, action) => {
                state.itens = state.itens.filter(c => c.id !== action.payload);
            });
    }
});

export const { selecionarClinica } = clinicasSlice.actions;
export default clinicasSlice.reducer;
