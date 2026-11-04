import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import Button from '@/components/UI/Button';

const NotFoundPage = () => {
  const navigate = useNavigate();
  const role = useAppSelector((state) => state.auth?.role);

  // Lógica de redirección según rol
  const getRedirectPath = (): string => {
    switch (role) {
      case 'admin':
        return '/dashboard/admin';
      case 'supervisor':
        return '/dashboard/supervisor';
      case 'centinela':
        return '/dashboard/centinela';
      default:
        return '/login'; // fallback para no logueados o sin rol
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      navigate(getRedirectPath());
    }, 2000);

    return () => clearTimeout(timeout);
  }, [navigate, role]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-page px-4 text-center">
      <p className="m-0 text-6xl font-semibold text-muted">404</p>
      <h1 className="m-0 text-[22px] font-semibold text-content">Página no encontrada</h1>
      <p className="m-0 max-w-[400px] text-sm text-content-2">
        Te redirigiremos a tu panel en unos segundos.
      </p>
      <div className="mt-4">
        <Button onClick={() => navigate(getRedirectPath())}>Volver al inicio</Button>
      </div>
    </div>
  );
};

export default NotFoundPage;
