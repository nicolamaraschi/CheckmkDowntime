import React, { useState, useEffect, useCallback } from 'react';
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
    
    const { data: hostsData, loading: hostsLoading, error: hostsError } = useApi('hosts');
    const { token, refreshToken, logout } = useAuth();
    
    // Funzione per recuperare i downtime (per host o per cliente)
    const fetchDowntimes = useCallback(async (filter) => {
        if (!filter || !token) return;
        
        if (abortController) {
            abortController.abort();
        }
        
        const controller = new AbortController();
        setAbortController(controller);
        
        setIsLoading(true);
        setError(null);
        
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

    // --- FUNZIONE PER ELIMINARE (MODIFICATA) ---
    const handleDeleteDowntime = async (downtimeId, siteId) => { // <-- MODIFICA: Aggiunto siteId
        
        // <-- MODIFICA: Aggiunto controllo su siteId
        if (!downtimeId || !siteId || !window.confirm(`Sei sicuro di voler eliminare il downtime ${downtimeId} dal sito ${siteId}?`)) {
            if (!siteId) {
                console.error("Tentativo di eliminazione fallito: site_id mancante.", downtimeId);
                setError("Errore: Impossibile trovare il 'site_id' per questo downtime. Dati corrotti.");
            }
            return;
        }
    
        if (!token) {
            setError("Token non trovato. Esegui nuovamente il login.");
            return;
        }
        
        setIsLoading(true); 
        setError(null);
        
        // <-- MODIFICA: Aggiunto site_id come query parameter
        const apiUrl = `/api/downtimes/${downtimeId}?site_id=${encodeURIComponent(siteId)}`;
    
        try {
            const response = await fetch(apiUrl, { // <-- MODIFICA: usata variabile apiUrl
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
    
            if (response.status === 401) {
                const newToken = await refreshToken();
                if (newToken) {
                    // Riprova
                    const retryResponse = await fetch(apiUrl, { // <-- MODIFICA: usata variabile apiUrl
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${newToken}`
                        }
                    });
                    if (!retryResponse.ok && retryResponse.status !== 204) throw new Error(`Errore: ${retryResponse.status}`);
                } else {
                     setError("Sessione scaduta. Esegui nuovamente il login.");
                     logout();
                     return;
                }
            } else if (!response.ok && response.status !== 204) {
                // Errore dal backend (204 No Content è un successo)
                const errData = await response.json();
                throw new Error(errData.detail || `Errore: ${response.status}`);
            }
            
            // Successo (status 200, 202, o 204)
            setDowntimes(prevDowntimes => 
                prevDowntimes.filter(dt => dt.id !== downtimeId)
            );
            
        } catch (err) {
            console.error("Errore nell'eliminazione del downtime:", err);
            setError(err.message || "Si è verificato un errore");
        } finally {
            setIsLoading(false);
        }
    };
    // --- FINE FUNZIONE MODIFICATA ---


    // Pulisci le risorse quando il componente viene smontato
    useEffect(() => {
        return () => {
            if (abortController) {
                abortController.abort();
            }
        };
    }, [abortController]);
    
    // Reset quando cambia il cliente selezionato
    useEffect(() => {
        setSelectedHost('');
    }, [selectedClient]);
    
    // Aggiornamento automatico se abilitato
    useEffect(() => {
        let refreshInterval;
        if (autoRefresh && (selectedHost || selectedClient) && !isLoading && lastRefreshed) {
            refreshInterval = setInterval(() => {
                if (selectedHost) {
                    fetchDowntimes({ host: selectedHost });
                } else if (selectedClient) {
                    fetchDowntimes({ client: selectedClient });
                }
            }, 120000); // 2 minuti
        }
        return () => {
            if (refreshInterval) {
                clearInterval(refreshInterval);
            }
        };
    }, [autoRefresh, selectedHost, selectedClient, fetchDowntimes, isLoading, lastRefreshed]);
    
    // Crea mappa degli host
    const hostFolderMap = React.useMemo(() => {
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
    
    // Calcola i downtime attivi
    const activeDowntimes = React.useMemo(() => {
        if (!downtimes.length) return 0;
        const now = new Date();
        return downtimes.filter(dt => {
            const startTime = dt.extensions?.start_time ? new Date(dt.extensions.start_time) : null;
            const endTime = dt.extensions?.end_time ? new Date(dt.extensions.end_time) : null;
            if (!startTime || !endTime) return false;
            return startTime <= now && endTime >= now;
        }).length;
    }, [downtimes]);
    
    // Reset dei filtri
    const handleReset = () => {
        if (abortController) {
            abortController.abort();
            setAbortController(null);
        }
        setSelectedClient('');
        setSelectedHost('');
        setDowntimes([]);
        setError(null);
        setLastRefreshed(null);
    };
    
    // Gestione del bottone di ricerca
    const handleSearch = () => {
        if (isLoading) return;
        if (selectedHost) {
            fetchDowntimes({ host: selectedHost });
        } else if (selectedClient) {
            fetchDowntimes({ client: selectedClient });
        }
    };
    
    // Aggiornamento manuale
    const handleRefresh = () => {
        if (isLoading || !lastRefreshed) return;
        if (selectedHost) {
            fetchDowntimes({ host: selectedHost });
        } else if (selectedClient) {
            fetchDowntimes({ client: selectedClient });
        }
    };
    
    // Gestione toggle autorefresh
    const toggleAutoRefresh = () => {
        setAutoRefresh(!autoRefresh);
    };
    
    return (
        <div className="downtime-container">
            <h1>Downtime Esistenti</h1>
            
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
                    <Loader text="Caricamento downtime in corso..." />
                </div>
            )}
            
            {error && (
                <div className="error-card">
                    <h2>Errore</h2>
                    <p>{error}</p>
                    {error.includes("sessione") ? (
                        <button 
                            className="retry-button"
                            onClick={() => logout()}
                            style={{ marginTop: '10px' }}
                        >
                            Vai al login
                        </button>
                    ) : (
                        <button 
                            className="retry-button"
                            onClick={handleSearch}
                            style={{ marginTop: '10px' }}
                        >
                            Riprova
                        </button>
                    )}
                </div>
            )}
            
            {!selectedClient && !selectedHost && !isLoading && !error && (
                <div className="filter-notice">
                    <p>Seleziona un cliente o un host specifico e clicca su "Cerca" per visualizzare i downtime.</p>
                </div>
            )}
            
            {(selectedClient || selectedHost) && !isLoading && !error && !lastRefreshed && (
                <div className="filter-notice">
                    <p>
                        {selectedHost 
                            ? `Host selezionato: ${selectedHost}.`
                            : `Cliente selezionato: ${selectedClient}.`
                        }
                        Clicca su "Cerca" per visualizzare i downtime.
                    </p>
                </div>
            )}
            
            {(selectedClient || selectedHost) && !isLoading && !error && lastRefreshed && downtimes.length === 0 && (
                <div className="no-results">
                    <p>Nessun downtime trovato per i filtri selezionati.</p>
                </div>
            )}
            
            {!isLoading && !error && lastRefreshed && (selectedClient || selectedHost) && downtimes.length > 0 && (
                <>
                    <div className="results-count">
                        Trovati {downtimes.length} downtime 
                        {selectedHost ? ` per ${selectedHost}` : (selectedClient ? ` per il cliente ${selectedClient}` : '')},
                        di cui {activeDowntimes} attualmente attivi
                    </div>
                    <table className="downtime-table">
                        <thead>
                            <tr>
                                <th>Host</th>
                                <th>Cliente</th>
                                <th>Sito</th> {/* <-- Aggiunta colonna Sito */}
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
                                const clientFolder = hostFolderMap.get(hostName) || '/';
                                const siteId = dt.extensions?.site || 'N/A'; // <-- Leggiamo il site_id
                                
                                const now = new Date();
                                const startTime = dt.extensions?.start_time ? new Date(dt.extensions.start_time) : null;
                                const endTime = dt.extensions?.end_time ? new Date(dt.extensions.end_time) : null;
                                const isActive = startTime && endTime && startTime <= now && endTime >= now;
                                
                                return (
                                    <tr key={dt.id || idx} className={isActive ? 'active-downtime' : ''}>
                                        <td>{hostName}</td>
                                        <td>{clientFolder}</td>
                                        <td>{siteId}</td> {/* <-- Mostriamo il site_id */}
                                        <td>{startTime ? startTime.toLocaleString() : 'N/A'}</td>
                                        <td>{endTime ? endTime.toLocaleString() : 'N/A'}</td>
                                        <td>{dt.extensions?.author || 'N/A'}</td>
                                        <td>{dt.extensions?.comment || 'N/A'}</td>
                                        
                                        <td>
                                            <button 
                                                className="delete-button"
                                                // --- MODIFICA CHIAVE ---
                                                // Passiamo sia l'ID che il siteId
                                                onClick={() => handleDeleteDowntime(dt.id, siteId)}
                                                // --- FINE MODIFICA ---
                                                disabled={isLoading}
                                                title={`Elimina downtime ${dt.id}`}
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