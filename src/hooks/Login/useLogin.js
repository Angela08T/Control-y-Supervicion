import { useDispatch } from 'react-redux';
import { useState } from 'react';
import { login as setAuth } from '../../store/slices/authSlice.js';
import { login } from '../../api/auth.jsx';
import { setToken } from '../../api/config.jsx';

const useLogin = () => {
 const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const response = await login(credentials);

      // La respuesta del backend tiene esta estructura:
      // { message: "Login exitoso", data: { user: "diego", rol: "administrator", token: "..." } }
      const { data } = response;
      const { token, user, rol } = data;

      if (token && user && rol) {
        // Mapeo de roles del backend a los roles del frontend
        const roleMapping = {
          'administrator': 'admin',
          'supervisor': 'supervisor',
          'sentinel': 'centinela'
        };

        const normalizedRole = roleMapping[rol.toLowerCase()] || rol.toLowerCase();

        // Debug logging - remover después del deploy
        console.log('Login Debug - Role from backend:', rol);
        console.log('Login Debug - Role normalized:', normalizedRole);
        console.log('Login Debug - Username:', user);

        dispatch(
          setAuth({
            token,
            id: null, // El backend no devuelve ID, puedes agregarlo después si lo necesitas
            username: user,
            role: normalizedRole,
          })
        );

        setToken(token);
        return { success: true, role: normalizedRole };
      } else {
        console.error('Login fallido: respuesta inválida', response);
        setError('Respuesta del servidor inválida');
        return { success: false, role: null };
      }
    } catch (err) {
      console.error('Error en login:', err.response ? err.response.data : err);
      const errorMessage = err.response?.data?.message || err.message || 'Error al iniciar sesión';
      setError(errorMessage);
      return { success: false, role: null };
    } finally {
      setLoading(false);
    }
  };

  return { handleLogin, loading, error };
};

export default useLogin;