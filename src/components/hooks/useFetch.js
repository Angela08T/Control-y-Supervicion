import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import Swal from '@/helpers/swalConfig';
import { logout, moduleLoading } from '@/Redux/Slices/AuthSlice';

/**
 * Hook robusto para llamadas HTTP con manejo de autenticación
 * Características:
 * - Maneja token automáticamente
 * - Loading global con Redux
 * - Manejo de errores 401 (sesión expirada)
 * - Alertas automáticas de error
 * - Soporte para lazy loading
 * - Soporte para API key
 *
 * @returns {Object} { getData, postData, patchData, deleteData }
 */
function useFetch() {
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);

  /**
   * Maneja errores de autenticación (401)
   */
  const handleAuthError = (error, lazy) => {
    if (error.response && error.response.status === 401 && !lazy) {
      Swal.fire({
        icon: 'error',
        title: 'Error de autenticación',
        text: 'Su sesión ha expirado. Por favor, inicie sesión nuevamente.',
        confirmButtonText: 'Aceptar',
        didClose: () => {
          dispatch(logout());
        }
      });
      return { isAuthError: true, message: 'Sesión expirada' };
    }
    return { isAuthError: false };
  };

  /**
   * GET request
   * @param {string} url - URL del endpoint
   * @param {boolean} lazy - Si true, no muestra loader global
   * @param {boolean} apiKey - Si true, usa API key en vez de token
   * @param {string} customToken - Token personalizado (opcional)
   * @returns {Promise} { data, status } o { error, status }
   */
  const getData = async (url, lazy = false, apiKey = false, customToken = null) => {
    try {
      !lazy && dispatch(moduleLoading(true));

      let headers = {};
      if (apiKey) {
        headers["x-api-key"] = `${import.meta.env.VITE_APP_API_KEY}`;
      } else {
        const authToken = customToken || token;
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const response = await axios.get(url, { headers });

      return {
        data: response.data,
        status: true
      };

    } catch (error) {
      const authError = handleAuthError(error, lazy);
      if (authError.isAuthError) return authError;

      return {
        error: error,
        status: false,
        message: error.response?.data?.message || error.message
      };
    } finally {
      dispatch(moduleLoading(false));
    }
  };

  /**
   * POST request
   * @param {string} url - URL del endpoint
   * @param {Object} data - Datos a enviar
   * @param {boolean} lazy - Si true, no muestra loader global
   * @param {boolean} apiKey - Si true, usa API key en vez de token
   * @param {string} customToken - Token personalizado (opcional)
   * @returns {Promise} { data, status } o { error, status }
   */
  const postData = async (url, data, lazy = false, apiKey = false, customToken = null) => {
    try {
      !lazy && dispatch(moduleLoading(true));

      let headers = {};
      if (apiKey) {
        headers["x-api-key"] = `${import.meta.env.VITE_APP_API_KEY}`;
      } else {
        const authToken = customToken || token;
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const response = await axios.post(url, data, { headers });

      return {
        data: response.data,
        status: true
      };

    } catch (error) {
      const authError = handleAuthError(error, lazy);
      if (authError.isAuthError) return authError;

      return {
        error: error,
        status: false,
        message: error.response?.data?.message || error.message
      };
    } finally {
      dispatch(moduleLoading(false));
    }
  };

  /**
   * PATCH request
   * @param {string} url - URL del endpoint
   * @param {Object} data - Datos a enviar
   * @param {boolean} lazy - Si true, no muestra loader global
   * @param {string} customToken - Token personalizado (opcional)
   * @returns {Promise} { data, status } o { error, status }
   */
  const patchData = async (url, data, lazy = false, customToken = null) => {
    try {
      !lazy && dispatch(moduleLoading(true));

      const authToken = customToken || token;
      const response = await axios.patch(url, data, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      return {
        data: response.data,
        status: true
      };

    } catch (error) {
      const authError = handleAuthError(error, lazy);
      if (authError.isAuthError) return authError;

      return {
        error: error,
        status: false,
        message: error.response?.data?.message || error.message
      };
    } finally {
      dispatch(moduleLoading(false));
    }
  };

  /**
   * PUT request
   * @param {string} url - URL del endpoint
   * @param {Object} data - Datos a enviar
   * @param {boolean} lazy - Si true, no muestra loader global
   * @param {string} customToken - Token personalizado (opcional)
   * @returns {Promise} { data, status } o { error, status }
   */
  const putData = async (url, data, lazy = false, customToken = null) => {
    try {
      !lazy && dispatch(moduleLoading(true));

      const authToken = customToken || token;
      const response = await axios.put(url, data, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      return {
        data: response.data,
        status: true
      };

    } catch (error) {
      const authError = handleAuthError(error, lazy);
      if (authError.isAuthError) return authError;

      return {
        error: error,
        status: false,
        message: error.response?.data?.message || error.message
      };
    } finally {
      dispatch(moduleLoading(false));
    }
  };

  /**
   * DELETE request
   * @param {string} url - URL del endpoint
   * @param {Object} data - Datos opcionales a enviar
   * @param {boolean} lazy - Si true, no muestra loader global
   * @param {string} customToken - Token personalizado (opcional)
   * @returns {Promise} { data, status } o { error, status }
   */
  const deleteData = async (url, data = null, lazy = false, customToken = null) => {
    try {
      !lazy && dispatch(moduleLoading(true));

      const authToken = customToken || token;
      const config = {
        headers: { Authorization: `Bearer ${authToken}` }
      };

      if (data) {
        config.data = data;
      }

      const response = await axios.delete(url, config);

      return {
        data: response.data,
        status: true
      };

    } catch (error) {
      const authError = handleAuthError(error, lazy);
      if (authError.isAuthError) return authError;

      return {
        error: error,
        status: false,
        message: error.response?.data?.message || error.message
      };
    } finally {
      dispatch(moduleLoading(false));
    }
  };

  return { getData, postData, patchData, putData, deleteData };
}

export default useFetch;
