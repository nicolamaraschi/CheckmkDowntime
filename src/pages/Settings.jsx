import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useApiCache } from '../contexts/ApiCacheContext';
import '../styles/settings.css';
import Loader from '../components/Loader';

const Settings = () => {
  const { user } = useAuth();
  const { clearCache, cache } = useApiCache();
  const [connectionInfo, setConnectionInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchConnectionInfo = async () => {
      try {
        setLoading(true);
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
    };

    fetchConnectionInfo();
  }, []);

  const handleClearCache = () => {
    clearCache();
    alert('Cache svuotata con successo!');
  };

  const handleRetryConnection = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/connection-test');
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const data = await response.json();
      setConnectionInfo(data);
    } catch (error) {
      console.error("Error fetching connection info:", error);
      setError(error.message);
      setConnectionInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const cacheSize = Object.keys(cache).length;
  
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
      <h1>⚙️ Impostazioni</h1>
      
      <div className="settings-section">
        <h2>👤 Account</h2>
        {user && (
          <div className="user-info">
            <p><strong>Username:</strong> {user.username}</p>
            <p><strong>Email:</strong> {user.attributes?.email}</p>
          </div>
        )}
      </div>

      <div className="settings-section">
        <h2>💾 Gestione Cache</h2>
        <div className="cache-info">
          <p><strong>Elementi in cache:</strong> {cacheSize}</p>
          <p style={{ fontSize: '0.9em', color: '#666', marginBottom: '15px' }}>
            La cache velocizza l'applicazione salvando i dati già caricati.
          </p>
          <button 
            className="cache-button" 
            onClick={handleClearCache}
          >
            🗑️ Svuota Cache
          </button>
        </div>
      </div>
      
      <div className="settings-section">
        <h2>🔌 Connessione Checkmk</h2>
        {error ? (
          <div className="error-message">
            ❌ Errore: {error}
          </div>
        ) : connectionInfo ? (
          <div className={`connection-info status-${connectionInfo.status}`}>
            <p><strong>Stato:</strong> {connectionInfo.status === 'success' ? '✅ Connesso' : '❌ Errore'}</p>
            <p><strong>Dettagli:</strong> {connectionInfo.message}</p>
          </div>
        ) : (
          <div className="error-message">
            ❌ Impossibile verificare la connessione al server Checkmk.
          </div>
        )}
        <button 
          className="retry-button" 
          onClick={handleRetryConnection}
        >
          🔄 Riprova connessione
        </button>
      </div>
      
      <div className="settings-section">
        <h2>ℹ️ Informazioni applicazione</h2>
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
