import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
    Auditoria,
    AuditoriaFiltros,
    getAuditorias
} from '../api/auditoriaApi';

interface AuditoriaState {
    itens: Auditoria[];
    carregando: boolean;
    erro?: string;
}

const initialState: AuditoriaState = {
    itens: [],
    carregando: false
};

export const carregarAuditorias = createAsyncThunk(
    'auditoria/carregar',
    async (filtros: AuditoriaFiltros | undefined, { rejectWithValue }) => {
        try {
            return await getAuditorias(filtros ?? { limite: 200 });
        } catch (e: any) {
            return rejectWithValue(e?.message ?? 'Erro ao carregar auditoria.');
        }
    }
);

const auditoriaSlice = createSlice({
    name: 'auditoria',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(carregarAuditorias.pending, (state) => {
                state.carregando = true;
                state.erro = undefined;
            })
            .addCase(carregarAuditorias.fulfilled, (state, action) => {
                state.carregando = false;
                state.itens = action.payload;
            })
            .addCase(carregarAuditorias.rejected, (state, action) => {
                state.carregando = false;
                state.erro = String(action.payload ?? action.error.message ?? 'Erro ao carregar auditoria.');
            });
    }
});

export default auditoriaSlice.reducer;
