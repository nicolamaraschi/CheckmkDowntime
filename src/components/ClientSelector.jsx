import React, { useState, useMemo } from 'react';
import { useApi } from '../hooks/useApi';

const ClientSelector = ({ selectedClient, setSelectedClient, selectedClients, setSelectedClients }) => {
    const { data, loading, error } = useApi('clients');
    const [searchTerm, setSearchTerm] = useState('');

    const clients = data ? [...data].sort() : [];

    // Determine mode
    const isMultiSelect = selectedClients !== undefined && setSelectedClients !== undefined;

    // Filter clients based on search
    const filteredClients = useMemo(() => {
        if (!searchTerm) return clients;
        return clients.filter(c => c.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [clients, searchTerm]);

    // Single-select mode handlers
    const handleSingleChange = (e) => {
        setSelectedClient(e.target.value);
    };

    // Multi-select mode handlers
    const toggleClient = (client) => {
        setSelectedClients(prev => {
            if (prev.includes(client)) {
                return prev.filter(c => c !== client);
            } else {
                return [...prev, client];
            }
        });
    };

    const handleSelectAll = () => {
        const isAllSelected = filteredClients.length > 0 && filteredClients.every(c => selectedClients.includes(c));
        if (isAllSelected) {
            // Deselect all visible clients
            setSelectedClients(prev => prev.filter(c => !filteredClients.includes(c)));
        } else {
            // Select all visible clients
            const newSelection = new Set([...selectedClients, ...filteredClients]);
            setSelectedClients(Array.from(newSelection));
        }
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

    // SINGLE SELECT MODE (Original dropdown)
    if (!isMultiSelect) {
        return (
            <select value={selectedClient} onChange={handleSingleChange}>
                <option value="">-- Seleziona un cliente --</option>
                {clients.map(client => (
                    <option key={client} value={client}>
                        {client}
                    </option>
                ))}
            </select>
        );
    }

    // MULTI SELECT MODE (Checkbox list)
    const isAllSelected = filteredClients.length > 0 && filteredClients.every(c => selectedClients.includes(c));

    return (
        <div className="client-selector-container">
            <div className="client-selector-header">
                <input
                    type="text"
                    placeholder="🔍 Cerca cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="client-search-input"
                />
                <button
                    type="button"
                    className={`btn btn-xs ${isAllSelected ? 'btn-secondary' : 'btn-primary'}`}
                    onClick={handleSelectAll}
                >
                    {isAllSelected ? 'Deseleziona Tutti' : 'Seleziona Tutti'}
                </button>
            </div>
            <div className="client-selector-list">
                {filteredClients.length === 0 ? (
                    <div className="p-md text-center text-muted">Nessun cliente trovato</div>
                ) : (
                    filteredClients.map(client => (
                        <label key={client} className={`client-item ${selectedClients.includes(client) ? 'selected' : ''}`}>
                            <input
                                type="checkbox"
                                checked={selectedClients.includes(client)}
                                onChange={() => toggleClient(client)}
                            />
                            <span className="client-name">{client}</span>
                        </label>
                    ))
                )}
            </div>
            <div className="client-selector-footer">
                {selectedClients.length} clienti selezionati su {clients.length}
            </div>
        </div>
    );
};

export default ClientSelector;
