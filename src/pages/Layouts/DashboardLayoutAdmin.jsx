import { Outlet } from "react-router-dom";
import Sidebar from "@/Components/Navigation/Sidebar";
import Header from "@/Components/Navigation/Header";

const DashboardLayoutAdmin = () => {
  return (
    <div className="app-root">
      <Header />
      <div className="app-content">
        <Sidebar />
        <main className="main-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayoutAdmin;
