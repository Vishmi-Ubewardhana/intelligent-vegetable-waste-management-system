import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
  return (
    <aside className="app-sidebar">
      <div className="app-sidebar-brand">
        <h2>Stock Manager</h2>
        <p>Farmer Panel</p>
      </div>

      <nav className="app-sidebar-nav">
        <NavLink to="/" end className="app-sidebar-link">
          Dashboard
        </NavLink>
        <NavLink to="/add-stock" className="app-sidebar-link">
          Add Stock
        </NavLink>
        <NavLink to="/view-stock" className="app-sidebar-link">
          View Stock
        </NavLink>
        <NavLink to="/demand" className="app-sidebar-link">
          AI Demand
        </NavLink>
        <NavLink to="/wastage-report" className="app-sidebar-link">
          Financial Report
        </NavLink>
        <NavLink to="/orders" className="app-sidebar-link">
          Orders
        </NavLink>
        <NavLink to="/profile" className="app-sidebar-link">
          Profile
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;
