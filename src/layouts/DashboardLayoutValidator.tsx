import { Outlet } from "react-router-dom";
import Sidebar from "../components/UI/Sidebar";
import Topbar from "../components/UI/Topbar";
import { appContent, appRoot, cn, mainArea } from "../utils/classes";

/* El tramo 601-900px replica el @media(max-width:900px) de .main-area */
const mainAreaClass = cn(mainArea, "min-[601px]:max-[900px]:w-[calc(100%-80px)] min-[601px]:max-[900px]:p-[15px]");

const DashboardLayoutValidator = () => {
  return (
    <div className={appRoot}>
      <Topbar />
      <div className={appContent}>
        <Sidebar />
        <main className={mainAreaClass}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayoutValidator;
