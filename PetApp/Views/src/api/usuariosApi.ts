import { axiosClient } from './axiosClient';

export interface UsuarioSistema {
    id: number;
    nomeUsuario: string;
    nome: string;
    ativo: boolean;
    criadoEmUtc: string;
    atualizadoEmUtc?: string | null;
}

export interface UsuarioSistemaCreate {
    nomeUsuario: string;
    nome: string;
    senha: string;
    ativo: boolean;
}

export interface UsuarioSistemaUpdate {
    id: number;
    nomeUsuario: string;
    nome: string;
    novaSenha?: string;
    ativo: boolean;
}

export async function getUsuarios(): Promise<UsuarioSistema[]> {
    const response = await axiosClient.get<UsuarioSistema[]>('Usuarios');
    return response.data;
}

export async function createUsuario(usuario: UsuarioSistemaCreate): Promise<UsuarioSistema> {
    const response = await axiosClient.post<UsuarioSistema>('Usuarios', usuario);
    return response.data;
}

export async function updateUsuario(usuario: UsuarioSistemaUpdate): Promise<void> {
    await axiosClient.put(`Usuarios/${usuario.id}`, usuario);
}

export async function deleteUsuario(id: number): Promise<void> {
    await axiosClient.delete(`Usuarios/${id}`);
}
