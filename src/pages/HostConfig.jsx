import React, { useState, useMemo } from 'react';
import { useApi } from '../hooks/useApi';
import ClientSelector from '../components/ClientSelector';
import '../styles/hostConfig.css';
import Loader from '../components/Loader';

const HostConfig = () => {
  const [selectedClient, setSelectedClient] = useState('');
  const { data, loading, error, fromCache } = useApi('hosts');
  
  // Move useMemo hook before any conditional returns to follow React Hooks rules
  const hosts = useMemo(() => {
    let allHosts = [];
    if (data) {
      if (Array.isArray(data)) {
        // Handle both old format (strings) and new format (objects with id and folder)
        allHosts = data.map(item => {
          if (typeof item === 'string') {
            return { id: item, folder: '/' };
          }
          return item;
        });
      } else if (data.hosts && Array.isArray(data.hosts)) {
        allHosts = data.hosts.map(item => {
          if (typeof item === 'string') {
            return { id: item, folder: '/' };
          }
          return item;
        });
      }
    }

    // Filter by selected client if one is selected
    if (selectedClient && selectedClient !== '') {
      return allHosts.filter(host => host.folder === selectedClient);
    }

    return allHosts;
  }, [data, selectedClient]);
  
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

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
          Filtra per Cliente
        </label>
        <ClientSelector selectedClient={selectedClient} setSelectedClient={setSelectedClient} />
        {selectedClient && (
          <button
            onClick={() => setSelectedClient('')}
            style={{
              marginLeft: '10px',
              padding: '8px 16px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Mostra tutti
          </button>
        )}
      </div>

      <div className="host-count">
        {hosts.length} host {selectedClient ? `nel cliente ${selectedClient}` : 'disponibili'}
      </div>

      <div className="hosts-grid">
        {hosts.map(host => (
          <div key={host.id} className="host-card">
            <h3>{host.id}</h3>
            <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '8px' }}>
              Cliente: {host.folder}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HostConfig;