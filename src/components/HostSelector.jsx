import React, { useMemo, useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import '../styles/downtimeSchedule.css'; // Ensure styles are available

const HostSelector = ({ selectedHosts, setSelectedHosts, selectedHost, setSelectedHost, selectedClient = null, selectedClients = null }) => {
    const { data, loading, error } = useApi('hosts');
    const [searchTerm, setSearchTerm] = useState('');

    // Filter and sort hosts based on selected client(s)
    const hosts = useMemo(() => {
        if (!data) return [];

        // Handle both old format (array of strings) and new format (array of objects)
        const isOldFormat = typeof data[0] === 'string';
        let availableHosts = [];

        if (isOldFormat) {
            availableHosts = [...data].sort();
        } else {
            let filteredData = data;

            // Support both single client and multiple clients
            if (selectedClients && selectedClients.length > 0) {
                // Multi-client mode
                filteredData = data.filter(host => selectedClients.includes(host.folder));
            } else if (selectedClient) {
                // Single client mode (backward compatibility)
                filteredData = data.filter(host => host.folder === selectedClient);
            }

            availableHosts = filteredData.map(host => host.id).sort();
        }

        if (searchTerm) {
            return availableHosts.filter(h => h.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        return availableHosts;
    }, [data, selectedClient, selectedClients, searchTerm]);

    // Reset selection when client changes
    useEffect(() => {
        setSearchTerm('');
    }, [selectedClient, selectedClients]);

    // Determine mode
    const isSingleSelect = selectedHost !== undefined && setSelectedHost !== undefined;

    const toggleHost = (host) => {
        if (isSingleSelect) return;
        setSelectedHosts(prev => {
            if (prev.includes(host)) {
                return prev.filter(h => h !== host);
            } else {
                return [...prev, host];
            }
        });
    };

    const handleSelectAll = () => {
        if (isSingleSelect) return;

        // Safe check for selectedHosts
        const currentSelected = selectedHosts || [];
        const isAllSelected = hosts.length > 0 && hosts.every(h => currentSelected.includes(h));

        if (isAllSelected) {
            // Deselect all visible hosts, keep others
            setSelectedHosts(prev => prev.filter(h => !hosts.includes(h)));
        } else {
            // Select all visible hosts, keep others (union)
            const newSelection = new Set([...currentSelected, ...hosts]);
            setSelectedHosts(Array.from(newSelection));
        }
    };

    // Group hosts by client folder (MOVED BEFORE CONDITIONAL RETURNS)
    const hostsByClient = useMemo(() => {
        const groups = {};

        if (data && !Array.isArray(data[0])) {
            // New format with folder info
            let filteredData = data;

            if (selectedClients && selectedClients.length > 0) {
                filteredData = data.filter(host => selectedClients.includes(host.folder));
            } else if (selectedClient) {
                filteredData = data.filter(host => host.folder === selectedClient);
            }

            filteredData.forEach(host => {
                const folder = host.folder || '/';
                if (!groups[folder]) {
                    groups[folder] = [];
                }
                groups[folder].push(host.id);
            });
        }

        // Apply search filter to each group
        if (searchTerm) {
            Object.keys(groups).forEach(folder => {
                groups[folder] = groups[folder].filter(h =>
                    h.toLowerCase().includes(searchTerm.toLowerCase())
                );
            });
            // Remove empty groups
            Object.keys(groups).forEach(folder => {
                if (groups[folder].length === 0) {
                    delete groups[folder];
                }
            });
        }

        return groups;
    }, [data, selectedClient, selectedClients, searchTerm]);

    if (loading) {
        return <div className="p-md text-center text-muted">Caricamento host in corso...</div>;
    }

    if (error) {
        return <div className="p-md text-center text-error">Errore: {error}</div>;
    }

    if (!selectedClient && (!selectedClients || selectedClients.length === 0)) {
        return <div className="p-md text-center text-muted">Seleziona prima almeno un cliente.</div>;
    }

    if (hosts.length === 0) {
        return <div className="p-md text-center text-muted">Nessun host trovato per questo cliente.</div>;
    }

    // --- SINGLE SELECT MODE (Dropdown) ---
    if (isSingleSelect) {
        return (
            <select
                className="form-select"
                value={selectedHost}
                onChange={(e) => setSelectedHost(e.target.value)}
            >
                <option value="">-- Seleziona un host --</option>
                {hosts.map(host => (
                    <option key={host} value={host}>{host}</option>
                ))}
            </select>
        );
    }

    // --- MULTI SELECT MODE (List) ---
    const currentSelected = selectedHosts || [];
    const isAllSelected = hosts.length > 0 && hosts.every(h => currentSelected.includes(h));

    return (
        <div className="host-selector-container">
            <div className="host-selector-header">
                <input
                    type="text"
                    placeholder="🔍 Cerca host..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="host-search-input"
                />
                <button
                    type="button"
                    className={`btn btn-xs ${isAllSelected ? 'btn-secondary' : 'btn-primary'}`}
                    onClick={handleSelectAll}
                >
                    {isAllSelected ? 'Deseleziona Tutti' : 'Seleziona Tutti'}
                </button>
            </div>
            <div className="host-selector-list">
                {Object.keys(hostsByClient).length === 0 ? (
                    <div className="p-md text-center text-muted">Nessun host trovato</div>
                ) : (
                    Object.entries(hostsByClient).map(([folder, folderHosts]) => (
                        <div key={folder} className="host-group">
                            <div className="host-group-header">
                                <span className="host-group-title">{folder}</span>
                                <span className="host-group-count">({folderHosts.length})</span>
                            </div>
                            <div className="host-group-items">
                                {folderHosts.map(host => (
                                    <label key={host} className={`host-item ${currentSelected.includes(host) ? 'selected' : ''}`}>
                                        <input
                                            type="checkbox"
                                            checked={currentSelected.includes(host)}
                                            onChange={() => toggleHost(host)}
                                        />
                                        <span className="host-name">{host}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
            <div className="host-selector-footer">
                {currentSelected.length} host selezionati su {hosts.length}
            </div>
        </div>
    );
};

export default HostSelector;
