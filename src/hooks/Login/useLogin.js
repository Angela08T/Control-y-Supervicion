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
      const { data } = response;
      const { token, user } = data; // ← ✅ CAMBIO AQUÍ

      if (token && user) {
        const {id, username, role } = user;
        
        // Debug logging - remover después del deploy
        console.log('Login Debug - Role from backend:', role);
        console.log('Login Debug - Role normalized:', role.toLowerCase());
        
        dispatch(
          setAuth({
            token,
            id,
            username,
            role: role.toLowerCase(),
            
          })
        );
   
        setToken(token);
        return {success: true, role: user.role.toLowerCase()};
      } else {
        console.error('Login fallido: respuesta inválida', response.data);
        return false;
      }
    } catch (err) {
      // const errorMessage = err.message || 'Error al iniciar sesión';
      console.error('Error en login:', err.response ? err.response.data : err);
      setError(`Error al iniciar sesión: ${err.response?.data?.message || err.message}`);
      return { success: false, role: null };
    } finally {
      setLoading(false);
    }
  };

  return { handleLogin, loading, error };
};

export default useLogin;