import React, { useMemo } from 'react';
import { useApi } from '../hooks/useApi';
import '../styles/dashboard.css';
import Loader from '../components/Loader';

const Dashboard = () => {
    const { data: stats, loading, error, fromCache } = useApi('stats');
    const { data: downtimeData } = useApi('downtimes');
    
    // Calcola i downtime attualmente attivi
    const activeDowntimes = useMemo(() => {
        if (!downtimeData?.downtimes) return 0;
        
        const now = new Date();
        return downtimeData.downtimes.filter(dt => {
            // Controlla se il downtime è attualmente attivo
            const startTime = dt.extensions?.start_time ? new Date(dt.extensions.start_time) : null;
            const endTime = dt.extensions?.end_time ? new Date(dt.extensions.end_time) : null;
            
            if (!startTime || !endTime) return false;
            
            return startTime <= now && endTime >= now;
        }).length;
    }, [downtimeData]);
    
    if (loading) {
        return (
            <div className="dashboard-container">
                <Loader text="Caricamento statistiche..." />
            </div>
        );
    }

    if (error) {
        return <div className="dashboard-container">Errore nel caricamento: {error}</div>;
    }

    return (
        <div className="dashboard-container">
            <h1>Dashboard</h1>
            {fromCache && (
                <div className="cache-notification">
                    <i>ℹ️</i> Dati caricati dalla cache
                </div>
            )}
            <div className="stats-container">
                <div className="stat-card">
                    <h2 className="stat-title">Host Totali</h2>
                    <p className="stat-value">{stats ? stats.totalHosts : '...'}</p>
                </div>
                <div className="stat-card">
                    <h2 className="stat-title">Downtime Attivi</h2>
                    <p className="stat-value">{activeDowntimes}</p>
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