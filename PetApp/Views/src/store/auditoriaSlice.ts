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
    pagina: number;
    tamanhoPagina: number;
    totalRegistros: number;
    totalPaginas: number;
}

const initialState: AuditoriaState = {
    itens: [],
    carregando: false,
    pagina: 1,
    tamanhoPagina: 25,
    totalRegistros: 0,
    totalPaginas: 1
};

export const carregarAuditorias = createAsyncThunk(
    'auditoria/carregar',
    async (filtros: AuditoriaFiltros | undefined, { rejectWithValue }) => {
        try {
            return await getAuditorias(filtros ?? {
                pagina: 1,
                tamanhoPagina: 25
            });
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
                state.itens = action.payload.itens;
                state.pagina = action.payload.pagina;
                state.tamanhoPagina = action.payload.tamanhoPagina;
                state.totalRegistros = action.payload.totalRegistros;
                state.totalPaginas = action.payload.totalPaginas;
            })
            .addCase(carregarAuditorias.rejected, (state, action) => {
                state.carregando = false;
                state.erro = String(action.payload ?? action.error.message ?? 'Erro ao carregar auditoria.');
            });
    }
});

export default auditoriaSlice.reducer;
