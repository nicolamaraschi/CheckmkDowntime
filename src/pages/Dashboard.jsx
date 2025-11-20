import React from 'react';
import { useApi } from '../hooks/useApi';
import { useNavigate } from 'react-router-dom';
import '../styles/dashboard.css';

// Componente riutilizzabile per le card
const StatCard = ({ title, value, loading, error, icon, colorClass }) => {
    let content;
    if (loading) {
        content = <div className="stat-value-loading"></div>;
    } else if (error) {
        content = <span className="stat-error">Errore</span>;
    } else {
        content = value;
    }

    return (
        <div className="card stat-card">
            <div className={`stat-icon-wrapper ${colorClass}`}>
                {icon}
            </div>
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
        <div className="card action-card">
            <div className="card-header">
                <div className="stat-icon-wrapper bg-yellow">
                    ⚡
                </div>
                <h3>Azioni Rapide</h3>
            </div>
            <div className="action-buttons-container">
                <button
                    className="btn btn-primary w-full"
                    onClick={() => navigate('/schedule')}
                >
                    📅 Programma Downtime
                </button>
                <button
                    className="btn btn-secondary w-full"
                    onClick={() => navigate('/downtimes')}
                >
                    🔍 Vedi Esistenti
                </button>
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
            <header className="page-header">
                <h1>Dashboard</h1>
                <p className="page-subtitle">Panoramica dello stato del sistema.</p>
            </header>

            <div className="stats-grid">
                <StatCard
                    title="Host Totali"
                    value={totalHosts}
                    loading={statsLoading}
                    error={statsError}
                    icon="🖥️"
                    colorClass="bg-blue"
                />

                <StatCard
                    title="Clienti Totali"
                    value={totalClients}
                    loading={clientsLoading}
                    error={clientsError}
                    icon="🏢"
                    colorClass="bg-purple"
                />

                <QuickActions />
            </div>
        </div>
    );
};

export default Dashboard;