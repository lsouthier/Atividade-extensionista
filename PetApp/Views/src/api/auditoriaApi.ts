import { axiosClient } from './axiosClient';

export interface Auditoria {
    id: number;
    dataHoraUtc: string;
    usuarioId?: number | null;
    usuarioNome: string;
    acao: string;
    entidade: string;
    entidadeId?: string | null;
    valoresAntes?: string | null;
    valoresDepois?: string | null;
    ipOrigem?: string | null;
    userAgent?: string | null;
}

export interface AuditoriaFiltros {
    limite?: number;
    entidade?: string;
    acao?: string;
    usuario?: string;
}

export async function getAuditorias(filtros: AuditoriaFiltros = {}): Promise<Auditoria[]> {
    const params = new URLSearchParams();

    if (filtros.limite) {
        params.append('limite', String(filtros.limite));
    }

    if (filtros.entidade) {
        params.append('entidade', filtros.entidade);
    }

    if (filtros.acao) {
        params.append('acao', filtros.acao);
    }

    if (filtros.usuario) {
        params.append('usuario', filtros.usuario);
    }

    const query = params.toString();

    const response = await axiosClient.get<Auditoria[]>(
        query ? `Auditoria?${query}` : 'Auditoria'
    );

    return response.data;
}
