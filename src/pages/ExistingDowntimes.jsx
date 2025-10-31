import React from 'react';
import { useApi } from '../hooks/useApi';
import '../styles/existingDowntimes.css';
import Loader from '../components/Loader';

const ExistingDowntimes = () => {
    const { data, loading, error, fromCache } = useApi('downtimes');

    if (loading) {
        return (
            <div className="downtime-container">
                <h1>Downtime Esistenti</h1>
                <Loader text="Caricamento downtimes..." />
            </div>
        );
    }

    if (error) {
        return (
            <div className="downtime-container">
                <h1>Downtime Esistenti</h1>
                <div className="error-card">
                    <h2>Errore nel caricamento</h2>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    const downtimes = data?.downtimes || [];

    return (
        <div className="downtime-container">
            <h1>Downtime Esistenti</h1>
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
            
            {downtimes.length === 0 ? (
                <div style={{
                    padding: '20px',
                    textAlign: 'center',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    marginTop: '20px'
                }}>
                    <p>Nessun downtime attivo trovato.</p>
                </div>
            ) : (
                <table className="downtime-table">
                    <thead>
                        <tr>
                            <th>Host</th>
                            <th>Inizio</th>
                            <th>Fine</th>
                            <th>Autore</th>
                            <th>Commento</th>
                        </tr>
                    </thead>
                    <tbody>
                        {downtimes.map((dt, idx) => (
                            <tr key={idx}>
                                <td>{dt.extensions?.host_name || 'N/A'}</td>
                                <td>{dt.extensions?.start_time ? new Date(dt.extensions.start_time).toLocaleString() : 'N/A'}</td>
                                <td>{dt.extensions?.end_time ? new Date(dt.extensions.end_time).toLocaleString() : 'N/A'}</td>
                                <td>{dt.extensions?.author || 'N/A'}</td>
                                <td>{dt.extensions?.comment || 'N/A'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default ExistingDowntimes;
