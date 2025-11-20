import React, { useState, useMemo } from 'react';
import { useApi } from '../hooks/useApi';
import ClientSelector from '../components/ClientSelector';
import '../styles/hostConfig.css';
import Loader from '../components/Loader';

const HostConfig = () => {
  const [selectedClient, setSelectedClient] = useState('');
  const [searchTerm, setSearchTerm] = useState(''); // NUOVO: Stato per la ricerca
  const { data, loading, error, fromCache } = useApi('hosts');

  const hosts = useMemo(() => {
    let allHosts = [];
    
    // Normalizzazione dei dati
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

    let filteredHosts = allHosts;

    // 1. Filtro per Cliente
    if (selectedClient && selectedClient !== '') {
      filteredHosts = filteredHosts.filter(host => host.folder === selectedClient);
    }

    // 2. Filtro per Ricerca Nome (NUOVO)
    if (searchTerm && searchTerm.trim() !== '') {
      const lowerTerm = searchTerm.toLowerCase();
      filteredHosts = filteredHosts.filter(host => 
        host.id.toLowerCase().includes(lowerTerm)
      );
    }

    return filteredHosts;
  }, [data, selectedClient, searchTerm]);

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

      <div className="host-config__filters" style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        
        {/* NUOVO: Input di Ricerca */}
        <div className="host-config__filter-group" style={{ flex: '1 1 300px' }}>
          <label className="host-config__label" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Cerca Host
          </label>
          <input 
            type="text" 
            placeholder="Digita nome host..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '1rem'
            }}
          />
        </div>

        {/* Selettore Cliente */}
        <div className="host-config__filter-group" style={{ flex: '1 1 300px' }}>
          <label className="host-config__label" htmlFor="client-selector">
            Filtra per Cliente
          </label>
          <ClientSelector
            id="client-selector"
            selectedClient={selectedClient}
            setSelectedClient={setSelectedClient}
          />
        </div>

        {/* Pulsante Reset (aggiornato) */}
        {(selectedClient || searchTerm) && (
          <button
            onClick={() => {
              setSelectedClient('');
              setSearchTerm('');
            }}
            className="host-config__button host-config__button--secondary"
            style={{ height: '38px', marginBottom: '2px' }}
          >
            Resetta filtri
          </button>
        )}
      </div>

      <div className="host-config__count">
        Trovati {hosts.length} host
        {selectedClient && ` nel cliente "${selectedClient}"`}
        {searchTerm && ` corrispondenti a "${searchTerm}"`}
      </div>

      <div className="host-config__grid">
        {hosts.length > 0 ? (
          hosts.map(host => (
            <div key={host.id} className="host-config__card">
              <h3 className="host-config__card-title">{host.id}</h3>
              <p className="host-config__card-meta">
                Cliente: {host.folder}
              </p>
            </div>
          ))
        ) : (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#666' }}>
            Nessun host trovato con questi filtri.
          </div>
        )}
      </div>
    </div>
  );
};

export default HostConfig;