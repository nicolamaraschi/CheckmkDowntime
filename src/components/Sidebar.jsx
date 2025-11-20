import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaClock, FaCalendarPlus, FaServer, FaCog, FaShieldAlt } from 'react-icons/fa';
import '../styles/sidebar.css';

const Sidebar = ({ isOpen, closeSidebar, user, logout }) => {
  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/downtimes', label: 'Downtime Esistenti', icon: <FaClock /> },
    { path: '/schedule', label: 'Pianifica Downtime', icon: <FaCalendarPlus /> },
    { path: '/certificates', label: 'Certificati', icon: <FaShieldAlt /> },
    { path: '/hosts', label: 'Configurazione Host', icon: <FaServer /> },
    { path: '/settings', label: 'Impostazioni', icon: <FaCog /> }
  ];

  return (
    <>
      <aside className={`sidebar ${isOpen ? 'is-open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-area">
            <span className="logo-icon">🛡️</span>
            <h2>Checkmk</h2>
          </div>
          <button className="sidebar-close" onClick={closeSidebar}>&times;</button>
        </div>

        <nav className="sidebar-nav">
          <ul>
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  onClick={closeSidebar}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">
              {(user?.attributes?.email?.[0] || user?.username?.[0] || 'U').toUpperCase()}
            </div>
            <div className="user-info">
              <span className="user-name">Admin User</span>
              <span className="user-email">{user?.attributes?.email || user?.username}</span>
            </div>
          </div>
          <button onClick={logout} className="signout-button">
            Sign Out
          </button>
        </div>
      </aside>
      {isOpen && <div className="sidebar-overlay" onClick={closeSidebar}></div>}
    </>
  );
};

export default Sidebar;