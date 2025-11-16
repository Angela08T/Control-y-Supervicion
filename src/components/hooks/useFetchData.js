import { reviewCache, saveToCache, getFromCache } from '@/helpers/cacheUtils';
import useFetch from './useFetch';
import { API_URL } from '@/helpers/Constants';

/**
 * Hook personalizado para obtener datos de diferentes entidades
 * con sistema de caché integrado
 *
 * Características:
 * - Caché automático para reducir llamadas al backend
 * - Manejo de errores consistente
 * - Integración con useFetch (autenticación automática)
 *
 * @returns {Object} Funciones para obtener datos de diferentes entidades
 */
const useFetchData = () => {
  const { getData } = useFetch();

  const CACHE_KEY = 'centinela_cache';
  const CACHE_HOURS = 8; // Duración del caché

  /**
   * Función genérica para obtener datos con caché
   * @param {string} endpoint - Endpoint de la API
   * @param {string} cacheDataKey - Clave para guardar en caché
   * @param {boolean} useCache - Si debe usar caché
   * @returns {Promise<Object>} { data, status }
   */
  const fetchWithCache = async (endpoint, cacheDataKey, useCache = true) => {
    // Verificar caché si está habilitado
    if (useCache && reviewCache(CACHE_KEY, cacheDataKey)) {
      const cachedData = getFromCache(CACHE_KEY);
      return {
        data: cachedData[cacheDataKey].data,
        status: true,
        fromCache: true
      };
    }

    // Hacer petición al backend
    const response = await getData(`${API_URL}${endpoint}`, true); // lazy = true

    if (response.status) {
      // Guardar en caché si está habilitado
      if (useCache) {
        const currentCache = getFromCache(CACHE_KEY) || {};
        currentCache[cacheDataKey] = { data: response.data.data || response.data };
        saveToCache(CACHE_KEY, CACHE_HOURS, currentCache);
      }

      return {
        data: response.data.data || response.data,
        status: true,
        fromCache: false
      };
    }

    return {
      error: response.error,
      message: response.message,
      status: false
    };
  };

  // ==================== USUARIOS ====================

  /**
   * Obtiene lista de usuarios
   * @param {string} urlParams - Parámetros adicionales para la URL
   * @param {boolean} useCache - Si debe usar caché
   * @returns {Promise<Object>}
   */
  const fetchUsuarios = async (urlParams = '', useCache = false) => {
    try {
      const endpoint = `/users${urlParams ? `?${urlParams}` : ''}`;
      return await fetchWithCache(endpoint, 'usuarios', useCache);
    } catch (error) {
      return {
        error: error,
        status: false,
        message: error.message
      };
    }
  };

  /**
   * Obtiene un usuario por ID
   * @param {string|number} id - ID del usuario
   * @returns {Promise<Object>}
   */
  const fetchUsuarioById = async (id) => {
    try {
      const response = await getData(`${API_URL}/users/${id}`, true);
      if (response.status) {
        return {
          data: response.data.data || response.data,
          status: true
        };
      }
      return {
        error: response.error,
        message: response.message,
        status: false
      };
    } catch (error) {
      return {
        error: error,
        status: false,
        message: error.message
      };
    }
  };

  // ==================== ROLES ====================

  /**
   * Obtiene lista de roles
   * @param {boolean} useCache - Si debe usar caché
   * @returns {Promise<Object>}
   */
  const fetchRoles = async (useCache = true) => {
    return await fetchWithCache('/roles', 'roles', useCache);
  };

  // ==================== BODYCAMS ====================

  /**
   * Obtiene lista de bodycams
   * @param {string} urlParams - Parámetros adicionales
   * @param {boolean} useCache - Si debe usar caché
   * @returns {Promise<Object>}
   */
  const fetchBodycams = async (urlParams = '', useCache = false) => {
    const endpoint = `/bodycams${urlParams ? `?${urlParams}` : ''}`;
    return await fetchWithCache(endpoint, 'bodycams', useCache);
  };

  /**
   * Obtiene una bodycam por ID
   * @param {string|number} id - ID de la bodycam
   * @returns {Promise<Object>}
   */
  const fetchBodycamById = async (id) => {
    try {
      const response = await getData(`${API_URL}/bodycams/${id}`, true);
      if (response.status) {
        return {
          data: response.data.data || response.data,
          status: true
        };
      }
      return {
        error: response.error,
        message: response.message,
        status: false
      };
    } catch (error) {
      return {
        error: error,
        status: false,
        message: error.message
      };
    }
  };

  // ==================== CARGOS (JOBS) ====================

  /**
   * Obtiene lista de cargos
   * @param {boolean} useCache - Si debe usar caché
   * @returns {Promise<Object>}
   */
  const fetchCargos = async (useCache = true) => {
    return await fetchWithCache('/jobs', 'cargos', useCache);
  };

  // ==================== PERSONAL (LEADS) ====================

  /**
   * Obtiene lista de personal
   * @param {string} urlParams - Parámetros adicionales
   * @param {boolean} useCache - Si debe usar caché
   * @returns {Promise<Object>}
   */
  const fetchPersonal = async (urlParams = '', useCache = false) => {
    const endpoint = `/leads${urlParams ? `?${urlParams}` : ''}`;
    return await fetchWithCache(endpoint, 'personal', useCache);
  };

  /**
   * Busca personal por DNI
   * @param {string} dni - DNI a buscar
   * @returns {Promise<Object>}
   */
  const fetchPersonalByDNI = async (dni) => {
    try {
      const response = await getData(`${API_URL}/leads/dni/${dni}`, true);
      if (response.status) {
        return {
          data: response.data.data || response.data,
          status: true
        };
      }
      return {
        error: response.error,
        message: response.message,
        status: false
      };
    } catch (error) {
      return {
        error: error,
        status: false,
        message: error.message
      };
    }
  };

  // ==================== ASUNTOS (SUBJECTS) ====================

  /**
   * Obtiene lista de asuntos/tipos de incidencia
   * @param {boolean} useCache - Si debe usar caché
   * @returns {Promise<Object>}
   */
  const fetchAsuntos = async (useCache = true) => {
    return await fetchWithCache('/subjects', 'asuntos', useCache);
  };

  // ==================== FALTAS (LACKS) ====================

  /**
   * Obtiene lista de tipos de faltas
   * @param {boolean} useCache - Si debe usar caché
   * @returns {Promise<Object>}
   */
  const fetchFaltas = async (useCache = true) => {
    return await fetchWithCache('/lacks', 'faltas', useCache);
  };

  /**
   * Obtiene faltas por tipo de asunto
   * @param {string} subjectId - ID del asunto
   * @param {boolean} useCache - Si debe usar caché
   * @returns {Promise<Object>}
   */
  const fetchFaltasByAsunto = async (subjectId, useCache = true) => {
    const endpoint = `/lacks/subject/${subjectId}`;
    const cacheKey = `faltas_asunto_${subjectId}`;
    return await fetchWithCache(endpoint, cacheKey, useCache);
  };

  // ==================== INFRACTORES (OFFENDERS) ====================

  /**
   * Obtiene lista de infractores
   * @param {string} urlParams - Parámetros adicionales
   * @param {boolean} useCache - Si debe usar caché
   * @returns {Promise<Object>}
   */
  const fetchInfractores = async (urlParams = '', useCache = false) => {
    const endpoint = `/offenders${urlParams ? `?${urlParams}` : ''}`;
    return await fetchWithCache(endpoint, 'infractores', useCache);
  };

  /**
   * Obtiene un infractor por DNI
   * @param {string} dni - DNI del infractor
   * @returns {Promise<Object>}
   */
  const fetchInfractorByDNI = async (dni) => {
    try {
      const response = await getData(`${API_URL}/offenders/dni/${dni}`, true);
      if (response.status) {
        return {
          data: response.data.data || response.data,
          status: true
        };
      }
      return {
        error: response.error,
        message: response.message,
        status: false
      };
    } catch (error) {
      return {
        error: error,
        status: false,
        message: error.message
      };
    }
  };

  // ==================== INCIDENCIAS ====================

  /**
   * Obtiene lista de incidencias
   * @param {string} urlParams - Parámetros de filtrado
   * @param {boolean} useCache - Si debe usar caché
   * @returns {Promise<Object>}
   */
  const fetchIncidencias = async (urlParams = '', useCache = false) => {
    const endpoint = `/incidents${urlParams ? `?${urlParams}` : ''}`;
    return await fetchWithCache(endpoint, 'incidencias', useCache);
  };

  /**
   * Obtiene una incidencia por ID
   * @param {string|number} id - ID de la incidencia
   * @returns {Promise<Object>}
   */
  const fetchIncidenciaById = async (id) => {
    try {
      const response = await getData(`${API_URL}/incidents/${id}`, true);
      if (response.status) {
        return {
          data: response.data.data || response.data,
          status: true
        };
      }
      return {
        error: response.error,
        message: response.message,
        status: false
      };
    } catch (error) {
      return {
        error: error,
        status: false,
        message: error.message
      };
    }
  };

  // ==================== JURISDICCIONES ====================

  /**
   * Obtiene lista de jurisdicciones
   * @param {boolean} useCache - Si debe usar caché
   * @returns {Promise<Object>}
   */
  const fetchJurisdicciones = async (useCache = true) => {
    return await fetchWithCache('/jurisdictions', 'jurisdicciones', useCache);
  };

  // ==================== TURNOS ====================

  /**
   * Obtiene lista de turnos
   * @param {boolean} useCache - Si debe usar caché
   * @returns {Promise<Object>}
   */
  const fetchTurnos = async (useCache = true) => {
    return await fetchWithCache('/shifts', 'turnos', useCache);
  };

  // ==================== AUDITORÍA ====================

  /**
   * Obtiene logs de auditoría
   * @param {string} urlParams - Parámetros de filtrado
   * @returns {Promise<Object>}
   */
  const fetchAuditLogs = async (urlParams = '') => {
    try {
      const endpoint = `/audit${urlParams ? `?${urlParams}` : ''}`;
      const response = await getData(`${API_URL}${endpoint}`, true);

      if (response.status) {
        return {
          data: response.data.data || response.data,
          status: true
        };
      }
      return {
        error: response.error,
        message: response.message,
        status: false
      };
    } catch (error) {
      return {
        error: error,
        status: false,
        message: error.message
      };
    }
  };

  // ==================== ESTADÍSTICAS ====================

  /**
   * Obtiene estadísticas del dashboard
   * @param {string} dateRange - Rango de fechas (opcional)
   * @returns {Promise<Object>}
   */
  const fetchDashboardStats = async (dateRange = '') => {
    try {
      const endpoint = `/stats/dashboard${dateRange ? `?range=${dateRange}` : ''}`;
      const response = await getData(`${API_URL}${endpoint}`, true);

      if (response.status) {
        return {
          data: response.data.data || response.data,
          status: true
        };
      }
      return {
        error: response.error,
        message: response.message,
        status: false
      };
    } catch (error) {
      return {
        error: error,
        status: false,
        message: error.message
      };
    }
  };

  return {
    // Usuarios
    fetchUsuarios,
    fetchUsuarioById,

    // Roles
    fetchRoles,

    // Bodycams
    fetchBodycams,
    fetchBodycamById,

    // Cargos (Jobs)
    fetchCargos,
    fetchJobs: fetchCargos, // Alias para inglés

    // Personal (Leads)
    fetchPersonal,
    fetchPersonalByDNI,
    fetchLeads: fetchPersonal, // Alias para inglés

    // Asuntos (Subjects)
    fetchAsuntos,
    fetchSubjects: fetchAsuntos, // Alias para inglés

    // Faltas (Lacks)
    fetchFaltas,
    fetchFaltasByAsunto,
    fetchLacks: fetchFaltas, // Alias para inglés

    // Infractores (Offenders)
    fetchInfractores,
    fetchInfractorByDNI,
    fetchOffenders: fetchInfractores, // Alias para inglés

    // Incidencias
    fetchIncidencias,
    fetchIncidenciaById,

    // Jurisdicciones
    fetchJurisdicciones,
    fetchJurisdictions: fetchJurisdicciones, // Alias para inglés

    // Turnos
    fetchTurnos,

    // Auditoría
    fetchAuditLogs,

    // Estadísticas
    fetchDashboardStats,
  };
};

export default useFetchData;
