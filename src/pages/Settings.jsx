import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useApi } from '../hooks/useApi';
import '../styles/settings.css';

const Settings = () => {
  const { user } = useAuth();
  const [connectionInfo, setConnectionInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const api = useApi();

  const fetchConnectionInfo = useCallback(async () => {
    try {
      const data = await api.get('/connection-test');
      setConnectionInfo(data);
    } catch (error) {
      console.error("Error fetching connection info:", error);
      setConnectionInfo({ status: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchConnectionInfo();
  }, [fetchConnectionInfo]);
  
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
        {loading ? (
          <div className="loading-spinner">Verificando la connessione...</div>
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
      </div>
      
      <div className="settings-section">
        <h2>Informazioni applicazione</h2>
        <div className="app-info">
          <p><strong>Versione:</strong> 1.0.0</p>
          <p><strong>Data di rilascio:</strong> 30 Ottobre 2025</p>
          <p><strong>Sviluppata da:</strong> Horsa</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;