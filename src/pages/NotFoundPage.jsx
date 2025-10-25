import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const NotFoundPage = () => {
  const navigate = useNavigate();
  const role = useSelector((state) => state.auth?.role);

  // Lógica de redirección según rol
  const getRedirectPath = () => {
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
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 text-center">
      <h1 className="text-7xl font-bold text-red-600 mb-4">404</h1>
      <p className="text-xl text-gray-700 mb-2">Página no encontrada</p>
      <p className="text-gray-500 mb-6">
        Serás redirigido automáticamente según tu perfil en breve...
      </p>
      <button
        onClick={() => navigate(getRedirectPath())}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        Ir ahora
      </button>
    </div>
  );
};

export default NotFoundPage;
