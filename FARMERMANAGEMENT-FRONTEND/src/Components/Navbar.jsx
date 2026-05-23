import { Link, NavLink } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          {/* Link to home/dashboard */}
          <Link to="/farmer">
            <h1>
              <span className="brand-icon" aria-hidden="true">🌿</span>
              <span>Stock Manager</span>
            </h1>
          </Link>
        </div>

        <ul className="navbar-menu">
          <li>
            <NavLink to="/farmer" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink to="/farmer/add-stock" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              Add Stock
            </NavLink>
          </li>
          <li>
            <NavLink to="/farmer/view-stock" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              View Stock
            </NavLink>
          </li>
          <li>
            <NavLink to="/farmer/demand" className={({ isActive }) => `nav-link nav-link-demand${isActive ? ' active' : ''}`}>
              AI Demand
            </NavLink>
          </li>
          <li>
            <NavLink to="/farmer/wastage-report" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              Financial Report
            </NavLink>
          </li>
          <li>
            <NavLink to="/farmer/orders" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              Orders
            </NavLink>
          </li>
          <li>
            <NavLink to="/farmer/profile" className={({ isActive }) => `nav-link nav-profile${isActive ? ' active' : ''}`}>
              Profile
            </NavLink>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;