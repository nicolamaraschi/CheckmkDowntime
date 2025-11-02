import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import '../styles/existingDowntimes.css';
import Loader from '../components/Loader';
import ClientSelector from '../components/ClientSelector';
import HostSelector from '../components/HostSelector';
import { useAuth } from '../auth/AuthProvider';

const ExistingDowntimes = () => {
    const [selectedClient, setSelectedClient] = useState('');
    const [selectedHost, setSelectedHost] = useState('');
    const [downtimes, setDowntimes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [fromCache, setFromCache] = useState(false);
    
    const { data: hostsData, loading: hostsLoading } = useApi('hosts');
    const { token } = useAuth();
    
    // Carica i downtime con filtri applicati
    useEffect(() => {
        const fetchDowntimes = async () => {
            if (hostsLoading) return; // Aspetta che i dati degli host siano caricati
            
            setIsLoading(true);
            setError(null);
            
            try {
                // Costruisci l'URL con i parametri di query
                let url = '/api/downtimes';
                const queryParams = [];
                
                if (selectedHost) {
                    queryParams.push(`host=${encodeURIComponent(selectedHost)}`);
                } else if (selectedClient) {
                    queryParams.push(`client=${encodeURIComponent(selectedClient)}`);
                }
                
                if (queryParams.length > 0) {
                    url += '?' + queryParams.join('&');
                }
                
                const response = await fetch(url, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`Errore API: ${response.status}`);
                }
                
                const result = await response.json();
                setDowntimes(result.downtimes || []);
                setFromCache(result.fromCache || false);
                
            } catch (err) {
                console.error('Errore nel caricamento dei downtime:', err);
                setError(err.message || 'Si è verificato un errore nel caricamento dei downtime');
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchDowntimes();
    }, [selectedClient, selectedHost, hostsLoading, token]);
    
    // Crea una mappa degli host per ottenere le informazioni sul cliente
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
    
    const handleReset = () => {
        setSelectedClient('');
        setSelectedHost('');
    };
    
    if (isLoading || hostsLoading) {
        return (
            <div className="downtime-container">
                <h1>Downtime Esistenti</h1>
                <Loader text="Caricamento downtimes..." />
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="downtime-container">
                <h1>Downtime Esistenti</h1>
                <div className="error-card">
                    <h2>Errore nel caricamento</h2>
                    <p>{error}</p>
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
            
            {downtimes.length === 0 ? (
                <div className="no-results">
                    <p>Nessun downtime trovato con i filtri selezionati.</p>
                </div>
            ) : (
                <>
                    <div className="results-count">
                        Trovati {downtimes.length} downtime totali, di cui {activeDowntimes} attualmente attivi
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