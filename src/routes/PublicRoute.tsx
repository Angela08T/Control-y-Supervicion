import type { ReactElement } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';

interface PublicRouterProps {
  element: ReactElement;
}

const PublicRouter = ({ element }: PublicRouterProps) => {
  const location = useLocation();
  const { authorized, role } = useAppSelector((state) => state.auth);

  // Determina la URL a redirigir si ya está autorizado
  const getRedirectPath = (): string => {
    switch (role) {
      case 'admin':
        return '/dashboard/admin';
      case 'supervisor':
        return '/dashboard/supervisor';
      case 'centinela':
        return '/dashboard/centinela';
      default:
        return '/login';
    }
  };

  return authorized ? <Navigate to={getRedirectPath()} /> : element;
};

export default PublicRouter;
