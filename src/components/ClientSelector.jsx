import React from 'react';
import { useApi } from '../hooks/useApi';

const ClientSelector = ({ selectedClient, setSelectedClient }) => {
    const { data, loading, error } = useApi('clients');

    const clients = data ? [...data].sort() : [];

    const handleChange = (e) => {
        setSelectedClient(e.target.value);
    };

    if (loading) {
        return (
            <select disabled>
                <option>Caricamento clienti in corso...</option>
            </select>
        );
    }

    if (error) {
        return (
            <select disabled style={{ borderColor: 'red' }}>
                <option>Errore nel caricamento clienti: {error}</option>
            </select>
        );
    }

    return (
        <select value={selectedClient} onChange={handleChange}>
            <option value="">-- Seleziona un cliente --</option>
            {clients.map(client => (
                <option key={client} value={client}>
                    {client}
                </option>
            ))}
        </select>
    );
};

export default ClientSelector;
