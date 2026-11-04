import { useNavigate } from 'react-router-dom';
import Button from '@/components/UI/Button';

const UnauthorizedPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-page px-4 text-center">
      <p className="m-0 text-6xl font-semibold text-muted">403</p>
      <h1 className="m-0 text-[22px] font-semibold text-content">Acceso denegado</h1>
      <p className="m-0 max-w-[400px] text-sm text-content-2">
        No tienes permiso para acceder a esta página.
      </p>
      <div className="mt-4">
        <Button onClick={() => navigate('/')}>Volver al inicio</Button>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
