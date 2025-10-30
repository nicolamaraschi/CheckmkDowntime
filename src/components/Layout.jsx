import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import '../styles/layout.css';

const Layout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  // Close sidebar on route change
  useEffect(() => {
    closeSidebar();
  }, [location]);

  return (
    <div className={`app-container ${isSidebarOpen ? 'sidebar-is-open' : ''}`}>
      <Navbar toggleSidebar={toggleSidebar} />
      <div className="content-container">
        <Sidebar isOpen={isSidebarOpen} closeSidebar={closeSidebar} />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
      {isSidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar}></div>}
    </div>
  );
};

export default Layout;
