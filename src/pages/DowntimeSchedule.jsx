import React, { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import HostSelector from '../components/HostSelector';
import WeekdayPicker from '../components/WeekdayPicker';
import TimePicker from '../components/TimePicker';
import '../styles/downtimeSchedule.css';
import Loader from '../components/Loader';

const DowntimeSchedule = () => {
    const [selectedHost, setSelectedHost] = useState('');
    const [weekdays, setWeekdays] = useState([]);
    const [startTime, setStartTime] = useState('00:00');
    const [endTime, setEndTime] = useState('01:00');
    const [recurrence, setRecurrence] = useState(0);
    const [commento, setCommento] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    
    const { token } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedHost) {
            setError("Per favore, seleziona un host.");
            setSuccess(null);
            return;
        }
        if (weekdays.length === 0) {
            setError("Per favore, seleziona almeno un giorno.");
            setSuccess(null);
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        const payload = {
            host: selectedHost,
            giorni: weekdays,
            startTime: startTime,
            endTime: endTime,
            ripeti: recurrence,
            commento: commento || "Manutenzione programmata"
        };

        try {
            const response = await fetch('/api/schedule', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.detail || `Errore server: ${response.status}`);
            }

            const errorsInResponses = result.responses.filter(r => r !== 'Done');
            if (errorsInResponses.length > 0) {
                const firstError = errorsInResponses[0];
                setError(`Operazione completata con ${errorsInResponses.length} errori. Primo errore: ${firstError}`);
            } else {
                setSuccess(`✓ Downtime programmato con successo per ${selectedHost}! (${result.responses.length} slot creati)`);
                setSelectedHost('');
                setWeekdays([]);
                setRecurrence(0);
                setCommento('');
            }

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="downtime-container">
                <h1>⏳ Programmazione in corso...</h1>
                <Loader text="Creazione downtime in corso. Questo può richiedere fino a 30 secondi." />
                <div style={{ 
                    textAlign: 'center', 
                    marginTop: '20px', 
                    color: '#6c757d',
                    fontSize: '0.95rem'
                }}>
                    <p>Non chiudere questa pagina.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="downtime-container">
            <h1>📅 Programma Downtime</h1>
            
            <form className="downtime-form" onSubmit={handleSubmit}>
                
                <div className="form-group">
                    <label className="required-field">Host</label>
                    <HostSelector selectedHost={selectedHost} setSelectedHost={setSelectedHost} />
                    {selectedHost && (
                        <span className="info-badge">Host selezionato: {selectedHost}</span>
                    )}
                </div>

                <div className="form-group">
                    <label className="required-field">Giorni della settimana</label>
                    <WeekdayPicker value={weekdays} onChange={setWeekdays} />
                    {weekdays.length > 0 && (
                        <span className="info-badge">{weekdays.length} giorn{weekdays.length === 1 ? 'o' : 'i'} selezionat{weekdays.length === 1 ? 'o' : 'i'}</span>
                    )}
                </div>

                <div className="time-group">
                    <div className="form-group">
                        <label className="required-field">Ora Inizio (HH:MM)</label>
                        <TimePicker value={startTime} onChange={setStartTime} />
                    </div>
                    <div className="form-group">
                        <label className="required-field">Ora Fine (HH:MM)</label>
                        <TimePicker value={endTime} onChange={setEndTime} />
                    </div>
                </div>

                <div className="form-group">
                    <label>Ripeti per i prossimi X giorni</label>
                    <input 
                        type="number" 
                        min="0" 
                        max="365"
                        value={recurrence} 
                        onChange={(e) => setRecurrence(parseInt(e.target.value))}
                        placeholder="0 = solo oggi"
                    />
                    <span className="info-badge">
                        {recurrence === 0 ? 'Solo oggi' : `Si ripeterà per ${recurrence} giorni`}
                    </span>
                </div>

                <div className="form-group">
                    <label>Commento</label>
                    <input 
                        type="text" 
                        value={commento} 
                        onChange={(e) => setCommento(e.target.value)}
                        placeholder="Es. Manutenzione programmata"
                        maxLength={200}
                    />
                </div>

                <div className="form-actions">
                    <button type="submit" className="submit-btn">
                        🚀 Programma Downtime
                    </button>
                </div>

                {success && <div className="form-message success-message">{success}</div>}
                {error && <div className="form-message error-message">{error}</div>}
            </form>
        </div>
    );
};

export default DowntimeSchedule;
