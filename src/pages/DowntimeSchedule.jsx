// Salva come: src/pages/DowntimeSchedule.jsx

import React, { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import HostSelector from '../components/HostSelector';
import WeekdayPicker from '../components/WeekdayPicker';
import TimePicker from '../components/TimePicker';
import RecurrencePicker from '../components/RecurrencePicker';
import '../styles/downtimeSchedule.css';
import '../styles/loader.css'; // <-- 1. IMPORTA LO STILE DEL LOADER

const DowntimeSchedule = () => {
    const [selectedHost, setSelectedHost] = useState('');
    const [weekdays, setWeekdays] = useState([]);
    const [startTime, setStartTime] = useState('00:00');
    const [endTime, setEndTime] = useState('01:00');
    const [recurrence, setRecurrence] = useState(0);
    const [commento, setCommento] = useState('');

    // --- 2. STATI PER GESTIRE IL CARICAMENTO E I MESSAGGI ---
    const [loading, setLoading] = useState(false); // Per il submit del form
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    
    const { getToken } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validazione
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

        // --- 3. IMPOSTA CARICAMENTO E RESETTA MESSAGGI ---
        setLoading(true);
        setError(null);
        setSuccess(null);

        const payload = {
            host: selectedHost,
            giorni: weekdays.map(day => day.value), // Es. [0, 1, 2]
            startTime: startTime,
            endTime: endTime,
            ripeti: recurrence,
            commento: commento
        };

        try {
            const token = await getToken();
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
                // Se l'API stessa fallisce (es. 500)
                throw new Error(result.detail || `Errore server: ${response.status}`);
            }

            // Se l'API ha successo (200) ma Checkmk ha restituito errori
            const errorsInResponses = result.responses.filter(r => r !== 'Done');
            if (errorsInResponses.length > 0) {
                const firstError = errorsInResponses[0];
                setError(`Operazione completata, ma con ${errorsInResponses.length} errori. (Es: ${firstError})`);
            } else {
                setSuccess(`Downtime (${result.responses.length}) programmati con successo per ${selectedHost}!`);
                // Resetta il form
                setSelectedHost('');
                setWeekdays([]);
                setRecurrence(0);
                setCommento('');
            }

        } catch (err) {
            setError(err.message);
        } finally {
            // --- 4. FERMA IL CARICAMENTO ---
            setLoading(false);
        }
    };

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
                    <WeekdayPicker selectedDays={weekdays} setSelectedDays={setWeekdays} />
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
                    <RecurrencePicker value={recurrence} onChange={setRecurrence} />
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

                {/* --- 5. BOTTONE E SPINNER DI CARICAMENTO --- */}
                <div className="form-actions">
                    <button type="submit" className="submit-btn" disabled={loading}>
                        {loading ? 'Programmazione in corso...' : 'Programma Downtime'}
                    </button>
                    
                    {loading && (
                        <div className="loader-spinner"></div>
                    )}
                </div>

                {/* Messaggi di stato */}
                {success && <div className="form-message success-message">{success}</div>}
                {error && <div className="form-message error-message">{error}</div>}

            </form>
        </div>
    );
};

export default DowntimeSchedule;