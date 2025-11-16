import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// LAYOUTS
import DashboardLayoutAdmin from "@/Pages/Layouts/DashboardLayoutAdmin";
import DashboardLayoutSupervisor from "@/Pages/Layouts/DashboardLayoutSupervisor";
import DashboardLayoutCentinela from "@/Pages/Layouts/DashboardLayoutCentinela";
import DashboardLayoutValidator from "@/Pages/Layouts/DashboardLayoutValidator";

// PAGES
import LoginPage from "@/pages/LoginPage";
import UnauthorizedPage from "@/pages/UnauthorizedPage";
import NotFoundPage from "@/pages/NotFoundPage";
import DashboardPage from "@/pages/Dashboard/DashboardPage";
import IncidenciasPage from "@/pages/Incidencias/IncidenciasPage";
import AuditoriaPage from "@/pages/Auditoria/AuditoriaPage";
import BodycamPage from "@/pages/Bodycam/BodycamPage";
import UsuariosPage from "@/pages/Usuarios/UsuariosPage";
import JobsPage from "@/pages/Jobs/JobsPage";
import LeadsPage from "@/pages/Leads/LeadsPage";
import SubjectPage from "@/pages/Subject/SubjectPage";
import LackPage from "@/pages/Lack/LackPage";
import OffenderPage from "@/pages/Offender/OffenderPage";

import PrivateRouter from "./PrivateRouter";
import PublicRouter from "./PublicRouter";

export default function AppRouter() {
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
            <PrivateRouter requiredRole="admin">
              <DashboardLayoutAdmin />
            </PrivateRouter>
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
          <Route path="infractores" element={<OffenderPage />} />
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
            <PrivateRouter requiredRole="supervisor">
              <DashboardLayoutSupervisor />
            </PrivateRouter>
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
          <Route path="infractores" element={<OffenderPage />} />
          <Route path="alertas" element={<div className="main-area"><h1>Alertas</h1><p>Próximamente...</p></div>} />
          <Route path="estadisticas" element={<div className="main-area"><h1>Estadísticas</h1><p>Próximamente...</p></div>} />
          <Route path="reportes" element={<div className="main-area"><h1>Reportes</h1><p>Próximamente...</p></div>} />
        </Route>

        {/* Rutas protegidas - CENTINELA */}
        <Route
          path="/dashboard/centinela"
          element={
            <PrivateRouter requiredRole="centinela">
              <DashboardLayoutCentinela />
            </PrivateRouter>
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
            <PrivateRouter requiredRole="validator">
              <DashboardLayoutValidator />
            </PrivateRouter>
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
