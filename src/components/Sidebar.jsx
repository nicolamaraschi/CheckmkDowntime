import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import '../styles/sidebar.css';

const Sidebar = ({ isOpen, closeSidebar }) => {
  const { user, logout } = useAuth();

  return (
    <aside className={`sidebar ${isOpen ? 'is-open' : ''}`}>
      <div>
        <div className="sidebar-header">
          <h2>Menu</h2>
          <button className="sidebar-close" onClick={closeSidebar}>&times;</button>
        </div>
        <ul className="sidebar-nav-links" onClick={closeSidebar}>
          <li>
            <NavLink to="/" end>Dashboard</NavLink>
          </li>
          <li>
            <NavLink to="/hosts">Hosts</NavLink>
          </li>
          <li>
            <NavLink to="/schedule">Schedule Downtime</NavLink>
          </li>
          <li>
            <NavLink to="/downtimes">View Downtimes</NavLink>
          </li>
          <li>
            <NavLink to="/settings">Settings</NavLink>
          </li>
        </ul>
      </div>
      <div className="sidebar-footer">
        <div className="user-info">
          <span className="user-email">{user?.attributes?.email || user?.username}</span>
        </div>
        <button onClick={logout} className="signout-button">
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
