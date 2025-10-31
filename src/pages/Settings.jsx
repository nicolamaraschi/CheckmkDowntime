import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth/AuthProvider';
import '../styles/settings.css';
import Loader from '../components/Loader';

const Settings = () => {
  const { user } = useAuth();
  const [connectionInfo, setConnectionInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchConnectionInfo = useCallback(async () => {
    try {
      setLoading(true);
      // Corretto URL dell'API
      const response = await fetch('/api/connection-test');
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const data = await response.json();
      setConnectionInfo(data);
      setError(null);
    } catch (error) {
      console.error("Error fetching connection info:", error);
      setError(error.message);
      setConnectionInfo(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConnectionInfo();
  }, [fetchConnectionInfo]);
  
  if (loading) {
    return (
      <div className="settings-container">
        <h1>Impostazioni</h1>
        <Loader text="Verifica connessione in corso..." />
      </div>
    );
  }

  return (
    <div className="settings-container">
      <h1>Impostazioni</h1>
      
      <div className="settings-section">
        <h2>Account</h2>
        {user && (
          <div className="user-info">
            <p><strong>Username:</strong> {user.username}</p>
            <p><strong>Email:</strong> {user.attributes?.email}</p>
          </div>
        )}
      </div>
      
      <div className="settings-section">
        <h2>Connessione Checkmk</h2>
        {error ? (
          <div className="error-message">
            Errore: {error}
          </div>
        ) : connectionInfo ? (
          <div className={`connection-info status-${connectionInfo.status}`}>
            <p><strong>Stato:</strong> {connectionInfo.status === 'success' ? 'Connesso' : 'Errore'}</p>
            <p><strong>Dettagli:</strong> {connectionInfo.message}</p>
          </div>
        ) : (
          <div className="error-message">
            Impossibile verificare la connessione al server Checkmk.
          </div>
        )}
        <button 
          className="retry-button" 
          onClick={fetchConnectionInfo}
          style={{
            marginTop: '10px',
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Riprova connessione
        </button>
      </div>
      
      <div className="settings-section">
        <h2>Informazioni applicazione</h2>
        <div className="app-info">
          <p><strong>Versione:</strong> 1.0.0</p>
          <p><strong>Data di rilascio:</strong> 31 Ottobre 2025</p>
          <p><strong>Sviluppata da:</strong> Horsa</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;