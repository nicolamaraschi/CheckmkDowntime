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
    const [weekdays, setWeekdays] = useState([]); // Ora conterrà solo 0-4
    const [startTime, setStartTime] = useState('00:00');
    const [endTime, setEndTime] = useState('01:00');
    
    const [durationValue, setDurationValue] = useState(1);
    const [durationUnit, setDurationUnit] = useState('weeks'); 

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
        
        // --- MODIFICA ---
        // Ora è possibile non selezionare giorni (0)
        // se l'utente vuole impostare *solo* il weekend.
        if (weekdays.length === 0) {
            // Non è un errore, ma avvisiamo l'utente
            if (!window.confirm("Non hai selezionato giorni feriali. Verrà impostato il downtime SOLO per Sabato e Domenica. Continuare?")) {
                return;
            }
        }

        if (startTime === endTime) {
             setError("L'ora di inizio e fine non possono coincidere.");
             setSuccess(null);
             return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        let totalDays = 0;
        switch (durationUnit) {
            case 'weeks':
                totalDays = durationValue * 7;
                break;
            case 'months':
                totalDays = durationValue * 30; // Usiamo 30 giorni come approssimazione
                break;
            default:
                totalDays = durationValue * 7;
        }
        
        const repeatDaysForBackend = totalDays > 0 ? totalDays - 1 : 0;

        const payload = {
            host: selectedHost,
            giorni: weekdays, // Invia solo i giorni feriali (0-4)
            startTime: startTime,
            endTime: endTime,
            ripeti: repeatDaysForBackend, 
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

    const getDurationText = () => {
        if (durationValue <= 0) return "Solo per oggi";
        let unitText = '';
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

                <div className="time-group">
                    <div className="form-group">
                        <label className="required-field">Ora Inizio (HH:MM)</label>
                        <TimePicker 
                            value={startTime} 
                            onChange={setStartTime} 
                        />
                    </div>
                    <div className="form-group">
                        <label className="required-field">Ora Fine (HH:MM)</label>
                        <TimePicker 
                            value={endTime} 
                            onChange={setEndTime} 
                        />
                    </div>
                </div>


                <div className="form-group">
                    {/* --- MODIFICA TESTO --- */}
                    <label>Giorni feriali (Opzionale)</label>
                    <WeekdayPicker value={weekdays} onChange={setWeekdays} />
                    
                    {/* --- NOTA INFORMATIVA AGGIORNATA --- */}
                    <span className="info-badge" style={{
                        marginTop: '10px', 
                        backgroundColor: '#e6f7ff', 
                        color: '#0056b3', 
                        textAlign: 'left',
                        display: 'block',
                        padding: '10px'
                    }}>
                        ℹ️ **Nota:** Il downtime per **Sabato e Domenica** (00:00 - 23:59) viene aggiunto **automaticamente** per tutta la durata selezionata.
                        <br/>
                        Seleziona i giorni qui sopra solo se vuoi aggiungere un downtime anche nei giorni feriali (es. Lun-Ven).
                    </span>
                </div>

                <div className="form-group">
                    <label className="required-field">Durata</label>
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
                            <option value="weeks">Settimane</option>
                            <option value="months">Mesi</option>
                        </select>
                    </div>
                    <span className="info-badge">
                        {getDurationText()}
                    </span>
                </div>

                <div className="form-group">
                    <label>Commento</label>
                    <input 
                        type="text" 
                        value={commento} 
                        onChange={(e) => setCommento(e.target.value)}
                        placeholder="Es. Spegnimento weekend"
                        maxLength={200}
                    />
                </div>

                <div className="form-actions">
                    <button type="submit" className="submit-btn" disabled={loading}>
                        {loading ? 'Programmazione...' : '🚀 Programma Downtime'}
                    </button>
                </div>

                {success && <div className="form-message success-message">{success}</div>}
                {error && <div className="form-message error-message">{error}</div>}
            </form>
        </div>
    );
};

export default DowntimeSchedule;