import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState, type ReactElement } from "react";
import { logout as logoutAction } from "../store/slices/authSlice";
import { clearToken, setSessionExpiredCallback } from "../api/config";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import type { AppRole, PermissionModule } from "@/types";
import { firstAllowedKey } from "../utils/navigation";

// LAYOUTS
import DashboardLayout from "../layouts/DashboardLayout";

// PAGES
import LoginPage from "../pages/LoginPage";
import UnauthorizedPage from "../pages/UnauthorizedPage";
import NotFoundPage from "../pages/NotFoundPage";
import DashboardPage from "../pages/Dashboard/DashboardPage";
import IncidenciasPage from "../pages/Incidencias/IncidenciasPage";
import InasistenciasPage from "../pages/Inasistencias/InasistenciasPage";
import AuditoriaPage from "../pages/Auditoria/AuditoriaPage";
import BodycamPage from "../pages/Bodycam/BodycamPage";
import UsuariosPage from "../pages/Usuarios/UsuariosPage";
import JobsPage from "../pages/Jobs/JobsPage";
import LeadsPage from "../pages/Leads/LeadsPage";
import SubjectPage from "../pages/Subject/SubjectPage";
import LackPage from "../pages/Lack/LackPage";
import OffenderPage from "../pages/Offender/OffenderPage";
import MetricasPage from "../pages/Metricas/MetricasPage";
import RolesPage from "../pages/Roles/RolesPage";

// COMPONENTS
import SessionExpiredModal from "../components/SessionExpiredModal";

import PrivateRoute from "./PrivateRoute";
import PublicRouter from "./PublicRoute";
import RequirePermission from "./RequirePermission";

/** Pantallas de la aplicación y el permiso de "ver" que necesita cada una */
const PAGES: { path: string; module: PermissionModule; element: ReactElement }[] = [
  { path: "incidencias", module: "incidencias", element: <IncidenciasPage /> },
  { path: "inasistencias", module: "inasistencias", element: <InasistenciasPage /> },
  { path: "bodycam", module: "bodycam", element: <BodycamPage /> },
  { path: "estadisticas", module: "estadisticas", element: <MetricasPage /> },
  { path: "personal", module: "personal", element: <LeadsPage /> },
  { path: "cargos", module: "cargos", element: <JobsPage /> },
  { path: "infractores", module: "offenders", element: <OffenderPage /> },
  { path: "asuntos", module: "asuntos", element: <SubjectPage /> },
  { path: "faltas", module: "faltas", element: <LackPage /> },
  { path: "usuarios", module: "usuarios", element: <UsuariosPage /> },
  { path: "roles", module: "roles", element: <RolesPage /> },
  { path: "auditoria", module: "auditoria", element: <AuditoriaPage /> },
];

/** Rutas base de cada rol. Todas comparten las mismas pantallas: lo que se ve lo deciden los permisos. */
const ROLE_BASES: { path: string; role: AppRole }[] = [
  { path: "/dashboard/admin", role: "admin" },
  { path: "/dashboard/supervisor", role: "supervisor" },
  { path: "/dashboard/centinela", role: "centinela" },
  { path: "/dashboard/validator", role: "validator" },
  { path: "/dashboard/subgerente", role: "subgerente" },
  { path: "/dashboard/custom", role: "custom" },
];

/** Inicio de cada rol: el panel si puede verlo; si no, su primera pantalla disponible. */
function Home() {
  const permissions = useAppSelector((state) => state.auth.permissions);
  if (permissions.dashboard?.includes("view")) return <DashboardPage />;
  const first = firstAllowedKey(permissions);
  return <Navigate to={first ?? "/unauthorized"} replace />;
}

export default function Router() {
  const dispatch = useAppDispatch();
  const [showSessionExpiredModal, setShowSessionExpiredModal] = useState<boolean>(false);

  useEffect(() => {
    // Configurar el callback para mostrar el modal cuando la sesión expire
    setSessionExpiredCallback(() => {
      setShowSessionExpiredModal(true);
    });
  }, []);

  const handleSessionExpiredAccept = () => {
    // Limpiar el token y el estado de autenticación
    clearToken();
    dispatch(logoutAction());
    setShowSessionExpiredModal(false);
    // El componente SessionExpiredModal redirige automáticamente a /login
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/login" element={<PublicRouter element={<LoginPage />} />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/" element={<Navigate to="/login" />} />

        {/* Rutas protegidas: una por rol, con las mismas pantallas */}
        {ROLE_BASES.map(({ path, role }) => (
          <Route
            key={path}
            path={path}
            element={
              <PrivateRoute requiredRole={role}>
                <DashboardLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<Home />} />
            {PAGES.map((page) => (
              <Route
                key={page.path}
                path={page.path}
                element={<RequirePermission module={page.module}>{page.element}</RequirePermission>}
              />
            ))}
          </Route>
        ))}

        {/* Página 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      {/* Modal de sesión expirada */}
      <SessionExpiredModal
        show={showSessionExpiredModal}
        onAccept={handleSessionExpiredAccept}
      />
    </BrowserRouter>
  );
}
