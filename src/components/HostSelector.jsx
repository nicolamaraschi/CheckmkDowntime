import React from 'react';
import { useApi } from '../hooks/useApi';

const HostSelector = ({ selectedHost, setSelectedHost }) => {
    // Rimosso "/api" dal percorso - useApi lo aggiungerà
    const { data, loading, error } = useApi('hosts');
    
    // Estrai la lista di host, ordina alfabeticamente
    const hosts = data ? [...data.hosts].sort() : [];

    const handleChange = (e) => {
        setSelectedHost(e.target.value);
    };

    if (loading) {
        return (
            <select disabled>
                <option>Caricamento host in corso (può richiedere fino a 30s)...</option>
            </select>
        );
    }

    if (error) {
        return (
            <select disabled style={{ borderColor: 'red' }}>
                <option>Errore nel caricamento host: {error.message}</option>
            </select>
        );
    }

    return (
        <select value={selectedHost} onChange={handleChange}>
            <option value="">-- Seleziona un host --</option>
            {hosts.map(host => (
                <option key={host} value={host}>
                    {host}
                </option>
            ))}
        </select>
    );
};

export default HostSelector;