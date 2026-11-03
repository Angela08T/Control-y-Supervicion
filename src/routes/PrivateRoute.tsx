
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import type { AppRole } from '@/types';

interface PrivateRouteProps {
  children: ReactNode;
  requiredRole?: AppRole;
}

const PrivateRoute = ({ children, requiredRole }: PrivateRouteProps) => {
  const { authorized, role } = useAppSelector((state) => state.auth);

  if (!authorized) return <Navigate to="/login" />;

  // Función para verificar si el rol tiene acceso
  const hasAccess = (): boolean => {
    if (!requiredRole) return true;

    // Verificación exacta del rol
    return role === requiredRole;
  };

  if (!hasAccess()) return <Navigate to="/unauthorized" />;

  return children;
};

export default PrivateRoute;
