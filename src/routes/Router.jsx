import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// LAYOUTS
import DashboardLayoutAdmin from "../layouts/DashboardLayoutAdmin";
import DashboardLayoutSupervisor from "../layouts/DashboardLayoutSupervisor";
import DashboardLayoutCentinela from "../layouts/DashboardLayoutCentinela";
import DashboardLayoutValidator from "../layouts/DashboardLayoutValidator";

// PAGES
import LoginPage from "../pages/LoginPage";
import UnauthorizedPage from "../pages/UnauthorizedPage";
import NotFoundPage from "../pages/NotFoundPage";
import DashboardPage from "../pages/Dashboard/DashboardPage";
import IncidenciasPage from "../pages/Incidencias/IncidenciasPage";
import AuditoriaPage from "../pages/Auditoria/AuditoriaPage";
import BodycamPage from "../pages/Bodycam/BodycamPage";
import UsuariosPage from "../pages/Usuarios/UsuariosPage";
import JobsPage from "../pages/Jobs/JobsPage";
import LeadsPage from "../pages/Leads/LeadsPage";
import SubjectPage from "../pages/Subject/SubjectPage";
import LackPage from "../pages/Lack/LackPage";

import PrivateRoute from "./PrivateRoute";
import PublicRouter from "./PublicRoute";

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/login" element={<PublicRouter element={<LoginPage />} />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/" element={<Navigate to="/login" />} />

        {/* Rutas protegidas - ADMIN */}
        <Route
          path="/dashboard/admin"
          element={
            <PrivateRoute requiredRole="admin">
              <DashboardLayoutAdmin />
            </PrivateRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="incidencias" element={<IncidenciasPage />} />
          <Route path="bodycam" element={<BodycamPage />} />
          <Route path="usuarios" element={<UsuariosPage />} />
          <Route path="cargos" element={<JobsPage />} />
          <Route path="personal" element={<LeadsPage />} />
          <Route path="asuntos" element={<SubjectPage />} />
          <Route path="faltas" element={<LackPage />} />
          {/* Placeholder para futuras rutas */}
          <Route path="supervisores" element={<div className="main-area"><h1>Supervisores</h1><p>Próximamente...</p></div>} />
          <Route path="alertas" element={<div className="main-area"><h1>Alertas</h1><p>Próximamente...</p></div>} />
          <Route path="estadisticas" element={<div className="main-area"><h1>Estadísticas</h1><p>Próximamente...</p></div>} />
          <Route path="camaras" element={<div className="main-area"><h1>Cámaras</h1><p>Próximamente...</p></div>} />
          <Route path="reportes" element={<div className="main-area"><h1>Reportes</h1><p>Próximamente...</p></div>} />
          <Route path="configuracion" element={<div className="main-area"><h1>Configuración</h1><p>Próximamente...</p></div>} />
          <Route path="auditoria" element={<AuditoriaPage />} />
        </Route>

        {/* Rutas protegidas - SUPERVISOR */}
        <Route
          path="/dashboard/supervisor"
          element={
            <PrivateRoute requiredRole="supervisor">
              <DashboardLayoutSupervisor />
            </PrivateRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="incidencias" element={<IncidenciasPage />} />
          <Route path="bodycam" element={<BodycamPage />} />
          <Route path="usuarios" element={<UsuariosPage />} />
          <Route path="cargos" element={<JobsPage />} />
          <Route path="personal" element={<LeadsPage />} />
          <Route path="asuntos" element={<SubjectPage />} />
          <Route path="alertas" element={<div className="main-area"><h1>Alertas</h1><p>Próximamente...</p></div>} />
          <Route path="estadisticas" element={<div className="main-area"><h1>Estadísticas</h1><p>Próximamente...</p></div>} />
          <Route path="reportes" element={<div className="main-area"><h1>Reportes</h1><p>Próximamente...</p></div>} />
        </Route>

        {/* Rutas protegidas - CENTINELA */}
        <Route
          path="/dashboard/centinela"
          element={
            <PrivateRoute requiredRole="centinela">
              <DashboardLayoutCentinela />
            </PrivateRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="incidencias" element={<IncidenciasPage />} />
          <Route path="bodycam" element={<BodycamPage />} />
        </Route>

        {/* Rutas protegidas - VALIDATOR */}
        <Route
          path="/dashboard/validator"
          element={
            <PrivateRoute requiredRole="validator">
              <DashboardLayoutValidator />
            </PrivateRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="incidencias" element={<IncidenciasPage />} />
        </Route>

        {/* Página 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
