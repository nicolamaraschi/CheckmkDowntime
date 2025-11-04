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
    
    // --- MODIFICA 1: Gestione host ---
    const [selectedHost, setSelectedHost] = useState(''); // Host corrente nel dropdown
    const [hostList, setHostList] = useState([]);         // Lista di host da programmare

    const [weekdays, setWeekdays] = useState([]);
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

    // --- NUOVA FUNZIONE: Aggiungi host alla lista ---
    const handleAddHost = () => {
        if (selectedHost && !hostList.includes(selectedHost)) {
            setHostList([...hostList, selectedHost]);
            setSelectedHost(''); // Resetta il dropdown per la prossima selezione
        }
    };
    
    // --- NUOVA FUNZIONE: Rimuovi host dalla lista ---
    const handleRemoveHost = (hostToRemove) => {
        setHostList(prevList => prevList.filter(host => host !== hostToRemove));
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        // --- MODIFICA 2: Controllo sulla lista ---
        if (hostList.length === 0) {
            setError("Per favore, aggiungi almeno un host alla lista.");
            return;
        }
        
        if (weekdays.length === 0) {
            if (!window.confirm("Non hai selezionato giorni feriali. Verrà impostato il downtime SOLO per Sabato e Domenica. Continuare?")) {
                return;
            }
        }

        if (startTime === endTime) {
             setError("L'ora di inizio e fine non possono coincidere.");
             return;
        }

        setLoading(true);

        let totalDays = 0;
        switch (durationUnit) {
            case 'weeks':
                totalDays = durationValue * 7;
                break;
            case 'months':
                totalDays = durationValue * 30;
                break;
            default:
                totalDays = durationValue * 7;
        }
        
        const repeatDaysForBackend = totalDays > 0 ? totalDays - 1 : 0;

        // --- MODIFICA 3: Invia la lista di host ---
        const payload = {
            hosts: hostList, // Invia la lista
            giorni: weekdays,
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
                setError(`Operazione completata con ${errorsInResponses.length} errori su ${result.responses.length} task. Primo errore: ${firstError}`);
            } else {
                setSuccess(`✓ Downtime programmato con successo per ${hostList.length} host! (${result.responses.length} slot totali creati)`);
                // Reset del form
                setSelectedClient('');
                setSelectedHost('');
                setHostList([]); // Resetta la lista
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
                <Loader text={`Creazione di ${hostList.length * (durationValue * 7)} slot di downtime... Questo può richiedere diversi minuti.`} />
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
            <h1>📅 Programma Downtime Massivo</h1>
            
            <form className="downtime-form" onSubmit={handleSubmit}>

                {/* --- BLOCCO 1: SELEZIONE HOST --- */}
                <div className="form-group">
                    <label className="required-field">1. Seleziona Host da Aggiungere</label>
                    <ClientSelector selectedClient={selectedClient} setSelectedClient={setSelectedClient} />
                    
                    <div className="add-host-group">
                        <HostSelector
                            selectedHost={selectedHost}
                            setSelectedHost={setSelectedHost}
                            selectedClient={selectedClient}
                        />
                        <button 
                            type="button" 
                            className="add-host-btn" 
                            onClick={handleAddHost}
                            disabled={!selectedHost}
                        >
                            Aggiungi +
                        </button>
                    </div>
                </div>

                {/* --- NUOVO BLOCCO: LISTA HOST --- */}
                {hostList.length > 0 && (
                    <div className="form-group">
                        <label>Host Selezionati ({hostList.length})</label>
                        <div className="host-list-preview">
                            {hostList.map(host => (
                                <span key={host} className="host-tag">
                                    {host}
                                    <button 
                                        type="button" 
                                        onClick={() => handleRemoveHost(host)}
                                        title={`Rimuovi ${host}`}
                                    >
                                        &times;
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>
                )}
                
                {/* --- BLOCCO 2: CONFIGURAZIONE (uguale per tutti) --- */}
                <hr style={{border: '1px solid #f0f0f0', margin: '15px 0'}} />
                
                <label className="required-field" style={{fontWeight: 600, fontSize: '1.1rem'}}>2. Configura il Downtime</label>

                <div className="time-group">
                    <div className="form-group">
                        <label className="required-field">Ora Inizio Feriali (HH:MM)</label>
                        <TimePicker 
                            value={startTime} 
                            onChange={setStartTime} 
                        />
                    </div>
                    <div className="form-group">
                        <label className="required-field">Ora Fine Feriali (HH:MM)</label>
                        <TimePicker 
                            value={endTime} 
                            onChange={setEndTime} 
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label>Giorni feriali (Opzionale)</label>
                    <WeekdayPicker value={weekdays} onChange={setWeekdays} />
                    <span className="info-badge" style={{
                        marginTop: '10px', backgroundColor: '#e6f7ff', color: '#0056b3', 
                        textAlign: 'left', display: 'block', padding: '10px'
                    }}>
                        ℹ️ **Nota:** Il downtime per **Sabato e Domenica** (00:00 - 23:59) viene aggiunto **automaticamente**.
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
                        placeholder="Es. Spegnimento weekend e manutenzione"
                        maxLength={200}
                    />
                </div>

                <div className="form-actions">
                    <button type="submit" className="submit-btn" disabled={loading || hostList.length === 0}>
                        {loading ? 'Programmazione...' : `🚀 Programma per ${hostList.length} Host`}
                    </button>
                </div>

                {success && <div className="form-message success-message">{success}</div>}
                {error && <div className="form-message error-message">{error}</div>}
            </form>
        </div>
    );
};

export default DowntimeSchedule;