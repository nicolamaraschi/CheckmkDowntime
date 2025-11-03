import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthProvider';
import ClientSelector from '../components/ClientSelector';
import HostSelector from '../components/HostSelector';
import WeekdayPicker from '../components/WeekdayPicker';
import TimePicker from '../components/TimePicker';
import '../styles/downtimeSchedule.css';
import Loader from '../components/Loader';

const DowntimeSchedule = () => {
    const [selectedClient, setSelectedClient] = useState('');
    const [selectedHost, setSelectedHost] = useState('');
    const [weekdays, setWeekdays] = useState([]);
    const [startTime, setStartTime] = useState('00:00');
    const [endTime, setEndTime] = useState('01:00');
    
    // --- LOGICA PER LA DURATA ---
    const [durationValue, setDurationValue] = useState(1); // Es. "4"
    const [durationUnit, setDurationUnit] = useState('weeks'); // 'days', 'weeks', 'months'

    const [commento, setCommento] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const { token } = useAuth();

    // Reset selected host when client changes
    useEffect(() => {
        setSelectedHost('');
    }, [selectedClient]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedHost) {
            setError("Per favore, seleziona un host.");
            setSuccess(null);
            return;
        }
        if (weekdays.length === 0) {
            setError("Per favore, seleziona almeno un giorno della settimana.");
            setSuccess(null);
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        // --- CALCOLO DEI GIORNI TOTALI DA PASSARE AL BACKEND V1 ---
        let totalDays = 0;
        switch (durationUnit) {
            case 'weeks':
                totalDays = durationValue * 7;
                break;
            case 'months':
                totalDays = durationValue * 30; // Usiamo 30 giorni come approssimazione
                break;
            default: // 'days'
                totalDays = durationValue;
        }
        // Il backend si aspetta "0" se è solo per oggi
        const repeatDaysForBackend = totalDays > 0 ? totalDays - 1 : 0;

        const payload = {
            host: selectedHost,
            giorni: weekdays,
            startTime: startTime,
            endTime: endTime,
            ripeti: repeatDaysForBackend, // Invia il totale giorni calcolato
            commento: commento || "Manutenzione programmata"
        };

        try {
            // Usiamo il VECCHIO endpoint /api/schedule che contiene la logica del loop
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

            // La risposta V1 è un array di messaggi
            const errorsInResponses = result.responses.filter(r => r !== 'Done');
            if (errorsInResponses.length > 0) {
                const firstError = errorsInResponses[0];
                setError(`Operazione completata con ${errorsInResponses.length} errori. Primo errore: ${firstError}`);
            } else {
                setSuccess(`✓ Downtime programmato con successo per ${selectedHost}! (${result.responses.length} slot creati)`);
                // Reset del form
                setSelectedClient('');
                setSelectedHost('');
                setWeekdays([]);
                setDurationValue(1);
                setDurationUnit('weeks');
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

    // Funzione helper per il testo dell'info badge
    const getDurationText = () => {
        if (durationValue <= 0) return "Solo per oggi";
        let unitText = '';
        if (durationUnit === 'days') unitText = durationValue === 1 ? 'giorno' : 'giorni';
        if (durationUnit === 'weeks') unitText = durationValue === 1 ? 'settimana' : 'settimane';
        if (durationUnit === 'months') unitText = durationValue === 1 ? 'mese' : 'mesi';
        return `Si ripeterà per ${durationValue} ${unitText}`;
    };

    return (
        <div className="downtime-container">
            <h1>📅 Programma Downtime</h1>
            
            <form className="downtime-form" onSubmit={handleSubmit}>

                <div className="form-group">
                    <label className="required-field">Cliente</label>
                    <ClientSelector selectedClient={selectedClient} setSelectedClient={setSelectedClient} />
                    {selectedClient && (
                        <span className="info-badge">Cliente selezionato: {selectedClient}</span>
                    )}
                </div>

                <div className="form-group">
                    <label className="required-field">Host</label>
                    <HostSelector
                        selectedHost={selectedHost}
                        setSelectedHost={setSelectedHost}
                        selectedClient={selectedClient}
                    />
                    {selectedHost && (
                        <span className="info-badge">Host selezionato: {selectedHost}</span>
                    )}
                </div>

                {/* --- BLOCCO 1: ORA INIZIO / FINE --- */}
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

                {/* --- BLOCCO 2: GIORNI SETTIMANA --- */}
                <div className="form-group">
                    <label className="required-field">Giorni della settimana (Select Days)</label>
                    <WeekdayPicker value={weekdays} onChange={setWeekdays} />
                    {weekdays.length > 0 && (
                        <span className="info-badge">{weekdays.length} giorn{weekdays.length === 1 ? 'o' : 'i'} selezionat{weekdays.length === 1 ? 'o' : 'i'}</span>
                    )}
                </div>

                {/* --- BLOCCO 3: DURATA --- */}
                <div className="form-group">
                    <label className="required-field">Ripeti per (Durata)</label>
                    <div className="duration-group">
                        <input 
                            type="number" 
                            min="1" 
                            max="365"
                            value={durationValue} 
                            onChange={(e) => setDurationValue(parseInt(e.target.value))}
                            className="duration-value"
                        />
                        <select 
                            value={durationUnit} 
                            onChange={(e) => setDurationUnit(e.target.value)}
                            className="duration-unit"
                        >
                            <option value="days">Giorni</option>
                            <option value="weeks">Settimane</option>
                            <option value="months">Mesi</option>
                        </select>
                    </div>
                    <span className="info-badge">
                        {getDurationText()}
                    </span>
                </div>
                {/* --- FINE BLOCCHI RIORDINATI --- */}

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