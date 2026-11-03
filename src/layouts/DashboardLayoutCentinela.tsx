import { Outlet } from "react-router-dom";
import Sidebar from "../components/UI/Sidebar";
import Topbar from "../components/UI/Topbar";

const DashboardLayoutCentinela = () => {
  return (
    <div className="app-root">
      <Topbar />
      <div className="app-content">
        <Sidebar />
        <main className="main-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayoutCentinela;
