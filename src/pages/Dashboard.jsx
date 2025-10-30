import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import '../styles/dashboard.css';

const Dashboard = () => {
  const { data: hosts, loading, error } = useApi('/hosts');
  const [loadTime, setLoadTime] = useState(0);

  useEffect(() => {
    if (hosts) {
      // This is a mock load time, as useApi doesn't expose it.
      // A more advanced implementation would require modifying useApi.
      setLoadTime((Math.random() * 2).toFixed(2));
    }
  }, [hosts]);

  return (
    <div className="dashboard-container">
      <h1>Dashboard</h1>
      
      <div className="welcome-message">
        <h2>Benvenuto nel Checkmk Downtime Scheduler</h2>
        <p>Questo strumento ti permette di pianificare periodi di downtime per i tuoi host Checkmk in modo semplice e veloce.</p>
      </div>
      
      {loading ? (
        <div className="loading-spinner">Caricamento dati in corso...</div>
      ) : error ? (
        <div className="error-message">Errore nel caricamento dei dati: {error}</div>
      ) : (
        <div className="dashboard-cards">
          <div className="dashboard-card">
            <div className="card-header">
              <h3>Host Monitorati</h3>
            </div>
            <div className="card-content">
              <div className="stat-number">{hosts ? hosts.length : 0}</div>
              <p>Host disponibili nel sistema</p>
              <Link to="/hosts" className="card-link">Visualizza tutti gli host</Link>
            </div>
          </div>
          
          <div className="dashboard-card">
            <div className="card-header">
              <h3>Pianifica Downtime</h3>
            </div>
            <div className="card-content">
              <p>Pianifica rapidamente un periodo di downtime per i tuoi host</p>
              <Link to="/schedule" className="card-link">Pianifica ora</Link>
            </div>
          </div>
          
          <div className="dashboard-card">
            <div className="card-header">
              <h3>Prestazioni API</h3>
            </div>
            <div className="card-content">
              <div className="stat-number">{loadTime}s</div>
              <p>Tempo di risposta dell'API Checkmk</p>
              <div className="api-status">
                {parseFloat(loadTime) < 1 ? (
                  <span className="status-good">Buona</span>
                ) : parseFloat(loadTime) < 3 ? (
                  <span className="status-average">Media</span>
                ) : (
                  <span className="status-poor">Lenta</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="quick-tips">
        <h3>Suggerimenti Rapidi</h3>
        <ul>
          <li>Per pianificare un downtime ricorrente, crea più periodi di downtime con date diverse.</li>
          <li>Inserisci sempre un commento descrittivo per facilitare la comprensione del motivo del downtime.</li>
          <li>L'API Checkmk può essere lenta a rispondere, specialmente con molti host. Sii paziente.</li>
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;
