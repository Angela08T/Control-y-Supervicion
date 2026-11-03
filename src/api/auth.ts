import { AxiosError } from 'axios';
import api from './config';
import type { LoginCredentials, LoginResponse, LogoutResponse } from '@/types';

const getErrorMessage = (error: unknown): string => (error instanceof Error ? error.message : String(error));

export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
    try {
        const response = await api.post<LoginResponse>('/auth/login', credentials);
        return response.data;
    } catch (error) {
        // Propagar el error con más detalle
        if (error instanceof AxiosError && error.response) {
            // El servidor respondió con un código de error
            throw error;
        } else if (error instanceof AxiosError && error.request) {
            // La petición fue hecha pero no hubo respuesta
            throw new Error('No se pudo conectar con el servidor. Verifique su conexión.');
        } else {
            // Algo más pasó al configurar la petición
            throw new Error('Error al iniciar sesión: ' + getErrorMessage(error));
        }
    }
};

export const logout = async (): Promise<LogoutResponse> => {
    try {
        const response = await api.post<LogoutResponse>('/auth/logout');
        return response.data;
    } catch (error) {
        // Propagar el error con más detalle
        if (error instanceof AxiosError && error.response) {
            throw error;
        } else if (error instanceof AxiosError && error.request) {
            throw new Error('No se pudo conectar con el servidor. Verifique su conexión.');
        } else {
            throw new Error('Error al cerrar sesión: ' + getErrorMessage(error));
        }
    }
};
