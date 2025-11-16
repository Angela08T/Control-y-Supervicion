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

// Usuarios
import Usuarios from "@/pages/Usuarios/Usuarios";
import AddUsuarios from "@/pages/Usuarios/AddUsuarios";
import EditUsuarios from "@/pages/Usuarios/EditUsuarios";

// Bodycam
import Bodycam from "@/pages/Bodycam/Bodycam";
import AddBodycam from "@/pages/Bodycam/AddBodycam";
import EditBodycam from "@/pages/Bodycam/EditBodycam";

// Jobs (Cargos)
import Jobs from "@/pages/Jobs/Jobs";
import AddJobs from "@/pages/Jobs/AddJobs";
import EditJobs from "@/pages/Jobs/EditJobs";

// Leads (Personal)
import Leads from "@/pages/Leads/Leads";
import AddLeads from "@/pages/Leads/AddLeads";
import EditLeads from "@/pages/Leads/EditLeads";

// Subject (Asuntos)
import Subject from "@/pages/Subject/Subject";
import AddSubject from "@/pages/Subject/AddSubject";
import EditSubject from "@/pages/Subject/EditSubject";

// Lack (Faltas)
import Lack from "@/pages/Lack/Lack";
import AddLack from "@/pages/Lack/AddLack";
import EditLack from "@/pages/Lack/EditLack";

// Offender (Infractores)
import Offender from "@/pages/Offender/Offender";
import AddOffender from "@/pages/Offender/AddOffender";
import EditOffender from "@/pages/Offender/EditOffender";

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

          {/* Bodycam */}
          <Route path="bodycam" element={<Bodycam />} />
          <Route path="bodycam/add" element={<AddBodycam />} />
          <Route path="bodycam/edit/:id" element={<EditBodycam />} />

          {/* Usuarios */}
          <Route path="usuarios" element={<Usuarios />} />
          <Route path="usuarios/add" element={<AddUsuarios />} />
          <Route path="usuarios/edit/:id" element={<EditUsuarios />} />

          {/* Cargos (Jobs) */}
          <Route path="cargos" element={<Jobs />} />
          <Route path="cargos/add" element={<AddJobs />} />
          <Route path="cargos/edit/:id" element={<EditJobs />} />

          {/* Personal (Leads) */}
          <Route path="personal" element={<Leads />} />
          <Route path="personal/add" element={<AddLeads />} />
          <Route path="personal/edit/:id" element={<EditLeads />} />

          {/* Asuntos (Subject) */}
          <Route path="asuntos" element={<Subject />} />
          <Route path="asuntos/add" element={<AddSubject />} />
          <Route path="asuntos/edit/:id" element={<EditSubject />} />

          {/* Faltas (Lack) */}
          <Route path="faltas" element={<Lack />} />
          <Route path="faltas/add" element={<AddLack />} />
          <Route path="faltas/edit/:id" element={<EditLack />} />

          {/* Infractores (Offender) */}
          <Route path="infractores" element={<Offender />} />
          <Route path="infractores/add" element={<AddOffender />} />
          <Route path="infractores/edit/:id" element={<EditOffender />} />

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

          {/* Bodycam */}
          <Route path="bodycam" element={<Bodycam />} />
          <Route path="bodycam/add" element={<AddBodycam />} />
          <Route path="bodycam/edit/:id" element={<EditBodycam />} />

          {/* Usuarios */}
          <Route path="usuarios" element={<Usuarios />} />
          <Route path="usuarios/add" element={<AddUsuarios />} />
          <Route path="usuarios/edit/:id" element={<EditUsuarios />} />

          {/* Cargos (Jobs) */}
          <Route path="cargos" element={<Jobs />} />
          <Route path="cargos/add" element={<AddJobs />} />
          <Route path="cargos/edit/:id" element={<EditJobs />} />

          {/* Personal (Leads) */}
          <Route path="personal" element={<Leads />} />
          <Route path="personal/add" element={<AddLeads />} />
          <Route path="personal/edit/:id" element={<EditLeads />} />

          {/* Asuntos (Subject) */}
          <Route path="asuntos" element={<Subject />} />
          <Route path="asuntos/add" element={<AddSubject />} />
          <Route path="asuntos/edit/:id" element={<EditSubject />} />

          {/* Faltas (Lack) */}
          <Route path="faltas" element={<Lack />} />
          <Route path="faltas/add" element={<AddLack />} />
          <Route path="faltas/edit/:id" element={<EditLack />} />

          {/* Infractores (Offender) */}
          <Route path="infractores" element={<Offender />} />
          <Route path="infractores/add" element={<AddOffender />} />
          <Route path="infractores/edit/:id" element={<EditOffender />} />

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
          <Route path="bodycam" element={<Bodycam />} />
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
