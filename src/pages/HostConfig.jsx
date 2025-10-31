import React from 'react';
import { useApi } from '../hooks/useApi';
import '../styles/hostConfig.css';
import Loader from '../components/Loader';

const HostConfig = () => {
  const { data, loading, error, fromCache } = useApi('hosts');
  
  if (loading) {
    return (
      <div className="host-config-container">
        <h1>Configurazione Host</h1>
        <Loader text="Caricamento host in corso..." />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="host-config-container">
        <h1>Configurazione Host</h1>
        <div className="error-message">
          <h3>Errore</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  let hosts = [];
  if (data) {
    if (Array.isArray(data)) {
      hosts = data;
    } else if (data.hosts && Array.isArray(data.hosts)) {
      hosts = data.hosts;
    }
  }

  return (
    <div className="host-config-container">
      <h1>Configurazione Host</h1>
      {fromCache && (
        <div style={{
          padding: '10px',
          backgroundColor: '#e7f3ff',
          borderRadius: '4px',
          marginBottom: '20px',
          fontSize: '14px',
          color: '#0066cc'
        }}>
          ℹ️ Dati caricati dalla cache
        </div>
      )}
      <div className="host-count">
        {hosts.length} host disponibili
      </div>
      
      <div className="hosts-grid">
        {hosts.map(host => (
          <div key={host} className="host-card">
            <h3>{host}</h3>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HostConfig;
