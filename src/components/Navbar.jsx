import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/navbar.css';

const Navbar = ({ toggleSidebar }) => {
  return (
    <nav className="navbar">
      <div className="navbar-content">
        <button className="sidebar-toggle" onClick={toggleSidebar} aria-label="Toggle Menu">
          <span className="hamburger-icon">☰</span>
        </button>

        <div className="navbar-brand-mobile">
          <Link to="/">Checkmk Downtime</Link>
        </div>

        <div className="navbar-actions">
          {/* Placeholder for potential top-bar actions like notifications */}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
