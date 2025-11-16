/**
 * Utilidades para manejo de caché en localStorage
 *
 * Sistema de caché temporal para reducir llamadas al backend
 * y mejorar el rendimiento de la aplicación.
 */

/**
 * Guarda datos en caché con tiempo de expiración
 * @param {string} cacheKey - Clave del caché en localStorage
 * @param {number} expirationHours - Horas hasta que expire el caché
 * @param {Object} data - Datos a guardar
 */
export const saveToCache = (cacheKey, expirationHours, data) => {
  try {
    const expirationTime = new Date().getTime() + (expirationHours * 60 * 60 * 1000);

    const cacheData = {
      ...data,
      _cacheMetadata: {
        savedAt: new Date().toISOString(),
        expiresAt: expirationTime
      }
    };

    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    return true;
  } catch (error) {
    console.error('Error al guardar en caché:', error);
    return false;
  }
};

/**
 * Verifica si existe un dato específico en caché y si aún es válido
 * @param {string} cacheKey - Clave del caché en localStorage
 * @param {string} dataKey - Clave del dato específico dentro del caché
 * @returns {boolean} True si el dato existe y es válido
 */
export const reviewCache = (cacheKey, dataKey) => {
  try {
    const cachedData = localStorage.getItem(cacheKey);

    if (!cachedData) {
      return false;
    }

    const parsedData = JSON.parse(cachedData);

    // Verificar si existe el dataKey
    if (!parsedData[dataKey]) {
      return false;
    }

    // Verificar si el caché ha expirado
    if (parsedData._cacheMetadata && parsedData._cacheMetadata.expiresAt) {
      const now = new Date().getTime();
      if (now > parsedData._cacheMetadata.expiresAt) {
        // Caché expirado, eliminarlo
        localStorage.removeItem(cacheKey);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error al revisar caché:', error);
    return false;
  }
};

/**
 * Obtiene datos del caché
 * @param {string} cacheKey - Clave del caché en localStorage
 * @param {string} dataKey - Clave del dato específico (opcional)
 * @returns {any} Datos del caché o null si no existe
 */
export const getFromCache = (cacheKey, dataKey = null) => {
  try {
    const cachedData = localStorage.getItem(cacheKey);

    if (!cachedData) {
      return null;
    }

    const parsedData = JSON.parse(cachedData);

    // Verificar expiración
    if (parsedData._cacheMetadata && parsedData._cacheMetadata.expiresAt) {
      const now = new Date().getTime();
      if (now > parsedData._cacheMetadata.expiresAt) {
        localStorage.removeItem(cacheKey);
        return null;
      }
    }

    if (dataKey) {
      return parsedData[dataKey] || null;
    }

    return parsedData;
  } catch (error) {
    console.error('Error al obtener del caché:', error);
    return null;
  }
};

/**
 * Elimina un caché completo o un dato específico
 * @param {string} cacheKey - Clave del caché en localStorage
 * @param {string} dataKey - Clave del dato específico a eliminar (opcional)
 */
export const clearCache = (cacheKey, dataKey = null) => {
  try {
    if (!dataKey) {
      // Eliminar todo el caché
      localStorage.removeItem(cacheKey);
      return true;
    }

    // Eliminar solo un dato específico
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      delete parsedData[dataKey];
      localStorage.setItem(cacheKey, JSON.stringify(parsedData));
    }

    return true;
  } catch (error) {
    console.error('Error al limpiar caché:', error);
    return false;
  }
};

/**
 * Limpia todos los cachés expirados
 */
export const clearExpiredCaches = () => {
  try {
    const now = new Date().getTime();
    const keys = Object.keys(localStorage);

    keys.forEach(key => {
      try {
        const data = JSON.parse(localStorage.getItem(key));
        if (data._cacheMetadata && data._cacheMetadata.expiresAt) {
          if (now > data._cacheMetadata.expiresAt) {
            localStorage.removeItem(key);
          }
        }
      } catch (e) {
        // No es un objeto con metadata, ignorar
      }
    });

    return true;
  } catch (error) {
    console.error('Error al limpiar cachés expirados:', error);
    return false;
  }
};

/**
 * Obtiene información sobre un caché
 * @param {string} cacheKey - Clave del caché
 * @returns {Object} Información del caché
 */
export const getCacheInfo = (cacheKey) => {
  try {
    const cachedData = localStorage.getItem(cacheKey);

    if (!cachedData) {
      return { exists: false };
    }

    const parsedData = JSON.parse(cachedData);
    const metadata = parsedData._cacheMetadata;

    if (!metadata) {
      return { exists: true, hasMetadata: false };
    }

    const now = new Date().getTime();
    const isExpired = now > metadata.expiresAt;
    const timeRemaining = metadata.expiresAt - now;

    return {
      exists: true,
      hasMetadata: true,
      savedAt: metadata.savedAt,
      expiresAt: new Date(metadata.expiresAt).toISOString(),
      isExpired,
      timeRemainingMs: isExpired ? 0 : timeRemaining,
      timeRemainingHours: isExpired ? 0 : Math.floor(timeRemaining / (1000 * 60 * 60)),
      keys: Object.keys(parsedData).filter(k => k !== '_cacheMetadata')
    };
  } catch (error) {
    console.error('Error al obtener información del caché:', error);
    return { exists: false, error: error.message };
  }
};
