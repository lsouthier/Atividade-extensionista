import { axiosClient } from './axiosClient';

export interface Tutor {
    id: number;
    nome: string;
    endereco: string;
    enderecoCompleto: string;
    cep: string;
    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    uf: string;
    telefone: string;
}

export interface TutorCreate {
    nome: string;
    endereco: string;
    cep: string;
    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    uf: string;
    telefone: string;
}

export interface TutorUpdate extends TutorCreate {
    id: number;
}

export interface TutorDeleteConflict {
    requerConfirmacao: boolean;
    totalAnimais: number;
    erro: string;
}

export async function getTutores(): Promise<Tutor[]> {
    const response = await axiosClient.get<Tutor[]>('Tutores');
    return response.data;
}

export async function getTutor(id: number): Promise<Tutor> {
    const response = await axiosClient.get<Tutor>(`Tutores/${id}`);
    return response.data;
}

export async function createTutor(tutor: TutorCreate): Promise<Tutor> {
    const response = await axiosClient.post<Tutor>('Tutores', tutor);
    return response.data;
}

export async function updateTutor(tutor: TutorUpdate): Promise<void> {
    await axiosClient.put(`Tutores/${tutor.id}`, tutor);
}

export async function deleteTutor(id: number, excluirAnimais = false): Promise<void> {
    const query = excluirAnimais ? '?excluirAnimais=true' : '';
    await axiosClient.delete(`Tutores/${id}${query}`);
}
