import React from 'react';
import { useApi } from '../hooks/useApi';
import '../styles/hostConfig.css';
import Loader from '../components/Loader';

const HostConfig = () => {
  // Usa la versione corretta dell'endpoint (senza /api)
  const { data, loading, error } = useApi('hosts');
  
  // Stato di caricamento
  if (loading) {
    return (
      <div className="host-config-container">
        <h1>Configurazione Host</h1>
        <Loader text="Caricamento host in corso..." />
      </div>
    );
  }
  
  // Gestione errori
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

  // CORREZIONE: Gestisci i diversi formati della risposta API
  // La risposta potrebbe essere { hosts: [...] } o direttamente l'array di hosts
  let hosts = [];
  if (data) {
    if (Array.isArray(data)) {
      // Se data è direttamente un array
      hosts = data;
    } else if (data.hosts && Array.isArray(data.hosts)) {
      // Se data ha una proprietà hosts che è un array
      hosts = data.hosts;
    } else {
      // Prova a ispezionare altre proprietà se disponibili
      console.log("Formato risposta API inatteso:", data);
    }
  }

  return (
    <div className="host-config-container">
      <h1>Configurazione Host</h1>
      
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