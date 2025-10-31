// Salva come: src/pages/Dashboard.jsx

import React from 'react';
import '../styles/dashboard.css';
import { useApi } from '../hooks/useApi'; // Importa l'hook API
import Loader from '../components/Loader'; // <-- 1. IMPORTA IL LOADER

const Dashboard = () => {
    // Usa l'hook per chiamare l'endpoint /api/stats
    const { data: stats, loading, error } = useApi('/api/stats');

    // <-- 2. USA IL LOADER QUI -->
    if (loading) {
        return (
            <div className="dashboard-container">
                <Loader text="Caricamento statistiche..." />
            </div>
        );
    }

    if (error) {
        return <div className="dashboard-container">Errore nel caricamento: {error.message}</div>;
    }

    // Una volta caricati i dati, mostrali
    return (
        <div className="dashboard-container">
            <h1 className="dashboard-title">Dashboard</h1>
            <div className="stats-container">
                <div className="stat-card">
                    <h2 className="stat-title">Host Totali</h2>
                    {/* Usa i dati dall'API, con fallback '...' */}
                    <p className="stat-value">{stats ? stats.totalHosts : '...'}</p>
                </div>
                <div className="stat-card">
                    <h2 className="stat-title">Downtime Attivi</h2>
                    {/* Usa i dati dall'API, con fallback '...' */}
                    <p className="stat-value">{stats ? stats.activeDowntimes : '...'}</p>
                </div>
            </div>
            
            <div className="welcome-card">
                <h2>Benvenuto nel Gestore Downtime di Checkmk</h2>
                <p>
                    Usa il menu a sinistra per programmare nuovi downtime o visualizzare quelli esistenti.
                </p>
                <ul>
                    <li><b>Programma Downtime:</b> Seleziona host, giorni e orari per impostare un nuovo downtime.</li>
                    <li><b>Downtime Esistenti:</b> Visualizza e gestisci i downtime attualmente attivi.</li>
                </ul>
            </div>
        </div>
    );
};

export default Dashboard;