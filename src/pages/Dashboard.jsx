import React from 'react';
import { useApi } from '../hooks/useApi';
import { useNavigate } from 'react-router-dom'; // Importiamo useNavigate
import Loader from '../components/Loader';
// Rimosso import TestApi
import '../styles/dashboard.css';

// Componente riutilizzabile per le card
const StatCard = ({ title, value, loading, error, icon }) => {
    let content;
    if (loading) {
        content = <div className="stat-value-loading"></div>;
    } else if (error) {
        content = <span className="stat-error">Errore</span>;
    } else {
        content = value;
    }

    return (
        <div className="stat-card">
            <div className="stat-icon">{icon}</div>
            <div className="stat-info">
                <div className="stat-title">{title}</div>
                <div className="stat-value">{content}</div>
            </div>
        </div>
    );
};

// Componente per le Azioni Rapide
const QuickActions = () => {
    const navigate = useNavigate();

    return (
        <div className="stat-card action-card">
             <div className="stat-icon">⚡</div>
             <div className="stat-info">
                <div className="stat-title">AZIONI RAPIDE</div>
                <div className="action-buttons-container">
                    <button 
                        className="action-button primary"
                        onClick={() => navigate('/schedule')}
                    >
                        📅 Programma
                    </button>
                    <button 
                        className="action-button secondary"
                        onClick={() => navigate('/downtimes')}
                    >
                        🔍 Vedi Esistenti
                    </button>
                </div>
            </div>
        </div>
    );
};


const Dashboard = () => {
    // Chiamata 1: per Host Totali (da /stats)
    const { data: statsData, loading: statsLoading, error: statsError } = useApi('stats');
    
    // Chiamata 2: per Clienti Totali (da /clients)
    const { data: clientsData, loading: clientsLoading, error: clientsError } = useApi('clients');

    const totalHosts = statsData?.totalHosts;
    const totalClients = clientsData?.length; 

    return (
        <div className="dashboard-container">
            <h1>📊 Dashboard Principale</h1>
            <p className="dashboard-subtitle">Panoramica dello stato del sistema e dei dati di Checkmk.</p>
            
            <div className="stats-container three-cards">
                <StatCard 
                    title="Host Totali"
                    value={totalHosts}
                    loading={statsLoading}
                    error={statsError}
                    icon="🖥️"
                />
                
                <StatCard 
                    title="Clienti Totali"
                    value={totalClients}
                    loading={clientsLoading}
                    error={clientsError}
                    icon="🏢"
                />

                <QuickActions />
            </div>

            {/* --- SEZIONE API TEST RIMOSSA --- */}
            
        </div>
    );
};

export default Dashboard;