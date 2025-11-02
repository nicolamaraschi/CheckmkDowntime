import React, { useState, useEffect } from 'react';
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
    
    const { data: hostsData, loading: hostsLoading, error: hostsError } = useApi('hosts');
    const { token } = useAuth();
    
    // Funzione per recuperare i downtime di un host specifico
    const fetchHostDowntimes = async (hostname) => {
        setIsLoading(true);
        setError(null);
        
        try {
            // Usa il token di autenticazione dal contesto
            const response = await fetch(`/api/downtimes?host=${encodeURIComponent(hostname)}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Errore: ${response.status}`);
            }
            
            const data = await response.json();
            setDowntimes(data.downtimes || []);
            setFromCache(data.fromCache || false);
            
        } catch (err) {
            console.error("Errore nel recupero dei downtime:", err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    // Recupera tutti i downtime o solo quelli dell'host selezionato
    useEffect(() => {
        if (hostsLoading) return;
        
        if (selectedHost) {
            // Se è selezionato un host specifico, carica i suoi downtime
            fetchHostDowntimes(selectedHost);
        } else if (selectedClient) {
            // Se è selezionato solo un cliente, non possiamo filtrare direttamente
            // nell'API, quindi mostreremo un messaggio informativo
            setDowntimes([]);
        } else {
            // Se non è selezionato nulla, mostra che deve essere selezionato un host
            setDowntimes([]);
        }
    }, [selectedClient, selectedHost, hostsLoading, token]);
    
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
        setSelectedClient('');
        setSelectedHost('');
        setDowntimes([]);
    };
    
    if (hostsLoading || isLoading) {
        return (
            <div className="downtime-container">
                <h1>Downtime Esistenti</h1>
                <Loader text="Caricamento..." />
            </div>
        );
    }
    
    if (hostsError || error) {
        return (
            <div className="downtime-container">
                <h1>Downtime Esistenti</h1>
                <div className="error-card">
                    <h2>Errore</h2>
                    <p>{hostsError || error}</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="downtime-container">
            <h1>Downtime Esistenti</h1>
            
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
                            className="reset-button"
                            onClick={handleReset}
                        >
                            Resetta Filtri
                        </button>
                    </div>
                </div>
            </div>
            
            {!selectedHost && (
                <div className="filter-notice">
                    <p>Seleziona un host specifico per visualizzare i suoi downtime.</p>
                </div>
            )}
            
            {selectedHost && downtimes.length === 0 ? (
                <div className="no-results">
                    <p>Nessun downtime trovato per l'host selezionato.</p>
                </div>
            ) : selectedHost && downtimes.length > 0 ? (
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
            ) : null}
        </div>
    );
};

export default ExistingDowntimes;