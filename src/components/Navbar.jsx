import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/navbar.css';

const Navbar = ({ toggleSidebar }) => {
  return (
    <nav className="navbar">
      <button className="sidebar-toggle" onClick={toggleSidebar}>
        &#9776; {/* Hamburger icon */}
      </button>
      <div className="navbar-brand">
        <Link to="/">Checkmk Downtime</Link>
      </div>
      {/* User info and sign out are now in the sidebar */}
      <div className="navbar-user-placeholder"></div>
    </nav>
  );
};

export default Navbar;
