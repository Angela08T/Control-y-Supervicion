import axios from 'axios';

// Función para obtener el token desde localStorage (redux-persist)
const getTokenFromStorage = () => {
  try {
    const persistRoot = localStorage.getItem('persist:root');
    if (persistRoot) {
      const parsed = JSON.parse(persistRoot);
      if (parsed.auth) {
        const authState = JSON.parse(parsed.auth);
        return authState.token;
      }
    }
  } catch (error) {
    // Error silencioso en producción
  }
  return null;
};

// Variable global para almacenar el token (mantener para compatibilidad)
let globalToken = null;

// Función para actualizar el token globalmente
export const setToken = (token) => {
  globalToken = token;
}

// Función para limpiar el token al hacer logout
export const clearToken = () => {
  globalToken = null;
}

// Configuración base para la API principal
const config = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Configuración especifica para el endpoint de codigo incidencias
const incidenceConfig = axios.create({
  baseURL: import.meta.env.VITE_API_CODE_INCIDENCE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 3000,
});

// Configuración específica para el endpoint de offender
const offenderConfig = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000,
});

// Función especial para offender que intenta con y sin token
const addAuthTokenOffender = (config) => {
  const token = globalToken || getTokenFromStorage();

  if (token) {
    config.headers.Authorization = `Bearer ${token.trim()}`;
  }

  return config;
};


const addAuthToken = (config) => {
  // Intentar primero con globalToken, luego desde localStorage
  const token = globalToken || getTokenFromStorage();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

// Variable para controlar el modal de sesión expirada
let sessionExpiredCallback = null;

// Función para establecer el callback del modal de sesión expirada
export const setSessionExpiredCallback = (callback) => {
  sessionExpiredCallback = callback;
};

// Interceptor de respuesta para manejar errores 401
const handleUnauthorizedError = (error) => {
  if (error.response && error.response.status === 401) {
    // Verificar si no estamos en la página de login
    if (!window.location.pathname.includes('/login')) {
      // Llamar al callback para mostrar el modal
      if (sessionExpiredCallback) {
        sessionExpiredCallback();
      }
    }
  }
  return Promise.reject(error);
};

// Aplicar interceptors a todas las configuraciones
config.interceptors.request.use(addAuthToken, (error) => Promise.reject(error));
config.interceptors.response.use((response) => response, handleUnauthorizedError);

incidenceConfig.interceptors.request.use(addAuthToken, error => Promise.reject(error));
incidenceConfig.interceptors.response.use((response) => response, handleUnauthorizedError);

offenderConfig.interceptors.request.use(addAuthTokenOffender, error => Promise.reject(error));
offenderConfig.interceptors.response.use((response) => response, handleUnauthorizedError);


// Exportar todas las configuraciones
export const mainApi = config;
export const incidenceApi = incidenceConfig;
export const offenderApi = offenderConfig;


export default config;