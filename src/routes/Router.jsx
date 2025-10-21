// src/Router.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// LAYOUTS
import DashboardLayoutAdmin from "../layouts/DashboardLayoutAdmin";
import DashboardLayoutSupervisor from "../layouts/DashboardLayoutSupervisor";
import DashboardLayoutCentinela from "../layouts/DashboardLayoutCentinela";

// PAGES LOGIN
import LoginPage from "../components/Login/LoginForm";
// NO AUTORIZADO PAGE
import UnauthorizedPage from "../pages/UnauthorizedPage";
import NotFoundPage from "../pages/NotFoundPage";

// PÁGINA PRINCIPAL DE INCIDENCIAS (compartida por todos los roles)
import IncidenciasPage from "../pages/Incidencias/IncidenciasPage";

import PrivateRoute from "../routes/PrivateRoute";
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
          <Route index element={<IncidenciasPage />} />
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
          <Route index element={<IncidenciasPage />} />
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
          <Route index element={<IncidenciasPage />} />
        </Route>

        {/* Página 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
