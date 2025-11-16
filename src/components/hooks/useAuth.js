import { useDispatch } from 'react-redux';
import { useState } from 'react';
import { login as setAuth, logout as clearAuth } from '@/Redux/Slices/AuthSlice.js';
import useFetch from './useFetch';
import { API_URL } from '@/helpers/Constants';
import { normalizeRole } from '@/helpers/permissions.js';
import { showSuccess, showError } from '@/helpers/swalConfig';

/**
 * Hook personalizado para autenticación
 * Reemplaza helpers/api/auth.jsx y components/hooks/Login/useLogin.js
 *
 * @returns {Object} Funciones y estados para gestionar autenticación
 */
const useAuth = () => {
  const dispatch = useDispatch();
  const { postData } = useFetch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Iniciar sesión
   * @param {Object} credentials - { username, password }
   * @returns {Object} - { success, role }
   */
  const handleLogin = async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const response = await postData(`${API_URL}/auth/login`, credentials);

      if (response.status && response.data?.data) {
        const { token, user, rol } = response.data.data;

        if (token && user && rol) {
          const normalizedRole = normalizeRole(rol);

          console.log('Login Debug - Role from backend:', rol);
          console.log('Login Debug - Role normalized:', normalizedRole);
          console.log('Login Debug - Username:', user);

          dispatch(
            setAuth({
              token,
              id: null,
              username: user,
              role: normalizedRole,
            })
          );

          // Guardar token en localStorage para persistencia
          localStorage.setItem('centinela_token', token);
          localStorage.setItem('centinela_user', JSON.stringify({
            username: user,
            role: normalizedRole
          }));

          showSuccess('Bienvenido', `Sesión iniciada como ${user}`);
          return { success: true, role: normalizedRole };
        } else {
          console.error('Login fallido: respuesta inválida', response);
          setError('Respuesta del servidor inválida');
          return { success: false, role: null };
        }
      } else {
        const errorMessage = response.message || 'Error al iniciar sesión';
        setError(errorMessage);
        showError('Error de autenticación', errorMessage);
        return { success: false, role: null };
      }
    } catch (err) {
      console.error('Error en login:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Error al iniciar sesión';
      setError(errorMessage);
      showError('Error', errorMessage);
      return { success: false, role: null };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cerrar sesión
   */
  const handleLogout = () => {
    dispatch(clearAuth());
    localStorage.removeItem('centinela_token');
    localStorage.removeItem('centinela_user');
    showSuccess('Sesión cerrada', 'Has cerrado sesión correctamente');
  };

  /**
   * Verificar si hay sesión activa
   */
  const checkSession = () => {
    const token = localStorage.getItem('centinela_token');
    const userStr = localStorage.getItem('centinela_user');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        dispatch(
          setAuth({
            token,
            id: null,
            username: user.username,
            role: user.role,
          })
        );
        return true;
      } catch (e) {
        console.error('Error al restaurar sesión:', e);
        return false;
      }
    }
    return false;
  };

  return {
    handleLogin,
    handleLogout,
    checkSession,
    loading,
    error
  };
};

export default useAuth;
