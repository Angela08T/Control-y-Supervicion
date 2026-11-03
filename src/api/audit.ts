import api from './config';

export const getAllAudits = async (page = 1, limit = 10, filters = {}) => {
    try {
        // Construir query params manualmente
        let queryParams = `?page=${page}&limit=${limit}`;

        // Agregar filtros opcionales
        if (filters.action) queryParams += `&action=${filters.action}`;
        if (filters.model) queryParams += `&model=${filters.model}`;
        if (filters.status) queryParams += `&status=${filters.status}`;
        if (filters.search) queryParams += `&search=${encodeURIComponent(filters.search)}`;

        const response = await api.get(`/audit${queryParams}`);

        return response.data;
    } catch (error) {
        if (error.response) {
            throw error;
        } else if (error.request) {
            throw new Error('No se pudo conectar con el servidor. Verifique su conexión.');
        } else {
            throw new Error('Error al obtener registros de auditoría: ' + error.message);
        }
    }
};
