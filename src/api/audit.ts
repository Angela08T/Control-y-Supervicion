import { AxiosError } from 'axios';
import api from './config';
import type { Audit, AuditFilters, PaginatedResponse } from '@/types';

const getErrorMessage = (error: unknown): string => (error instanceof Error ? error.message : String(error));

export const getAllAudits = async (page: number = 1, limit: number = 10, filters: AuditFilters = {}): Promise<PaginatedResponse<Audit>> => {
    try {
        // Construir query params manualmente
        let queryParams = `?page=${page}&limit=${limit}`;

        // Agregar filtros opcionales
        if (filters.action) queryParams += `&action=${filters.action}`;
        if (filters.model) queryParams += `&model=${filters.model}`;
        if (filters.status) queryParams += `&status=${filters.status}`;
        if (filters.search) queryParams += `&search=${encodeURIComponent(filters.search)}`;

        const response = await api.get<PaginatedResponse<Audit>>(`/audit${queryParams}`);

        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response) {
            throw error;
        } else if (error instanceof AxiosError && error.request) {
            throw new Error('No se pudo conectar con el servidor. Verifique su conexión.');
        } else {
            throw new Error('Error al obtener registros de auditoría: ' + getErrorMessage(error));
        }
    }
};
