import React from 'react';
import { useApi } from '../hooks/useApi';

const HostSelector = ({ selectedHost, setSelectedHost }) => {
    const { data, loading, error } = useApi('hosts');
    
    const hosts = data ? [...data].sort() : [];

    const handleChange = (e) => {
        setSelectedHost(e.target.value);
    };

    if (loading) {
        return (
            <select disabled>
                <option>Caricamento host in corso...</option>
            </select>
        );
    }

    if (error) {
        return (
            <select disabled style={{ borderColor: 'red' }}>
                <option>Errore nel caricamento host: {error}</option>
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
