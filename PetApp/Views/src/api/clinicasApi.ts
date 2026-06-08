import { axiosClient } from './axiosClient';

export interface Clinica {
    id: number;
    nome: string;
    telefone: string;
    veterinarioResponsavel: string;
}

export interface ClinicaCreate {
    nome: string;
    telefone: string;
    veterinarioResponsavel: string;
}

export interface ClinicaUpdate extends ClinicaCreate {
    id: number;
}

export interface ClinicaDeleteConflict {
    requerConfirmacao: boolean;
    totalCastracoes: number;
    erro: string;
}

export async function getClinicas(): Promise<Clinica[]> {
    const response = await axiosClient.get<Clinica[]>('Clinicas');
    return response.data;
}

export async function getClinica(id: number): Promise<Clinica> {
    const response = await axiosClient.get<Clinica>(`Clinicas/${id}`);
    return response.data;
}

export async function createClinica(clinica: ClinicaCreate): Promise<Clinica> {
    const response = await axiosClient.post<Clinica>('Clinicas', clinica);
    return response.data;
}

export async function updateClinica(clinica: ClinicaUpdate): Promise<void> {
    await axiosClient.put(`Clinicas/${clinica.id}`, clinica);
}

export async function deleteClinica(id: number, excluirCastracoes = false): Promise<void> {
    const query = excluirCastracoes ? '?excluirCastracoes=true' : '';
    await axiosClient.delete(`Clinicas/${id}${query}`);
}
