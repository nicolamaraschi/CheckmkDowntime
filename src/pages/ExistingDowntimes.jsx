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
    
    // Funzione per recuperare i downtime di un host specifico
const fetchHostDowntimes = useCallback(async (hostname) => {
    if (!hostname || !token) return;
    
    // Annulla la richiesta precedente se esiste
    if (abortController) {
        abortController.abort();
    }
    
    // Crea un nuovo controller per questa richiesta
    const controller = new AbortController();
    setAbortController(controller);
    
    setIsLoading(true);
    setError(null);
    
    try {
        // Usa il token di autenticazione dal contesto
        const response = await fetch(`/api/downtimes?host=${encodeURIComponent(hostname)}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            signal: controller.signal
        });
        
        if (response.status === 401) {
            // Prova a rinnovare il token
            const newToken = await refreshToken();
            
            if (newToken) {
                // Riprova la richiesta con il nuovo token
                const retryResponse = await fetch(`/api/downtimes?host=${encodeURIComponent(hostname)}`, {
                    headers: {
                        'Authorization': `Bearer ${newToken}`,
                        'Content-Type': 'application/json'
                    },
                    signal: controller.signal
                });
                
                if (!retryResponse.ok) {
                    throw new Error(`Errore: ${retryResponse.status}`);
                }
                
                const data = await retryResponse.json();
                setDowntimes(data.downtimes || []);
                setFromCache(data.fromCache || false);
            } else {
                // Sessione scaduta, reindirizza al login
                setError("La sessione è scaduta. Effettua nuovamente il login.");
                setTimeout(() => {
                    logout();
                }, 3000);
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
        // Non mostrare errori se l'operazione è stata annullata intenzionalmente
        if (err.name !== 'AbortError') {
            console.error("Errore nel recupero dei downtime:", err);
            setError(err.message || "Si è verificato un errore di rete");
        }
    } finally {
        setIsLoading(false);
        setAbortController(null);
    }
}, [token, refreshToken, logout, abortController]);

    // Pulisci le risorse quando il componente viene smontato
    useEffect(() => {
        return () => {
            // Annulla qualsiasi richiesta in corso quando il componente viene smontato
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
        
        if (autoRefresh && selectedHost && !isLoading && lastRefreshed) {
            refreshInterval = setInterval(() => {
                fetchHostDowntimes(selectedHost);
            }, 120000); // 2 minuti in millisecondi
        }
        
        return () => {
            if (refreshInterval) {
                clearInterval(refreshInterval);
            }
        };
    }, [autoRefresh, selectedHost, fetchHostDowntimes, isLoading, lastRefreshed]);
    
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
        // Annulla eventuali richieste in corso
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
        if (selectedHost && !isLoading) {
            fetchHostDowntimes(selectedHost);
        }
    };
    
    // Aggiornamento manuale
    const handleRefresh = () => {
        if (selectedHost && !isLoading && lastRefreshed) {
            fetchHostDowntimes(selectedHost);
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
                            disabled={!selectedHost || isLoading || !lastRefreshed}
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
                            disabled={!selectedHost || isLoading}
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
                            onClick={() => selectedHost && fetchHostDowntimes(selectedHost)}
                            style={{ marginTop: '10px' }}
                        >
                            Riprova
                        </button>
                    )}
                </div>
            )}
            
            {!selectedHost && !isLoading && !error && (
                <div className="filter-notice">
                    <p>Seleziona un host specifico e clicca su "Cerca" per visualizzare i downtime.</p>
                </div>
            )}
            
            {selectedHost && !isLoading && !error && !lastRefreshed && (
                <div className="filter-notice">
                    <p>Host selezionato: {selectedHost}. Clicca su "Cerca" per visualizzare i downtime.</p>
                </div>
            )}
            
            {selectedHost && !isLoading && !error && lastRefreshed && downtimes.length === 0 && (
                <div className="no-results">
                    <p>Nessun downtime trovato per l'host selezionato.</p>
                </div>
            )}
            
            {!isLoading && !error && lastRefreshed && selectedHost && downtimes.length > 0 && (
                <>
                    <div className="results-count">
                        Trovati {downtimes.length} downtime per {selectedHost}, di cui {activeDowntimes} attualmente attivi
                    </div>
                    <table className="downtime-table">
                        <thead>
                            <tr>
                                <th>Host</th>
                                <th>Cliente</th>
                                <th>Inizio</th>
                                <th>Fine</th>
                                <th>Autore</th>
                                <th>Commento</th>
                            </tr>
                        </thead>
                        <tbody>
                            {downtimes.map((dt, idx) => {
                                const hostName = dt.extensions?.host_name || 'N/A';
                                const clientFolder = hostFolderMap.get(hostName) || '/';
                                
                                // Controlla se il downtime è attivo
                                const now = new Date();
                                const startTime = dt.extensions?.start_time ? new Date(dt.extensions.start_time) : null;
                                const endTime = dt.extensions?.end_time ? new Date(dt.extensions.end_time) : null;
                                const isActive = startTime && endTime && startTime <= now && endTime >= now;
                                
                                return (
                                    <tr key={idx} className={isActive ? 'active-downtime' : ''}>
                                        <td>{hostName}</td>
                                        <td>{clientFolder}</td>
                                        <td>{startTime ? startTime.toLocaleString() : 'N/A'}</td>
                                        <td>{endTime ? endTime.toLocaleString() : 'N/A'}</td>
                                        <td>{dt.extensions?.author || 'N/A'}</td>
                                        <td>{dt.extensions?.comment || 'N/A'}</td>
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