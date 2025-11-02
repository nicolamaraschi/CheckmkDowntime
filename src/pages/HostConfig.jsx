import React, { useState, useMemo } from 'react';
import { useApi } from '../hooks/useApi';
import ClientSelector from '../components/ClientSelector';
import '../styles/hostConfig.css'; // Il file CSS aggiornato
import Loader from '../components/Loader';

const HostConfig = () => {
  const [selectedClient, setSelectedClient] = useState('');
  const { data, loading, error, fromCache } = useApi('hosts');

  const hosts = useMemo(() => {
    let allHosts = [];
    if (data) {
      if (Array.isArray(data)) {
        allHosts = data.map(item =>
          typeof item === 'string' ? { id: item, folder: '/' } : item
        );
      } else if (data.hosts && Array.isArray(data.hosts)) {
        allHosts = data.hosts.map(item =>
          typeof item === 'string' ? { id: item, folder: '/' } : item
        );
      }
    }

    if (selectedClient && selectedClient !== '') {
      return allHosts.filter(host => host.folder === selectedClient);
    }
    return allHosts;
  }, [data, selectedClient]);

  if (loading) {
    return (
      <div className="host-config">
        <h1 className="host-config__title">Configurazione Host</h1>
        <div className="host-config__state-container">
          <Loader text="Caricamento host in corso..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="host-config">
        <h1 className="host-config__title">Configurazione Host</h1>
        <div className="host-config__state-container">
          <div className="host-config__message host-config__message--error">
            <h3>Errore</h3>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="host-config">
      <h1 className="host-config__title">Configurazione Host</h1>

      {fromCache && (
        <div className="host-config__message host-config__message--info">
          ℹ️ Dati caricati dalla cache
        </div>
      )}

      <div className="host-config__filters">
        <div className="host-config__filter-group">
          <label className="host-config__label" htmlFor="client-selector">
            Filtra per Cliente
          </label>
          <ClientSelector
            id="client-selector" // Assicurati che ClientSelector accetti un id
            selectedClient={selectedClient}
            setSelectedClient={setSelectedClient}
          />
        </div>
        {selectedClient && (
          <button
            onClick={() => setSelectedClient('')}
            className="host-config__button host-config__button--secondary"
          >
            Mostra tutti
          </button>
        )}
      </div>

      <div className="host-config__count">
        {hosts.length} host {selectedClient ? `nel cliente ${selectedClient}` : 'disponibili'}
      </div>

      <div className="host-config__grid">
        {hosts.map(host => (
          <div key={host.id} className="host-config__card">
            <h3 className="host-config__card-title">{host.id}</h3>
            <p className="host-config__card-meta">
              Cliente: {host.folder}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HostConfig;