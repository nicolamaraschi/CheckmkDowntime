import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthProvider';
import ClientSelectorDropdown from '../components/ClientSelectorDropdown';
import HostSelector from '../components/HostSelector';
import TimePickerFlatpickr from '../components/TimePickerFlatpickr';
import DatePickerFlatpickr from '../components/DatePickerFlatpickr';
import '../styles/downtimeSchedule.css';
import '../styles/flatpickr-custom.css';
import Loader from '../components/Loader';

const DowntimeSchedule = () => {
    const [selectedClients, setSelectedClients] = useState([]);
    const [hostList, setHostList] = useState([]);
    const [startTime, setStartTime] = useState('00:00');
    const [endTime, setEndTime] = useState('01:00');
    const [durationValue, setDurationValue] = useState(1);
    const [durationUnit, setDurationUnit] = useState('weeks');
    const [commento, setCommento] = useState('');

    // NEW: Scheduling mode toggle
    const [scheduleMode, setScheduleMode] = useState('period'); // 'period' or 'specific'
    const [specificDate, setSpecificDate] = useState('');

    // Advanced Settings
    const [batchSize, setBatchSize] = useState(3);
    const [delay, setDelay] = useState(1.0);
    const [showAdvanced, setShowAdvanced] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const { token } = useAuth();

    useEffect(() => {
        // Don't reset host list when clients change - allow accumulation
    }, [selectedClients]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (hostList.length === 0) {
            setError("Per favore, aggiungi almeno un host alla lista.");
            return;
        }

        if (startTime === endTime) {
            setError("L'ora di inizio e fine non possono coincidere.");
            return;
        }

        // Validation for specific date mode
        if (scheduleMode === 'specific' && !specificDate) {
            setError("Per favore, seleziona una data.");
            return;
        }

        setLoading(true);

        let totalDays = 0;
        let repeatDaysForBackend = 0;

        if (scheduleMode === 'period') {
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
            repeatDaysForBackend = totalDays > 0 ? totalDays - 1 : 0;
        }

        const payload = {
            hosts: hostList,
            giorni: [],
            startTime: startTime,
            endTime: endTime,
            ripeti: repeatDaysForBackend,
            commento: commento || "Manutenzione programmata",
            batch_size: parseInt(batchSize),
            delay: parseFloat(delay)
        };

        // Add specific_date if in specific mode
        if (scheduleMode === 'specific') {
            payload.specific_date = specificDate;
        }

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
                setSelectedClients([]);
                setHostList([]);
                setDurationValue(1);
                setDurationUnit('weeks');
                setCommento('');
                setSpecificDate('');
            }

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="container">
                <div className="card text-center p-xl">
                    <h1>⏳ Programmazione in corso...</h1>
                    <Loader text={`Creazione di ${hostList.length * (durationValue * 7)} slot di downtime...`} />
                    <p className="text-muted mt-md">Non chiudere questa pagina.</p>
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
        <div className="container">
            <div className="page-header">
                <h1>Programma Downtime</h1>
                <p className="page-subtitle">Pianifica finestre di manutenzione per uno o più host.</p>
            </div>

            <div className="card">
                <form className="downtime-form" onSubmit={handleSubmit}>

                    {/* SELEZIONE HOST */}
                    <div className="form-section">
                        <h3 className="section-title">1. Seleziona Clienti e Host</h3>
                        <div className="form-group">
                            <label>Clienti (Seleziona uno o più)</label>
                            <ClientSelectorDropdown selectedClients={selectedClients} setSelectedClients={setSelectedClients} />
                        </div>

                        {/* HOST SELECTOR FULL WIDTH */}
                        <div className="form-group mt-md">
                            <label>Seleziona Host</label>
                            <HostSelector
                                selectedHosts={hostList}
                                setSelectedHosts={setHostList}
                                selectedClients={selectedClients}
                            />
                        </div>
                    </div>

                    {/* LISTA HOST SELEZIONATI (Cross-Client) */}
                    {hostList.length > 0 && (
                        <div className="host-list-container mt-md">
                            <div className="flex justify-between items-center mb-sm">
                                <label className="text-sm text-muted">
                                    Host Selezionati Totali ({hostList.length})
                                </label>
                                <button
                                    type="button"
                                    className="btn btn-xs btn-secondary text-danger"
                                    onClick={() => setHostList([])}
                                >
                                    Svuota tutto
                                </button>
                            </div>
                            <div className="host-list-preview">
                                {hostList.map(host => (
                                    <span key={host} className="host-tag">
                                        {host}
                                        <button
                                            type="button"
                                            onClick={() => setHostList(prev => prev.filter(h => h !== host))}
                                            title={`Rimuovi ${host}`}
                                        >
                                            &times;
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <hr className="divider" />

                    {/* MODE TOGGLE */}
                    <div className="form-section">
                        <h3 className="section-title">2. Modalità di Programmazione</h3>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                            <button
                                type="button"
                                className={`btn ${scheduleMode === 'period' ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setScheduleMode('period')}
                            >
                                📅 Per Periodo
                            </button>
                            <button
                                type="button"
                                className={`btn ${scheduleMode === 'specific' ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setScheduleMode('specific')}
                            >
                                📍 Per Data Specifica
                            </button>
                        </div>
                    </div>

                    <hr className="divider" />

                    {/* CONFIGURAZIONE */}
                    <div className="form-section">
                        <h3 className="section-title">3. Configura {scheduleMode === 'period' ? 'Periodo' : 'Data e Orario'}</h3>

                        {/* SPECIFIC DATE MODE */}
                        {scheduleMode === 'specific' && (
                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                <label className="required-field">Data</label>
                                <DatePickerFlatpickr
                                    value={specificDate}
                                    onChange={setSpecificDate}
                                    minDate={new Date()}
                                />
                            </div>
                        )}

                        <div className="form-row">
                            <div className="form-group">
                                <label className="required-field">Ora Inizio</label>
                                <TimePickerFlatpickr value={startTime} onChange={setStartTime} />
                            </div>
                            <div className="form-group">
                                <label className="required-field">Ora Fine</label>
                                <TimePickerFlatpickr value={endTime} onChange={setEndTime} />
                            </div>
                        </div>

                        <div className="info-badge">
                            <span className="icon">ℹ️</span>
                            <div>
                                {scheduleMode === 'period' ? (
                                    <>
                                        <strong>Logica di Programmazione:</strong><br />
                                        L'orario {startTime} - {endTime} verrà applicato <strong>tutti i giorni</strong>.<br />
                                        Weekend (Sab-Dom) incluso automaticamente.
                                    </>
                                ) : (
                                    <>
                                        <strong>Programmazione Puntuale:</strong><br />
                                        Verrà creato un downtime per la data {specificDate || '[seleziona data]'} dalle {startTime} alle {endTime}.
                                    </>
                                )}
                            </div>
                        </div>

                        {/* DURATION - Only for period mode */}
                        {scheduleMode === 'period' && (
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="required-field">Durata</label>
                                    <div className="duration-group">
                                        <input
                                            type="number"
                                            min="1"
                                            max="365"
                                            value={durationValue}
                                            onChange={(e) => setDurationValue(parseInt(e.target.value))}
                                            className="form-input"
                                        />
                                        <select
                                            value={durationUnit}
                                            onChange={(e) => setDurationUnit(e.target.value)}
                                            className="form-select"
                                        >
                                            <option value="weeks">Settimane</option>
                                            <option value="months">Mesi</option>
                                        </select>
                                    </div>
                                    <span className="text-sm text-muted mt-xs">{getDurationText()}</span>
                                </div>

                                <div className="form-group flex-2">
                                    <label>Commento</label>
                                    <input
                                        type="text"
                                        value={commento}
                                        onChange={(e) => setCommento(e.target.value)}
                                        placeholder="Es. Manutenzione ordinaria"
                                        maxLength={200}
                                        className="form-input"
                                    />
                                </div>
                            </div>
                        )}

                        {/* COMMENT - For specific mode */}
                        {scheduleMode === 'specific' && (
                            <div className="form-group">
                                <label>Commento</label>
                                <input
                                    type="text"
                                    value={commento}
                                    onChange={(e) => setCommento(e.target.value)}
                                    placeholder="Es. Attività di manutenzione"
                                    maxLength={200}
                                    className="form-input"
                                />
                            </div>
                        )}
                    </div>

                    {/* ADVANCED SETTINGS */}
                    <div className="form-section">
                        <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            style={{ alignSelf: 'flex-start' }}
                        >
                            {showAdvanced ? '🔽 Nascondi Avanzate' : '▶️ Mostra Avanzate'}
                        </button>

                        {showAdvanced && (
                            <div className="advanced-settings p-md bg-gray-50 rounded-md mt-sm border border-gray-200">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label title="Numero di richieste simultanee verso Checkmk">
                                            Batch Size (Richieste Parallele)
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="50"
                                            value={batchSize}
                                            onChange={(e) => setBatchSize(e.target.value)}
                                            className="form-input"
                                        />
                                        <span className="text-xs text-muted">Default: 3</span>
                                    </div>
                                    <div className="form-group">
                                        <label title="Attesa in secondi tra un blocco e l'altro">
                                            Delay tra Batch (secondi)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.1"
                                            value={delay}
                                            onChange={(e) => setDelay(e.target.value)}
                                            className="form-input"
                                        />
                                        <span className="text-xs text-muted">Default: 1.0s</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="form-actions">
                        <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading || hostList.length === 0}>
                            {loading ? 'Programmazione...' : `🚀 Programma per ${hostList.length} Host`}
                        </button>
                    </div>

                    {success && <div className="alert alert-success">{success}</div>}
                    {error && <div className="alert alert-error">{error}</div>}
                </form>
            </div>
        </div>
    );
};

export default DowntimeSchedule;