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
    pagina?: number;
    tamanhoPagina?: number;
    entidade?: string;
    acao?: string;
    usuario?: string;
}

export interface AuditoriaPaginada {
    pagina: number;
    tamanhoPagina: number;
    totalRegistros: number;
    totalPaginas: number;
    itens: Auditoria[];
}

export async function getAuditorias(filtros: AuditoriaFiltros = {}): Promise<AuditoriaPaginada> {
    const params = new URLSearchParams();

    params.append('pagina', String(filtros.pagina ?? 1));
    params.append('tamanhoPagina', String(filtros.tamanhoPagina ?? 25));

    if (filtros.entidade) {
        params.append('entidade', filtros.entidade);
    }

    if (filtros.acao) {
        params.append('acao', filtros.acao);
    }

    if (filtros.usuario) {
        params.append('usuario', filtros.usuario);
    }

    const response = await axiosClient.get<AuditoriaPaginada>(
        `Auditoria?${params.toString()}`
    );

    return response.data;
}
