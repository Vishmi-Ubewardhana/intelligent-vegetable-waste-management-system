import './Footer.css';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-columns">
        <div className="footer-column">
          <h2>Stock Manager</h2>
          <p>Manage your inventory efficiently</p>
          <p className="copyright">&copy; 2026 Stock Manager. All rights reserved.</p>
        </div>

        <div className="footer-column">
          <h3>Quick Links</h3>
          <Link to="/">Dashboard</Link>
          <Link to="/add-stock">Add Stock</Link>
          <Link to="/view-stock">View Stock</Link>
          <Link to="/profile">Profile</Link>
        </div>

        <div className="footer-column contact-details">
          <h3>Contact</h3>
          <p><strong>Email:</strong> info@stockmanager.com</p>
          <p><strong>Phone:</strong> +1 (555) 123-4567</p>
          <p><strong>Address:</strong> 123 Main St, City, Country</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
