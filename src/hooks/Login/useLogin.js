import { useDispatch } from 'react-redux';
import { useState } from 'react';
import { login as setAuth } from '../../store/slices/authSlice.js';
import { login } from '../../api/auth.jsx';
import { setToken } from '../../api/config.jsx';
import { normalizeRole } from '../../utils/permissions.js';

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
      // A veces la respuesta viene directa, o dentro de 'data'.
      const data = response.data || response;
      const { token, user, rol, nombre, apellido } = data;

      if (token && user && rol) {
        // Normalizar el rol usando la función centralizada
        const normalizedRole = normalizeRole(rol);

        dispatch(
          setAuth({
            token,
            id: null, // El backend no devuelve ID, puedes agregarlo después si lo necesitas
            username: user,
            role: normalizedRole,
            nombre: nombre,
            apellido: apellido,
          })
        );

        setToken(token);
        return { success: true, role: normalizedRole };
      } else {
        setError('Respuesta del servidor inválida');
        return { success: false, role: null };
      }
    } catch (err) {
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