import React, { useState, useEffect, useCallback } from 'react';
import { useApi } from '../hooks/useApi';
import '../styles/existingDowntimes.css';

const ExistingDowntimes = () => {
  const [downtimes, setDowntimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const api = useApi();

  const fetchDowntimes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get('/downtimes');
      setDowntimes(data || []);
    } catch (err) {
      console.error("Error fetching downtimes:", err);
      if (err.message.includes('405')) {
        setError("L'API per visualizzare i downtime non è ancora disponibile.");
      } else {
        setError(err.message || "Si è verificato un errore durante il recupero dei downtime");
      }
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchDowntimes();
  }, [fetchDowntimes]);

  const handleDelete = async (downtimeId) => {
    if (window.confirm("Sei sicuro di voler cancellare questo downtime?")) {
      try {
        await api.del(`/downtime/${downtimeId}`);
        // Refresh the list after deletion
        fetchDowntimes();
      } catch (err) {
        console.error("Error deleting downtime:", err);
        setError(err.message || "Errore nella cancellazione del downtime.");
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('it-IT', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const getDowntimeStatus = (startTime, endTime) => {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (now < start) return 'Pianificato';
    if (now > end) return 'Scaduto';
    return 'Attivo';
  };

  return (
    <div className="existing-downtimes-container">
      <h1>Downtime Pianificati</h1>
      
      {loading ? (
        <div className="loading-spinner">Caricamento downtime in corso...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : downtimes.length === 0 ? (
        <div className="no-downtimes">
          <p>Nessun downtime pianificato trovato.</p>
        </div>
      ) : (
        <>
          <div className="downtime-count">{downtimes.length} downtime trovati</div>
          <div className="downtimes-table-container">
            <table className="downtimes-table">
              <thead>
                <tr>
                  <th>Host</th>
                  <th>Inizio</th>
                  <th>Fine</th>
                  <th>Commento</th>
                  <th>Stato</th>
                  <th>Azione</th>
                </tr>
              </thead>
              <tbody>
                {downtimes.map((downtime) => {
                  const status = getDowntimeStatus(downtime.start_time, downtime.end_time);
                  return (
                    <tr key={downtime.id}>
                      <td>{downtime.host_name}</td>
                      <td>{formatDate(downtime.start_time)}</td>
                      <td>{formatDate(downtime.end_time)}</td>
                      <td>{downtime.comment}</td>
                      <td>
                        <span className={`status-badge status-${status.toLowerCase()}`}>
                          {status}
                        </span>
                      </td>
                      <td>
                        <button 
                          onClick={() => handleDelete(downtime.id)}
                          className="delete-button"
                          disabled={status === 'Scaduto'}
                        >
                          Cancella
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default ExistingDowntimes;
