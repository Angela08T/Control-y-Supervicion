import { useState } from 'react';
import { login as setAuth } from '../../store/slices/authSlice';
import { useAppDispatch } from '@/store/hooks';
import { login } from '../../api/auth';
import { setToken } from '../../api/config';
import { normalizeRole } from '../../utils/permissions';
import type { LoginCredentials, LoginData, LoginResult } from '@/types';

/** Cuerpo de login: puede venir envuelto en `data` o directo (ambas formas se aceptan) */
interface LoginBody extends Partial<LoginData> {
  data?: Partial<LoginData>;
}

/** Forma mínima de un error de axios usada para leer el mensaje del backend */
interface LoginApiError {
  message?: string;
  response?: { data?: { message?: string } };
}

export interface UseLoginResult {
  handleLogin: (credentials: LoginCredentials) => Promise<LoginResult>;
  loading: boolean;
  error: string | null;
}

const useLogin = (): UseLoginResult => {
 const dispatch = useAppDispatch();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (credentials: LoginCredentials): Promise<LoginResult> => {
    setLoading(true);
    setError(null);
    try {
      const response: LoginBody = await login(credentials);

      // La respuesta del backend tiene esta estructura:
      // { message: "Login exitoso", data: { user: "diego", rol: "administrator", token: "..." } }
      // A veces la respuesta viene directa, o dentro de 'data'.
      const data: Partial<LoginData> = response.data || response;
      const { token, user, rol, role_name, permissions, nombre, apellido } = data;

      if (token && user && rol) {
        // Normalizar el rol usando la función centralizada
        const normalizedRole = normalizeRole(rol);

        dispatch(
          setAuth({
            token,
            id: null, // El backend no devuelve ID, puedes agregarlo después si lo necesitas
            username: user,
            role: normalizedRole,
            roleKey: rol,
            roleName: role_name ?? rol,
            permissions: permissions ?? {},
            nombre: nombre ?? null,
            apellido: apellido ?? null,
          })
        );

        setToken(token);
        return { success: true, role: normalizedRole };
      } else {
        setError('Respuesta del servidor inválida');
        return { success: false, role: null };
      }
    } catch (err) {
      const apiError = err as LoginApiError;
      const errorMessage = apiError.response?.data?.message || apiError.message || 'Error al iniciar sesión';
      setError(errorMessage);
      return { success: false, role: null };
    } finally {
      setLoading(false);
    }
  };

  return { handleLogin, loading, error };
};

export default useLogin;
