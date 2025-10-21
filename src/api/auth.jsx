import api from './config';

export const login = async (credentials) => {
    try {
        const response = await api.post('/auth/login', credentials);
        return response.data;
    } catch (error) {
        throw new Error("Error al iniciar sesión: " + error.response?.data?.message || error.message);
    }
};