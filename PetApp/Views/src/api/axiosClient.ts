import axios, { AxiosError } from 'axios';

export interface ApiError extends Error {
    status?: number;
    data?: any;
}

function extrairMensagemErro(error: AxiosError): string {
    const data = error.response?.data;

    if (!data) {
        return error.message || 'Erro de comunicação com o servidor.';
    }

    if (typeof data === 'string') {
        return data;
    }

    if (Array.isArray(data)) {
        return data.join(', ');
    }

    if (typeof data === 'object') {
        const obj = data as Record<string, any>;

        if (typeof obj.erro === 'string') {
            return obj.erro;
        }

        if (typeof obj.message === 'string') {
            return obj.message;
        }

        if (typeof obj.title === 'string') {
            return obj.title;
        }

        const mensagens = Object.values(obj)
            .flatMap((valor) => {
                if (Array.isArray(valor)) {
                    return valor;
                }

                if (typeof valor === 'string') {
                    return [valor];
                }

                return [];
            })
            .filter(Boolean);

        if (mensagens.length > 0) {
            return mensagens.join(', ');
        }

        return JSON.stringify(obj);
    }

    return 'Erro inesperado ao processar a requisição.';
}

export const axiosClient = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

axiosClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('petapp_token');

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

axiosClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error: AxiosError) => {
        const apiError: ApiError = new Error(extrairMensagemErro(error));
        apiError.status = error.response?.status;
        apiError.data = error.response?.data;

        if (error.response?.status === 401) {
            localStorage.removeItem('petapp_token');
            localStorage.removeItem('petapp_usuario');
        }

        return Promise.reject(apiError);
    }
);
