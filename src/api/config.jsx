import axios from 'axios';
// Variable global para almacenar el token
let globalToken = null;

// Función para actualizar el token globalmente
export const setToken = (token) => {
  globalToken = token;
}

// Configuración base para la API principal
const config = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// Configuración especifica para el endpoint de codigo incidencias
const incidenceConfig = axios.create({
  baseURL: import.meta.env.VITE_API_CODE_INCIDENCE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 3000, 
});


const addAuthToken = (config) => {
  if (globalToken) {
    config.headers.Authorization = `Bearer ${globalToken}`;
  }
  return config;
};

// Aplicar interceptors a ambas configuraciones
config.interceptors.request.use(addAuthToken, (error) => Promise.reject(error));
incidenceConfig.interceptors.request.use((config) => config, error => Promise.reject(error));


// Exportar ambas configuraciones
export const mainApi = config;
export const incidenceApi = incidenceConfig;


export default config;