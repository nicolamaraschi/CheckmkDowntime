import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useApi } from '../hooks/useApi';
import '../styles/existingDowntimes.css';
import Loader from '../components/Loader';
import ClientSelector from '../components/ClientSelector';
import HostSelector from '../components/HostSelector';

const ExistingDowntimes = () => {
    const [selectedClient, setSelectedClient] = useState('');
    const [selectedHost, setSelectedHost] = useState('');
    const [downtimes, setDowntimes] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [fromCache, setFromCache] = useState(false);
    const [lastRefreshed, setLastRefreshed] = useState(null);
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [abortController, setAbortController] = useState(null);

    // --- NUOVO STATE PER LA SELEZIONE ---
    const [selectedDowntimes, setSelectedDowntimes] = useState(new Set());

    const { data: hostsData } = useApi('hosts');
    const { token, refreshToken, logout } = useAuth();

    const fetchDowntimes = useCallback(async (filter) => {
        // ... (la tua funzione fetchDowntimes esistente non cambia) ...
        if (!filter || !token) return;

        if (abortController) {
            abortController.abort();
        }

        const controller = new AbortController();
        setAbortController(controller);

        setIsLoading(true);
        setError(null);
        setSelectedDowntimes(new Set()); // Resetta la selezione ad ogni nuova ricerca

        let queryString = '';
        if (filter.client) {
            queryString = `cliente=${encodeURIComponent(filter.client)}`;
        } else if (filter.host) {
            queryString = `host=${encodeURIComponent(filter.host)}`;
        } else {
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch(`/api/downtimes?${queryString}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                signal: controller.signal
            });

            if (response.status === 401) {
                const newToken = await refreshToken();
                if (newToken) {
                    const retryResponse = await fetch(`/api/downtimes?${queryString}`, {
                        headers: {
                            'Authorization': `Bearer ${newToken}`,
                            'Content-Type': 'application/json'
                        },
                        signal: controller.signal
                    });

                    if (!retryResponse.ok) throw new Error(`Errore: ${retryResponse.status}`);
                    const data = await retryResponse.json();
                    setDowntimes(data.downtimes || []);
                    setFromCache(data.fromCache || false);
                } else {
                    setError("La sessione è scaduta. Effettua nuovamente il login.");
                    setTimeout(() => logout(), 3000);
                }
            } else if (!response.ok) {
                throw new Error(`Errore: ${response.status}`);
            } else {
                const data = await response.json();
                setDowntimes(data.downtimes || []);
                setFromCache(data.fromCache || false);
            }

            setLastRefreshed(new Date());

        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error("Errore nel recupero dei downtime:", err);
                setError(err.message || "Si è verificato un errore di rete");
            }
        } finally {
            setIsLoading(false);
            setAbortController(null);
        }
    }, [token, refreshToken, logout, abortController]);

    const handleDeleteDowntime = async (downtimeId, siteId) => {
        // ... (la tua funzione di cancellazione singola non cambia) ...
        if (!downtimeId || !siteId) {
            setError("ID o Site ID mancante. Impossibile eliminare.");
            return;
        }
        if (!window.confirm(`Sei sicuro di voler eliminare il downtime ${downtimeId} dal sito ${siteId}?`)) {
            return;
        }
        if (!token) {
            setError("Token non trovato. Esegui nuovamente il login.");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/downtimes/${downtimeId}?site_id=${encodeURIComponent(siteId)}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.status === 401) {
                const newToken = await refreshToken();
                if (newToken) {
                    const retryResponse = await fetch(`/api/downtimes/${downtimeId}?site_id=${encodeURIComponent(siteId)}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${newToken}` }
                    });
                    if (!retryResponse.ok && retryResponse.status !== 204) throw new Error(`Errore: ${retryResponse.status}`);
                } else {
                    setError("Sessione scaduta. Esegui nuovamente il login.");
                    logout();
                    return;
                }
            } else if (!response.ok && response.status !== 204) {
                const errData = await response.json();
                throw new Error(errData.detail || `Errore: ${response.status}`);
            }
            setDowntimes(prevDowntimes => prevDowntimes.filter(dt => dt.id !== downtimeId));
        } catch (err) {
            console.error("Errore nell'eliminazione del downtime:", err);
            setError(err.message || "Si è verificato un errore");
        } finally {
            setIsLoading(false);
        }
    };

    // --- NUOVA FUNZIONE PER CANCELLAZIONE MASSIVA ---
    const handleBatchDelete = async () => {
        const selectedIds = Array.from(selectedDowntimes);
        if (selectedIds.length === 0) {
            alert("Nessun downtime selezionato.");
            return;
        }

        if (!window.confirm(`Sei sicuro di voler eliminare ${selectedIds.length} downtime?`)) {
            return;
        }

        setIsLoading(true);
        setError(null);

        // 1. Trova gli oggetti downtime completi (ci serve il site_id)
        const downtimesToDelete = downtimes.filter(dt => selectedIds.includes(dt.id));

        // 2. Prepara il payload per il backend
        const payload = {
            downtimes: downtimesToDelete.map(dt => ({
                downtime_id: dt.id,
                site_id: dt.extensions.site_id
            }))
        };

        try {
            const response = await fetch('/api/downtimes/delete-batch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            // Gestione 401 (token scaduto)
            if (response.status === 401) {
                const newToken = await refreshToken();
                if (!newToken) {
                    setError("Sessione scaduta. Esegui nuovamente il login.");
                    logout();
                    return;
                }
                // Riprova
                const retryResponse = await fetch('/api/downtimes/delete-batch', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${newToken}`
                    },
                    body: JSON.stringify(payload)
                });
                if (!retryResponse.ok) {
                    const errData = await retryResponse.json();
                    throw new Error(errData.detail || `Errore: ${retryResponse.status}`);
                }
                const result = await retryResponse.json();
                handleBatchDeleteResponse(result); // Gestisci la risposta

            } else if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || `Errore: ${response.status}`);
            } else {
                const result = await response.json();
                handleBatchDeleteResponse(result); // Gestisci la risposta
            }

        } catch (err) {
            console.error("Errore nella cancellazione massiva:", err);
            setError(err.message || "Si è verificato un errore");
        } finally {
            setIsLoading(false);
        }
    };

    // Funzione helper per gestire il risultato del batch
    const handleBatchDeleteResponse = (result) => {
        if (result.failed > 0) {
            setError(`Cancellazione massiva completata con ${result.failed} errori. ${result.succeeded} successi. Primo errore: ${result.errors[0]}`);
        } else {
            alert(`Cancellati ${result.succeeded} downtime con successo.`);
        }

        // Pulisci i downtime cancellati dallo stato
        const failedIds = new Set(
            result.errors.map(err => err.match(/Failed dt (\w+)/)?.[1]).filter(Boolean)
        );
        setDowntimes(prev => prev.filter(dt => failedIds.has(dt.id)));
        setSelectedDowntimes(new Set());
        // Forza un refresh per essere sicuri
        handleRefresh();
    };

    // --- NUOVI HANDLER PER LE CHECKBOX ---

    // Gestisce il "Seleziona/Deseleziona Tutto"
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            // Seleziona tutti gli ID dei downtime *attualmente visibili*
            const allVisibleIds = new Set(downtimes.map(dt => dt.id));
            setSelectedDowntimes(allVisibleIds);
        } else {
            // Deseleziona tutto
            setSelectedDowntimes(new Set());
        }
    };

    // Gestisce la selezione di una singola riga
    const handleSelectOne = (e, downtimeId) => {
        const newSelection = new Set(selectedDowntimes);
        if (e.target.checked) {
            newSelection.add(downtimeId);
        } else {
            newSelection.delete(downtimeId);
        }
        setSelectedDowntimes(newSelection);
    };

    // Calcola se la checkbox "select all" deve essere spuntata
    const isAllSelected = useMemo(() => {
        return downtimes.length > 0 && selectedDowntimes.size === downtimes.length;
    }, [downtimes, selectedDowntimes]);


    // ... (useEffect, useMemo, handleReset, handleSearch, handleRefresh, etc. restano uguali) ...
    useEffect(() => {
        return () => { if (abortController) { abortController.abort(); } };
    }, [abortController]);

    useEffect(() => {
        setSelectedHost('');
    }, [selectedClient]);

    useEffect(() => {
        let refreshInterval;
        if (autoRefresh && (selectedHost || selectedClient) && !isLoading && lastRefreshed) {
            refreshInterval = setInterval(() => {
                if (selectedHost) { fetchDowntimes({ host: selectedHost }); }
                else if (selectedClient) { fetchDowntimes({ client: selectedClient }); }
            }, 120000);
        }
        return () => { if (refreshInterval) { clearInterval(refreshInterval); } };
    }, [autoRefresh, selectedHost, selectedClient, fetchDowntimes, isLoading, lastRefreshed]);

    const hostFolderMap = useMemo(() => {
        const map = new Map();
        if (hostsData) {
            const hosts = Array.isArray(hostsData) ? hostsData : (hostsData.hosts || []);
            hosts.forEach(host => {
                const hostId = typeof host === 'string' ? host : host.id;
                const folder = typeof host === 'string' ? '/' : (host.folder || '/');
                map.set(hostId, folder);
            });
        }
        return map;
    }, [hostsData]);

    const activeDowntimes = useMemo(() => {
        if (!downtimes.length) return 0;
        const now = new Date();
        return downtimes.filter(dt => {
            const startTime = dt.extensions?.start_time ? new Date(dt.extensions.start_time) : null;
            const endTime = dt.extensions?.end_time ? new Date(dt.extensions.end_time) : null;
            if (!startTime || !endTime) return false;
            return startTime <= now && endTime >= now;
        }).length;
    }, [downtimes]);

    const handleReset = () => {
        if (abortController) { abortController.abort(); setAbortController(null); }
        setSelectedClient('');
        setSelectedHost('');
        setDowntimes([]);
        setError(null);
        setLastRefreshed(null);
        setSelectedDowntimes(new Set()); // Resetta selezione
    };

    const handleSearch = () => {
        if (isLoading) return;
        if (selectedHost) { fetchDowntimes({ host: selectedHost }); }
        else if (selectedClient) { fetchDowntimes({ client: selectedClient }); }
    };

    const handleRefresh = () => {
        if (isLoading || !lastRefreshed) return;
        if (selectedHost) { fetchDowntimes({ host: selectedHost }); }
        else if (selectedClient) { fetchDowntimes({ client: selectedClient }); }
    };

    const toggleAutoRefresh = () => {
        setAutoRefresh(!autoRefresh);
    };

    return (
        <div className="downtime-container">
            <h1>Downtime Esistenti</h1>

            {/* ... (Sezione refresh-info, cache-notification, filter-container restano uguali) ... */}
            {lastRefreshed && (
                <div className="refresh-info">
                    <div>
                        <span>Ultimo aggiornamento: {lastRefreshed.toLocaleTimeString()}</span>
                    </div>
                    <div className="refresh-controls">
                        <label>
                            <input
                                type="checkbox"
                                checked={autoRefresh}
                                onChange={toggleAutoRefresh}
                            /> Aggiornamento automatico
                        </label>
                        <button
                            className="refresh-button"
                            onClick={handleRefresh}
                            disabled={(!selectedHost && !selectedClient) || isLoading || !lastRefreshed}
                        >
                            🔄 Aggiorna
                        </button>
                    </div>
                </div>
            )}

            {fromCache && (
                <div className="cache-notification">
                    <i>ℹ️</i> Dati caricati dalla cache
                </div>
            )}

            <div className="filter-container">
                <div className="filter-row">
                    <div className="filter-item">
                        <label>Filtra per cliente:</label>
                        <ClientSelector
                            selectedClient={selectedClient}
                            setSelectedClient={setSelectedClient}
                        />
                    </div>

                    <div className="filter-item">
                        <label>Filtra per host specifico:</label>
                        <HostSelector
                            selectedHost={selectedHost}
                            setSelectedHost={setSelectedHost}
                            selectedClient={selectedClient}
                        />
                    </div>

                    <div className="filter-actions">
                        <button
                            className="search-button"
                            onClick={handleSearch}
                            disabled={(!selectedClient && !selectedHost) || isLoading}
                        >
                            🔍 Cerca
                        </button>
                        <button
                            className="reset-button"
                            onClick={handleReset}
                        >
                            Resetta
                        </button>
                    </div>
                </div>
            </div>

            {isLoading && (
                <div style={{ marginTop: "30px", marginBottom: "20px" }}>
                    <Loader text="Caricamento in corso..." />
                </div>
            )}

            {error && (
                <div className="error-card">
                    <h2>Errore</h2>
                    <p>{error}</p>
                    {/* ... (logica bottoni errore) ... */}
                </div>
            )}

            {/* ... (logica messaggi filter-notice, no-results) ... */}
            {!selectedClient && !selectedHost && !isLoading && !error && (
                <div className="filter-notice">
                    <p>Seleziona un cliente o un host specifico e clicca su "Cerca" per visualizzare i downtime.</p>
                </div>
            )}
            {/* ... (etc) ... */}


            {!isLoading && !error && lastRefreshed && (selectedClient || selectedHost) && downtimes.length > 0 && (
                <>
                    {/* --- NUOVO PANNELLO AZIONI MASSIVE --- */}
                    <div className="batch-actions-container">
                        <div className="results-count">
                            Trovati {downtimes.length} downtime,
                            di cui {activeDowntimes} attivi
                        </div>
                        {selectedDowntimes.size > 0 && (
                            <div className="batch-actions">
                                <span>{selectedDowntimes.size} selezionat{selectedDowntimes.size > 1 ? 'i' : 'o'}</span>
                                <button
                                    className="delete-batch-button"
                                    onClick={handleBatchDelete}
                                    disabled={isLoading}
                                >
                                    🗑️ Elimina Selezionati
                                </button>
                            </div>
                        )}
                    </div>

                    <table className="downtime-table">
                        <thead>
                            <tr>
                                {/* --- NUOVA CHECKBOX INTESTAZIONE --- */}
                                <th className="checkbox-cell">
                                    <input
                                        type="checkbox"
                                        checked={isAllSelected}
                                        onChange={handleSelectAll}
                                        disabled={isLoading}
                                        title="Seleziona/Deseleziona tutto"
                                    />
                                </th>
                                <th>Host</th>
                                <th>Cliente</th>
                                <th>Sito</th>
                                <th>Inizio</th>
                                <th>Fine</th>
                                <th>Autore</th>
                                <th>Commento</th>
                                <th>Azioni</th>
                            </tr>
                        </thead>
                        <tbody>
                            {downtimes.map((dt, idx) => {
                                const hostName = dt.extensions?.host_name || 'N/A';
                                const siteId = dt.extensions?.site_id || 'N/A';
                                const clientFolder = hostFolderMap.get(hostName) || '/';

                                const now = new Date();
                                const startTime = dt.extensions?.start_time ? new Date(dt.extensions.start_time) : null;
                                const endTime = dt.extensions?.end_time ? new Date(dt.extensions.end_time) : null;
                                const isActive = startTime && endTime && startTime <= now && endTime >= now;

                                return (
                                    <tr key={dt.id || idx} className={isActive ? 'active-downtime' : ''}>
                                        {/* --- NUOVA CHECKBOX RIGA --- */}
                                        <td className="checkbox-cell">
                                            <input
                                                type="checkbox"
                                                checked={selectedDowntimes.has(dt.id)}
                                                onChange={(e) => handleSelectOne(e, dt.id)}
                                                disabled={isLoading}
                                            />
                                        </td>
                                        <td>{hostName}</td>
                                        <td>{clientFolder}</td>
                                        <td>{siteId}</td>
                                        <td>{startTime ? startTime.toLocaleString() : 'N/A'}</td>
                                        <td>{endTime ? endTime.toLocaleString() : 'N/A'}</td>
                                        <td>{dt.extensions?.author || 'N/A'}</td>
                                        <td>{dt.extensions?.comment || 'N/A'}</td>
                                        <td>
                                            <button
                                                className="delete-button"
                                                onClick={() => handleDeleteDowntime(dt.id, dt.extensions.site_id)}
                                                disabled={isLoading}
                                                title={`Elimina downtime ${dt.id} dal sito ${siteId}`}
                                            >
                                                🗑️
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </>
            )}
        </div>
    );
};

export default ExistingDowntimes;