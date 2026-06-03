import { axiosClient } from './axiosClient';

export interface Castracao {
    id: number;
    dataCastracao: string;
    valor: number;
    idAnimal: number;
    nomeAnimal: string;
    idClinica: number;
    nomeClinica: string;
    observacoes: string;
}

export interface CastracaoCreate {
    dataCastracao: string;
    valor: number;
    idAnimal: number;
    idClinica: number;
    observacoes: string;
}

export interface CastracaoUpdate extends CastracaoCreate {
    id: number;
}

export async function getCastracoes(): Promise<Castracao[]> {
    const response = await axiosClient.get<Castracao[]>('Castracoes');
    return response.data;
}

export async function getCastracao(id: number): Promise<Castracao> {
    const response = await axiosClient.get<Castracao>(`Castracoes/${id}`);
    return response.data;
}

export async function createCastracao(castracao: CastracaoCreate): Promise<Castracao> {
    const response = await axiosClient.post<Castracao>('Castracoes', castracao);
    return response.data;
}

export async function updateCastracao(castracao: CastracaoUpdate): Promise<void> {
    await axiosClient.put(`Castracoes/${castracao.id}`, castracao);
}

export async function deleteCastracao(id: number): Promise<void> {
    await axiosClient.delete(`Castracoes/${id}`);
}
