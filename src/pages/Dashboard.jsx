import React, { useMemo } from 'react'; // 1. Importa useMemo
import { FaClock, FaCheckCircle, FaExclamationTriangle, FaList } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import Loader from '../components/Loader';
import { useApi } from '../hooks/useApi';
import '../styles/dashboard.css';

const Dashboard = () => {
  // 2. CORRETTO: Creiamo un oggetto stabile per le opzioni
  const statsOptions = useMemo(() => ({}), []);
  const recentOptions = useMemo(() => ({}), []);

  // 3. CORRETTO: Passiamo l'oggetto stabile
  const { data: stats, loading: statsLoading, error: statsError } = useApi('/dashboard/stats', statsOptions, 'stats');
  const { data: recent, loading: recentLoading, error: recentError } = useApi('/downtimes?limit=5', recentOptions, 'recent_downtimes');

  const StatCard = ({ icon, title, value, status, loading }) => {
    if (loading) {
      return (
        <div className="dashboard-card stat-card loading">
          <h3>{title}</h3>
          <div className="stat-value">...</div>
        </div>
      );
    }
    return (
      <div className={`dashboard-card stat-card ${status || ''}`}>
        {icon}
        <h3>{title}</h3>
        <p className="stat-value">{value}</p>
      </div>
    );
  };

  const RecentDowntimes = ({ downtimes, loading, error }) => {
    if (loading) {
      return (
        <div className="dashboard-card">
          <h3>Ultimi Downtime Pianificati</h3>
          <Loader message="Caricamento downtimes recenti..." />
        </div>
      );
    }

    if (error) {
      return (
        <div className="dashboard-card error-card">
          <h3>Ultimi Downtime Pianificati</h3>
          <p className="error-message">Errore nel caricamento: {error.message}</p>
        </div>
      );
    }

    if (!downtimes || downtimes.length === 0) {
      return (
        <div className="dashboard-card">
          <h3>Ultimi Downtime Pianificati</h3>
          <p>Nessun downtime recente trovato.</p>
        </div>
      );
    }

    return (
      <div className="dashboard-card">
        <h3>Ultimi Downtime Pianificati</h3>
        <ul className="recent-downtimes-list">
          {downtimes.map((dt) => (
            <li key={dt.downtime_id}>
              <span className="host-name">{dt.host_name}</span>
              <span className="client-name">({dt.client_name || 'N/D'})</span>
              <span className="downtime-comment">{dt.comment}</span>
              <span className="downtime-author"> - {dt.author}</span>
            </li>
          ))}
        </ul>
        <Link to="/existing" className="view-all-link">
          Vedi tutti
        </Link>
      </div>
    );
  };

  return (
    <div className="dashboard-page">
      <h2>Dashboard</h2>
      
      {statsError && (
        <div className="dashboard-card error-card">
          <h3>Errore Statistiche</h3>
          <p className="error-message">{statsError.message}</p>
        </div>
      )}

      <div className="stats-grid">
        <StatCard
          icon={<FaClock />}
          title="Downtime Attivi"
          value={stats?.active_downtimes ?? 'N/D'}
          status="info"
          loading={statsLoading}
        />
        <StatCard
          icon={<FaCheckCircle />}
          title="Downtime Pianificati (Oggi)"
          value={stats?.scheduled_today ?? 'N/D'}
          status="success"
          loading={statsLoading}
        />
        <StatCard
          icon={<FaExclamationTriangle />}
          title="Host senza Cliente"
          value={stats?.unassigned_hosts ?? 'N/D'}
          status={stats?.unassigned_hosts > 0 ? 'warning' : 'success'}
          loading={statsLoading}
        />
        <StatCard
          icon={<FaList />}
          title="Totale Downtime (Ricorrenti)"
          value={stats?.total_recurring ?? 'N/D'}
          status="info"
          loading={statsLoading}
        />
      </div>

      <div className="quick-links">
        <Link to="/schedule" className="quick-link-button">
          <FaClock />
          <span>Pianifica Nuovo Downtime</span>
        </Link>
        <Link to="/hosts" className="quick-link-button">
          <FaList />
          <span>Gestisci Host</span>
        </Link>
      </div>

      <RecentDowntimes 
        downtimes={recent} 
        loading={recentLoading} 
        error={recentError} 
      />
    </div>
  );
};

export default Dashboard;