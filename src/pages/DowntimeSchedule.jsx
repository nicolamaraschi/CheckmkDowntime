import React, { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import HostSelector from '../components/HostSelector';
import WeekdayPicker from '../components/WeekdayPicker';
import TimePicker from '../components/TimePicker';
import '../styles/downtimeSchedule.css';
import '../styles/loader.css';
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
            // Corretto URL dell'API con prefisso /api
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
                setError(`Operazione completata, ma con ${errorsInResponses.length} errori. (Es: ${firstError})`);
            } else {
                setSuccess(`Downtime programmato con successo per ${selectedHost}!`);
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
                <h1>Programmazione Downtime in corso</h1>
                <Loader text="Programmazione in corso, attendere prego... (fino a 30s)" />
            </div>
        );
    }

    return (
        <div className="downtime-container">
            <h1>Programma Downtime</h1>
            <form className="downtime-form" onSubmit={handleSubmit}>
                
                <div className="form-group">
                    <label>Host</label>
                    <HostSelector selectedHost={selectedHost} setSelectedHost={setSelectedHost} />
                </div>

                <div className="form-group">
                    <label>Giorni della settimana</label>
                    <WeekdayPicker value={weekdays} onChange={setWeekdays} />
                </div>

                <div className="time-group">
                    <div className="form-group">
                        <label>Ora Inizio (HH:MM)</label>
                        <TimePicker value={startTime} onChange={setStartTime} />
                    </div>
                    <div className="form-group">
                        <label>Ora Fine (HH:MM)</label>
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
                    />
                </div>

                <div className="form-group">
                    <label>Commento</label>
                    <input 
                        type="text" 
                        value={commento} 
                        onChange={(e) => setCommento(e.target.value)}
                        placeholder="Es. Manutenzione programmata"
                    />
                </div>

                <div className="form-actions">
                    <button type="submit" className="submit-btn">
                        Programma Downtime
                    </button>
                </div>

                {success && <div className="form-message success-message">{success}</div>}
                {error && <div className="form-message error-message">{error}</div>}
            </form>
        </div>
    );
};

export default DowntimeSchedule;