import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import type { PermissionModule } from '@/types';

/** Deja ver la pantalla solo si el rol tiene permiso de "ver" en el módulo; si no, va a "sin acceso". */
export default function RequirePermission({ module, children }: { module: PermissionModule; children: ReactNode }) {
  const permissions = useAppSelector((state) => state.auth.permissions);
  if (!permissions[module]?.includes('view')) return <Navigate to="/unauthorized" replace />;
  return children;
}
