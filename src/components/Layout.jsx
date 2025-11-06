import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import '../styles/layout.css'; 

// 1. Ricevi 'user' e 'signOut' da App.js
const Layout = ({ user, signOut }) => { 
  return (
    <div className="layout">
      {/* 2. Passa 'user' e 'signOut' alla Navbar */}
      <Navbar user={user} signOut={signOut} /> 
      <div className="layout-body">
        <Sidebar />
        <main className="layout-content">
          {/* Outlet renderizzerà le tue pagine (Dashboard, Settings, ecc.) */}
          <Outlet /> 
        </main>
      </div>
    </div>
  );
};

export default Layout;