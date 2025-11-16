import { useSelector } from 'react-redux';
import { getModulePermissions } from '@/helpers/permissions';

/**
 * Hook para manejar permisos de usuario
 * @param {string} moduleName - Nombre del módulo
 * @returns {Object} Permisos del módulo { canCreate, canRead, canUpdate, canDelete }
 */
const usePermission = (moduleName) => {
  const { role } = useSelector((state) => state.auth);

  const permissions = getModulePermissions(role, moduleName);

  return permissions;
};

export default usePermission;
