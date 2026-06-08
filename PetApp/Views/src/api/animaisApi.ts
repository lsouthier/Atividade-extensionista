import { axiosClient } from './axiosClient';

export interface Tutor {
    id: number;
    nome: string;
}

export interface Animal {
    id: number;
    nome: string;
    especie: string;
    raca: string;
    sexo: string;
    idade: number;
    dataNascimento?: string | null;
    idadeDescricao?: string | null;
    peso: number;
    idTutor: number;
    tutor: Tutor;
    ehCastrado: boolean;
}

export interface AnimalCreate {
    nome: string;
    especie: string;
    raca: string;
    sexo: string;
    idade: number;
    dataNascimento?: string | null;
    peso: number;
    idTutor: number;
    ehCastrado: boolean;
}

export interface AnimalUpdate extends AnimalCreate {
    id: number;
}

export interface AnimalDeleteConflict {
    requerConfirmacao: boolean;
    totalCastracoes: number;
    erro: string;
}

export async function getAnimais(): Promise<Animal[]> {
    const response = await axiosClient.get<Animal[]>('Animais');
    return response.data;
}

export async function getAnimal(id: number): Promise<Animal> {
    const response = await axiosClient.get<Animal>(`Animais/${id}`);
    return response.data;
}

export async function createAnimal(animal: AnimalCreate): Promise<Animal> {
    const response = await axiosClient.post<Animal>('Animais', animal);
    return response.data;
}

export async function updateAnimal(animal: AnimalUpdate): Promise<void> {
    await axiosClient.put(`Animais/${animal.id}`, animal);
}

export async function deleteAnimal(id: number, excluirCastracoes = false): Promise<void> {
    const query = excluirCastracoes ? '?excluirCastracoes=true' : '';
    await axiosClient.delete(`Animais/${id}${query}`);
}
