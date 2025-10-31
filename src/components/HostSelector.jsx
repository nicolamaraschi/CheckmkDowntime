// Salva come: src/components/HostSelector.jsx

import React from 'react';
import { useApi } from '../hooks/useApi';

const HostSelector = ({ selectedHost, setSelectedHost }) => {
    // Chiama l'API per /api/hosts
    const { data, loading, error } = useApi('/api/hosts');

    // Estrai la lista di host, ordina alfabeticamente
    // Aggiunto .sort() per ordine alfabetico
    const hosts = data ? [...data.hosts].sort() : [];

    const handleChange = (e) => {
        setSelectedHost(e.target.value);
    };

    // --- Gestione Caricamento ---
    if (loading) {
        return (
            <select disabled>
                <option>Caricamento host in corso (può richiedere fino a 30s)...</option>
            </select>
        );
    }

    // --- Gestione Errore ---
    if (error) {
        return (
            <select disabled style={{ borderColor: 'red' }}>
                <option>Errore nel caricamento host: {error.message}</option>
            </select>
        );
    }

    // --- Render Normale ---
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