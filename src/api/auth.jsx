import api from './config';

export const login = async (credentials) => {
    try {
        const response = await api.post('/auth/login', credentials);
        return response.data;
    } catch (error) {
        // Propagar el error con más detalle
        if (error.response) {
            // El servidor respondió con un código de error
            throw error;
        } else if (error.request) {
            // La petición fue hecha pero no hubo respuesta
            throw new Error('No se pudo conectar con el servidor. Verifique su conexión.');
        } else {
            // Algo más pasó al configurar la petición
            throw new Error('Error al iniciar sesión: ' + error.message);
        }
    }
};