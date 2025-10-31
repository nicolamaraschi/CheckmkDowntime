import React from 'react';
import { useApi } from '../hooks/useApi';
import '../styles/existingDowntimes.css';

const ExistingDowntimes = () => {
    const { data: downtimes, loading, error } = useApi('/api/downtimes');

    // Gestione personalizzata dell'errore 404
    if (error && error.message.includes('404')) {
        return (
            <div className="downtime-container">
                <h1>Downtime Esistenti</h1>
                <div className="error-card">
                    <h2>API Non Trovata (Errore 404)</h2>
                    <p>
                        Impossibile caricare i downtime esistenti. L'endpoint <code>/api/downtimes</code>
                        non è al momento disponibile sul server.
                    </p>
                    <p>
                        Questo è probabilmente un problema di configurazione del backend (<code>routes.py</code>)
                        che dovrà essere corretto.
                    </p>
                </div>
            </div>
        );
    }

    // Gestione altri errori
    if (error) {
        return <div className="downtime-container">Errore: {error.message}</div>;
    }

    // Gestione caricamento
    if (loading) {
        return <div className="downtime-container">Caricamento downtime...</div>;
    }

    // Se i dati arrivano (quando l'API sarà corretta)
    return (
        <div className="downtime-container">
            <h1>Downtime Esistenti</h1>
            <table className="downtime-table">
                <thead>
                    <tr>
                        <th>Host</th>
                        <th>Inizio</th>
                        <th>Fine</th>
                        <th>Autore</th>
                        <th>Commento</th>
                        {/* <th>Azioni</th> */}
                    </tr>
                </thead>
                <tbody>
                    {downtimes && downtimes.length > 0 ? (
                        downtimes.map((dt) => (
                            <tr key={dt.id}>
                                <td>{dt.host_name}</td>
                                <td>{new Date(dt.start_time).toLocaleString()}</td>
                                <td>{new Date(dt.end_time).toLocaleString()}</td>
                                <td>{dt.created_by}</td>
                                <td>{dt.comment}</td>
                                {/* <td><button className="delete-btn">Elimina</button></td> */}
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="5">Nessun downtime attivo trovato.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default ExistingDowntimes;