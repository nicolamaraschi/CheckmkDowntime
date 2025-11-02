import React, { useMemo } from 'react';
import { useApi } from '../hooks/useApi';

const HostSelector = ({ selectedHost, setSelectedHost, selectedClient = null }) => {
    const { data, loading, error } = useApi('hosts');

    // Filter and sort hosts based on selected client
    const hosts = useMemo(() => {
        if (!data) return [];

        // Handle both old format (array of strings) and new format (array of objects)
        const isOldFormat = typeof data[0] === 'string';

        if (isOldFormat) {
            // Old format: just sort
            return [...data].sort();
        } else {
            // New format: filter by client and extract IDs
            let filteredHosts = data;

            if (selectedClient) {
                filteredHosts = data.filter(host => host.folder === selectedClient);
            }

            return filteredHosts.map(host => host.id).sort();
        }
    }, [data, selectedClient]);

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
        <select value={selectedHost} onChange={handleChange} disabled={selectedClient === null || selectedClient === ''}>
            <option value="">
                {selectedClient ? '-- Seleziona un host --' : '-- Prima seleziona un cliente --'}
            </option>
            {hosts.map(host => (
                <option key={host} value={host}>
                    {host}
                </option>
            ))}
        </select>
    );
};

export default HostSelector;
