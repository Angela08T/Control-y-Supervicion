
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children, requiredRole }) => {
  const { authorized, role } = useSelector((state) => state.auth);

  if (!authorized) return <Navigate to="/login" />;
  
  // Función para verificar si el rol tiene acceso
  const hasAccess = () => {
    if (!requiredRole) return true;

    // Verificación exacta del rol
    return role === requiredRole;
  };

  if (!hasAccess()) return <Navigate to="/unauthorized" />;

  return children;
};

export default PrivateRoute;
