import axios, { AxiosError } from 'axios';

export interface ApiError extends Error {
    status?: number;
    data?: any;
}

function limparSessao() {
    sessionStorage.removeItem('petapp_token');
    sessionStorage.removeItem('petapp_usuario');
    sessionStorage.removeItem('petapp_expira_em_utc');

    localStorage.removeItem('petapp_token');
    localStorage.removeItem('petapp_usuario');
    localStorage.removeItem('petapp_expira_em_utc');
}

function tokenExpirado(): boolean {
    const token = sessionStorage.getItem('petapp_token');
    const expiraEmUtc = sessionStorage.getItem('petapp_expira_em_utc');

    if (!token || !expiraEmUtc) {
        return true;
    }

    const expiraEm = new Date(expiraEmUtc).getTime();

    if (Number.isNaN(expiraEm)) {
        return true;
    }

    return expiraEm <= Date.now();
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
        if (tokenExpirado()) {
            limparSessao();

            if (!config.url?.toLowerCase().includes('auth/login')) {
                const erro: ApiError = new Error('Sessão expirada. Faça login novamente.');
                erro.status = 401;
                return Promise.reject(erro);
            }
        }

        const token = sessionStorage.getItem('petapp_token');

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
    (error: AxiosError | ApiError) => {
        const status = 'response' in error ? error.response?.status : error.status;

        if (status === 401) {
            limparSessao();

            window.dispatchEvent(new Event('petapp:sessao-expirada'));
        }

        if ('response' in error) {
            const apiError: ApiError = new Error(extrairMensagemErro(error));
            apiError.status = error.response?.status;
            apiError.data = error.response?.data;
            return Promise.reject(apiError);
        }

        return Promise.reject(error);
    }
);
