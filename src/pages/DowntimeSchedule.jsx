import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import '../styles/downtimeSchedule.css';

const DowntimeSchedule = () => {
  const [hosts, setHosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [selectedHost, setSelectedHost] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [comment, setComment] = useState('');
  
  const navigate = useNavigate();
  const api = useApi();

  // Set default dates and times
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toTimeString().slice(0, 5);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    setStartDate(today);
    setStartTime(now);
    setEndDate(tomorrow.toISOString().split('T')[0]);
    setEndTime(now);
  }, []);

  // Fetch hosts
  const fetchHosts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get('/hosts');
      setHosts(data || []);
      if (data && data.length > 0) {
        setSelectedHost(data[0]);
      }
    } catch (err) {
      console.error("Error fetching hosts:", err);
      setError(err.message || "Si è verificato un errore durante il recupero degli host");
    } finally {
      setLoading(false);
    }
  }, [api]); // api is a dependency

  useEffect(() => {
    fetchHosts();
  }, [fetchHosts]);

  const formatISODateTime = (date, time) => {
    // Assuming local time is the intended timezone for the API
    return `${date}T${time}:00`;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedHost || !startDate || !startTime || !endDate || !endTime || !comment) {
      setError("Tutti i campi sono obbligatori");
      return;
    }
    
    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${endDate}T${endTime}`);
    
    if (endDateTime <= startDateTime) {
      setError("La data/ora di fine deve essere successiva alla data/ora di inizio");
      return;
    }
    
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      const downtimeData = {
        host_name: selectedHost,
        start_time: formatISODateTime(startDate, startTime),
        end_time: formatISODateTime(endDate, endTime),
        comment: comment
      };

      const result = await api.post('/downtime', downtimeData);
      console.log("Downtime scheduled:", result);
      
      setSuccess("Downtime programmato con successo!");
      setComment('');
      
      setTimeout(() => {
        navigate('/downtimes');
      }, 2000);
      
    } catch (err) {
      console.error("Error scheduling downtime:", err);
      setError(err.message || "Si è verificato un errore durante la programmazione del downtime");
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <div className="downtime-schedule-container">
      <h1>Pianifica Downtime</h1>
      
      {loading ? (
        <div className="loading-spinner">Caricamento...</div>
      ) : (
        <form className="downtime-form" onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          
          <div className="form-group">
            <label htmlFor="host">Host</label>
            <select 
              id="host" 
              value={selectedHost}
              onChange={(e) => setSelectedHost(e.target.value)}
              required
              className="form-control"
            >
              {hosts.map(host => (
                <option key={host} value={host}>
                  {host}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="start-date">Data inizio</label>
              <input 
                id="start-date" 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="form-control"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="start-time">Ora inizio</label>
              <input 
                id="start-time" 
                type="time" 
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="form-control"
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="end-date">Data fine</label>
              <input 
                id="end-date" 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="form-control"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="end-time">Ora fine</label>
              <input 
                id="end-time" 
                type="time" 
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="form-control"
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="comment">Commento</label>
            <textarea 
              id="comment" 
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Inserisci il motivo del downtime"
              required
              className="form-control"
            />
          </div>
          
          <button 
            type="submit" 
            className="submit-button"
            disabled={submitting}
          >
            {submitting ? 'Pianificazione in corso...' : 'Pianifica Downtime'}
          </button>
        </form>
      )}
    </div>
  );
};

export default DowntimeSchedule;
