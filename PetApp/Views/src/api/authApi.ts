import { axiosClient } from './axiosClient';

export type PerfilAcesso = 'Leitura' | 'Cadastro' | 'Administrador';

export interface UsuarioLogado {
    id: number;
    nomeUsuario: string;
    nome: string;
    perfilAcesso: PerfilAcesso;
    ativo: boolean;
    criadoEmUtc: string;
    atualizadoEmUtc?: string | null;
}

export interface LoginRequest {
    nomeUsuario: string;
    senha: string;
}

export interface LoginResponse {
    token: string;
    expiraEmUtc: string;
    usuario: UsuarioLogado;
}

export async function login(dados: LoginRequest): Promise<LoginResponse> {
    const response = await axiosClient.post<LoginResponse>('Auth/login', dados);
    return response.data;
}

export async function me(): Promise<UsuarioLogado> {
    const response = await axiosClient.get<UsuarioLogado>('Auth/me');
    return response.data;
}
