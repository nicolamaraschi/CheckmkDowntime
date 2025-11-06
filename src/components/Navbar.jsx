import React from 'react';
import { FaBell, FaUserCircle, FaSignOutAlt } from 'react-icons/fa';
import '../styles/navbar.css';

// 1. Ricevi 'user' e 'signOut' come props
const Navbar = ({ user, signOut }) => {
  
  // 2. Estrai lo username dall'oggetto user
  const username = user?.username || 'Utente';

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <h1 className="navbar-title">Checkmk Downtime Scheduler</h1>
      </div>
      <div className="navbar-right">
        <button className="navbar-icon-button">
          <FaBell />
        </button>
        <div className="user-info">
          <FaUserCircle className="user-icon" />
          {/* 3. Mostra lo username */}
          <span className="user-name">{username}</span>
        </div>
        {/* 4. Aggiungi il pulsante Logout che chiama la funzione signOut */}
        <button 
          className="navbar-icon-button logout-button" 
          onClick={signOut} 
          title="Esci"
        >
          <FaSignOutAlt />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;