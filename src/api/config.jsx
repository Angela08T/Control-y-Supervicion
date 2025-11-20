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
    console.error('Error al obtener token desde localStorage:', error);
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

// Configuración específica para el endpoint de offender (puerto 3021)
const offenderConfig = axios.create({
  baseURL: import.meta.env.VITE_API_OFFENDER_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000,
});

// Función especial para offender que intenta con y sin token
const addAuthTokenOffender = (config) => {
  const token = globalToken || getTokenFromStorage();

  console.log('=== DEBUG OFFENDER API ===');
  console.log('Global Token:', globalToken ? globalToken.substring(0, 30) + '...' : 'NULL');
  console.log('Token from Storage:', getTokenFromStorage() ? getTokenFromStorage().substring(0, 30) + '...' : 'NULL');
  console.log('Final Token:', token ? token.substring(0, 30) + '...' : 'NULL');
  console.log('URL:', config.baseURL + config.url);

  // Verificar si el token tiene espacios o caracteres raros
  if (token) {
    const trimmedToken = token.trim();
    console.log('Token length:', token.length);
    console.log('Token trimmed length:', trimmedToken.length);
    console.log('Token starts with:', token.substring(0, 10));
    console.log('Token ends with:', token.substring(token.length - 10));

    config.headers.Authorization = `Bearer ${trimmedToken}`;
    console.log('✓ Token agregado al header Authorization');
    console.log('Header completo:', config.headers.Authorization.substring(0, 50) + '...');
  } else {
    console.error('✗ NO HAY TOKEN DISPONIBLE - La petición fallará con 401');
  }
  console.log('========================');

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

// Interceptor de respuesta para manejar errores 401 en offender
offenderConfig.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('Offender API 401: El servidor rechazó la petición. Posibles causas:');
      console.error('1. El servidor no requiere token (prueba sin Authorization header)');
      console.error('2. El token del puerto 3020 no es válido para el puerto 3021');
      console.error('3. El servidor requiere un token diferente');
    }
    return Promise.reject(error);
  }
);

// Aplicar interceptors a todas las configuraciones
config.interceptors.request.use(addAuthToken, (error) => Promise.reject(error));
incidenceConfig.interceptors.request.use(addAuthToken, error => Promise.reject(error));
offenderConfig.interceptors.request.use(addAuthTokenOffender, error => Promise.reject(error));


// Exportar todas las configuraciones
export const mainApi = config;
export const incidenceApi = incidenceConfig;
export const offenderApi = offenderConfig;


export default config;