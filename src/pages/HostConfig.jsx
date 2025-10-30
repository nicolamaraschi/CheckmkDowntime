import React from 'react';
import { useApi } from '../hooks/useApi';
import '../styles/hostConfig.css';

const HostConfig = () => {
  const { data: hosts, loading, error } = useApi('/hosts');

  return (
    <div className="host-config-container">
      <h1>Configurazione Host</h1>
      
      {loading && <div className="loading-spinner">Caricamento host in corso...</div>}
      
      {error && (
        <div className="error-message">
          <h3>Errore</h3>
          <p>{error}</p>
        </div>
      )}
      
      {!loading && !error && hosts && (
        <>
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
        </>
      )}
    </div>
  );
};

export default HostConfig;
