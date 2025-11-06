import React, { useState } from 'react';
import { FaSave, FaSignOutAlt } from 'react-icons/fa';
// import { useAuth } from '../auth/AuthProvider'; // <-- RIMOSSO
import '../styles/settings.css';

const Settings = () => {
  const [apiToken, setApiToken] = useState('');
  // const { logout } = useAuth(); // <-- RIMOSSO

  const handleSave = () => {
    console.log('Impostazioni salvate');
  };

  const handleLogout = () => {
    // Questa funzione è ora gestita dal pulsante nella Navbar.
    // Il pulsante in `Navbar.jsx` riceve 'signOut' da `App.js`.
    console.log("Logout gestito da Navbar");
    // logout(); // <-- RIMOSSO
  };

  return (
    <div className="settings-page">
      <h2>Impostazioni</h2>
      
      <div className="settings-card">
        <h3>API Token (Esempio)</h3>
        <p>Inserisci il tuo token API (non implementato).</p>
        <input 
          type="password" 
          className="settings-input"
          value={apiToken}
          onChange={(e) => setApiToken(e.target.value)}
          placeholder="Il tuo token API segreto"
        />
        <button onClick={handleSave} className="settings-button">
          <FaSave />
          <span>Salva Impostazioni</span>
        </button>
      </div>

      {/* Questo blocco è ridondante se hai il logout nella Navbar. 
          Puoi rimuoverlo se vuoi. */}
      <div className="settings-card">
        <h3>Sessione Utente</h3>
        <p>Gestisci la tua sessione corrente.</p>
        <button 
          onClick={handleLogout} 
          className="settings-button logout-button"
          disabled={true} // Disabilitato perché gestito da Navbar
        >
          <FaSignOutAlt />
          <span>Esci (da Navbar)</span>
        </button>
      </div>
    </div>
  );
};

export default Settings;