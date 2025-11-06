import React, { useState } from 'react';
import ClientSelector from '../components/ClientSelector';
import HostSelector from '../components/HostSelector';
import TimePicker from '../components/TimePicker';
import WeekdayPicker from '../components/WeekdayPicker';
import { useApiCache } from '../contexts/ApiCacheContext';
import { useApi } from '../hooks/useApi';
import '../styles/downtimeSchedule.css';
import Loader from '../components/Loader';

const DowntimeSchedule = () => {
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedHosts, setSelectedHosts] = useState([]);
  const [downtimeType, setDowntimeType] = useState('one-time');
  const [startTime, setStartTime] = useState('00:00');
  const [endTime, setEndTime] = useState('01:00');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedDays, setSelectedDays] = useState([]);
  const [comment, setComment] = useState('Scheduled downtime via Web UI');
  const [message, setMessage] = useState({ type: '', text: '' });

  const { clearCache } = useApiCache();

  // Hook per la chiamata API, impostato su 'manual'
  const { loading, error, postData } = useApi('/downtimes', { manual: true });

  const handleClientChange = (client) => {
    setSelectedClient(client);
    setSelectedHosts([]); // Resetta gli host quando il cliente cambia
  };

  const handleHostChange = (hosts) => {
    setSelectedHosts(hosts);
  };

  const handleDowntimeTypeChange = (e) => {
    setDowntimeType(e.target.value);
  };

  const handleTimeChange = (type, time) => {
    if (type === 'start') {
      setStartTime(time);
    } else {
      setEndTime(time);
    }
  };

  const handleDateChange = (type, date) => {
    if (type === 'start') {
      setStartDate(date);
    } else {
      setEndDate(date);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!selectedClient || selectedHosts.length === 0) {
      setMessage({ type: 'error', text: 'Per favore, seleziona un cliente e almeno un host.' });
      return;
    }

    const author = 'webapp_user'; // Utente statico

    let payload;
    const basePayload = {
      client_name: selectedClient.value,
      host_names: selectedHosts.map(h => h.value),
      start_time: startTime,
      end_time: endTime,
      comment: comment,
      author: author,
    };

    if (downtimeType === 'one-time') {
      payload = {
        ...basePayload,
        downtime_type: 'one-time',
        start_date: startDate,
        end_date: endDate,
      };
    } else { // recurring
      if (selectedDays.length === 0) {
        setMessage({ type: 'error', text: 'Per favore, seleziona almeno un giorno per un downtime ricorrente.' });
        return;
      }
      payload = {
        ...basePayload,
        downtime_type: 'recurring',
        weekdays: selectedDays,
      };
    }

    try {
      const response = await postData(payload); // Usa la funzione postData dall'hook
      if (response && response.success) {
        setMessage({ type: 'success', text: 'Downtime pianificato con successo!' });
        // Pulisci la cache per aggiornare le altre viste
        clearCache('/downtimes');
        clearCache('/dashboard/stats');
        // Resetta il form
        setSelectedClient(null);
        setSelectedHosts([]);
        setComment('Scheduled downtime via Web UI');
      } else {
        throw new Error(response?.message || 'Errore sconosciuto dal server');
      }
    } catch (err) {
      // L'errore è già gestito dall'hook useApi, ma possiamo impostare un messaggio
      setMessage({ type: 'error', text: err.message || 'Impossibile pianificare il downtime.' });
    }
  };
  
  if (loading) {
    return <Loader message="Pianificazione downtime in corso..." />;
  }

  return (
    <div className="downtime-schedule-page">
      <h2>Pianifica un nuovo Downtime</h2>
      <p>Stai creando un downtime per il tuo account.</p>

      {message.text && (
        <div className={`message-banner ${message.type}`}>
          {message.text}
        </div>
      )}
      
      {error && (
        <div className="message-banner error">
          Errore API: {error.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="downtime-form">
        <div className="form-card">
          <h3>1. Seleziona Clienti e Host</h3>
          <div className="form-group">
            <label>Cliente</label>
            <ClientSelector 
              value={selectedClient} 
              onChange={handleClientChange} 
            />
          </div>
          <div className="form-group">
            <label>Host</label>
            <HostSelector
              clientId={selectedClient ? selectedClient.value : null}
              value={selectedHosts}
              onChange={handleHostChange}
              isDisabled={!selectedClient}
            />
          </div>
        </div>

        <div className="form-card">
          <h3>2. Configura Pianificazione</h3>
          <div className="form-group">
            <label>Tipo di Downtime</label>
            <select value={downtimeType} onChange={handleDowntimeTypeChange} className="form-control">
              <option value="one-time">Una volta</option>
              <option value="recurring">Ricorrente</option>
            </select>
          </div>

          <div className="time-range-selectors">
            <TimePicker label="Ora Inizio" value={startTime} onChange={(time) => handleTimeChange('start', time)} />
            <TimePicker label="Ora Fine" value={endTime} onChange={(time) => handleTimeChange('end', time)} />
          </div>

          {downtimeType === 'one-time' ? (
            <div className="date-range-selectors">
              <div className="form-group">
                <label htmlFor="start-date">Data Inizio</label>
                <input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => handleDateChange('start', e.target.value)}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label htmlFor="end-date">Data Fine</label>
                <input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => handleDateChange('end', e.target.value)}
                  className="form-control"
                />
              </div>
            </div>
          ) : (
            <WeekdayPicker selectedDays={selectedDays} onChange={setSelectedDays} />
          )}
        </div>

        <div className="form-card">
          <h3>3. Commento e Conferma</h3>
          <div className="form-group">
            <label htmlFor="comment">Commento</label>
            <input
              id="comment"
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="form-control"
              required
            />
          </div>
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Pianificazione...' : 'Pianifica Downtime'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DowntimeSchedule;