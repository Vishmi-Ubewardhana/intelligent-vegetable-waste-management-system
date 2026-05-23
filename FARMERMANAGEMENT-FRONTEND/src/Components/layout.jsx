import Footer from "./Footer";
import Navbar from "./Navbar";
import { Outlet } from "react-router-dom";
import "./Layout.css";

const Layout = () => {
  return (
    <div className="app-layout">
      <Navbar />
      <main className="app-page-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
export default Layout;