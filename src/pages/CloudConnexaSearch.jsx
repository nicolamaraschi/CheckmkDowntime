import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import * as XLSX from 'xlsx';
import useApi from '../hooks/useApi';
import '../styles/CloudConnexa.css';

const SEARCH_CONFIGS = {
    'flow-established': {
        title: '🔍 Ricerca Flussi di Rete',
        description: 'Analizza le connessioni di rete stabilite dagli utenti VPN',
        icon: '🌐',
        fields: {
            'timestamp': { label: 'Data/Ora', icon: '📅', type: 'datetime' },
            'UserName': { label: 'Utente', icon: '👤', type: 'text' },
            'UserNameGroup': { label: 'Gruppo', icon: '👥', type: 'text' },
            'DestinationIP': { label: 'IP Destinazione', icon: '🎯', type: 'text' },
            'DestinationPort': { label: 'Porta', icon: '🔌', type: 'number' },
            'Customer': { label: 'Cliente', icon: '🏢', type: 'text' },
        },
        defaultSelect: ['timestamp', 'UserName', 'DestinationIP', 'DestinationPort', 'Customer'],
    },
    'domain-blocked': {
        title: '🛡️ Ricerca Domini Bloccati',
        description: 'Analizza i tentativi di accesso a domini bloccati dal firewall',
        icon: '🚫',
        fields: {
            'timestamp': { label: 'Data/Ora', icon: '📅', type: 'datetime' },
            'parententityname': { label: 'Utente', icon: '👤', type: 'text' },
            'dominio_bloccato': { label: 'Dominio', icon: '🌐', type: 'text' },
            'categoria_dominio': { label: 'Categoria', icon: '🏷️', type: 'text' },
        },
        defaultSelect: ['timestamp', 'parententityname', 'dominio_bloccato', 'categoria_dominio'],
    },
};

const OPERATORS = [
    { value: '=', label: 'Uguale a', icon: '=' },
    { value: 'LIKE', label: 'Contiene', icon: '≈' },
    { value: '!=', label: 'Diverso da', icon: '≠' },
    { value: '>', label: 'Maggiore di', icon: '>' },
    { value: '<', label: 'Minore di', icon: '<' },
];

export default function CloudConnexaSearch() {
    const { type } = useParams();
    const { post, loading: apiLoading, error: apiError } = useApi();

    const config = SEARCH_CONFIGS[type] || SEARCH_CONFIGS['flow-established'];
    const [filters, setFilters] = useState([{ field: Object.keys(config.fields)[0], operator: '=', value: '' }]);
    const [selectedFields, setSelectedFields] = useState(config.defaultSelect);
    const [results, setResults] = useState(null);
    const [showFilters, setShowFilters] = useState(true);

    useEffect(() => {
        const newConfig = SEARCH_CONFIGS[type] || SEARCH_CONFIGS['flow-established'];
        setFilters([{ field: Object.keys(newConfig.fields)[0], operator: '=', value: '' }]);
        setSelectedFields(newConfig.defaultSelect);
        setResults(null);
    }, [type]);

    const handleSearch = async () => {
        const activeFilters = filters.filter(f => String(f.value).trim() !== '');
        if (activeFilters.length === 0) {
            alert('⚠️ Aggiungi almeno un filtro per effettuare la ricerca');
            return;
        }
        try {
            const data = await post(`/logs/${type}`, {
                filters: activeFilters,
                selectFields: selectedFields
            });
            setResults(data);
        } catch (err) {
            console.error("Errore ricerca:", err);
        }
    };

    const exportToXLSX = () => {
        if (!results || results.length === 0) return;
        const worksheet = XLSX.utils.json_to_sheet(results);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Risultati");
        XLSX.writeFile(workbook, `cloudconnexa_${type}_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const updateFilter = (index, key, val) => {
        const newFilters = [...filters];
        newFilters[index][key] = val;
        setFilters(newFilters);
    };

    const addFilter = () => {
        setFilters([...filters, { field: Object.keys(config.fields)[0], operator: '=', value: '' }]);
    };

    const removeFilter = (index) => {
        if (filters.length === 1) {
            setFilters([{ field: Object.keys(config.fields)[0], operator: '=', value: '' }]);
        } else {
            setFilters(filters.filter((_, i) => i !== index));
        }
    };

    const toggleField = (key) => {
        setSelectedFields(prev =>
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
    };

    const selectAllFields = () => {
        setSelectedFields(Object.keys(config.fields));
    };

    const deselectAllFields = () => {
        setSelectedFields([]);
    };

    return (
        <div className="cloudconnexa-search">
            {/* Header */}
            <div className="search-header">
                <div className="header-content">
                    <div className="header-icon">{config.icon}</div>
                    <div className="header-text">
                        <h1>{config.title}</h1>
                        <p>{config.description}</p>
                    </div>
                </div>
            </div>

            {/* Query Builder */}
            <div className="query-builder card">
                <div className="card-header" onClick={() => setShowFilters(!showFilters)}>
                    <h3>🔧 Costruisci la Query</h3>
                    <button className="toggle-btn">{showFilters ? '▼' : '▶'}</button>
                </div>

                {showFilters && (
                    <div className="card-body">
                        <div className="filters-container">
                            {filters.map((filter, index) => (
                                <div key={index} className="filter-row-modern">
                                    <div className="filter-number">{index + 1}</div>

                                    <div className="filter-field">
                                        <label>Campo</label>
                                        <select
                                            value={filter.field}
                                            onChange={(e) => updateFilter(index, 'field', e.target.value)}
                                            className="select-modern"
                                        >
                                            {Object.entries(config.fields).map(([key, { label, icon }]) => (
                                                <option key={key} value={key}>{icon} {label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="filter-operator">
                                        <label>Operatore</label>
                                        <select
                                            value={filter.operator}
                                            onChange={(e) => updateFilter(index, 'operator', e.target.value)}
                                            className="select-modern"
                                        >
                                            {OPERATORS.map(op => (
                                                <option key={op.value} value={op.value}>
                                                    {op.icon} {op.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="filter-value">
                                        <label>Valore</label>
                                        <input
                                            type={config.fields[filter.field]?.type === 'number' ? 'number' : 'text'}
                                            placeholder="Inserisci valore..."
                                            value={filter.value}
                                            onChange={(e) => updateFilter(index, 'value', e.target.value)}
                                            className="input-modern"
                                        />
                                    </div>

                                    <button
                                        className="btn-remove"
                                        onClick={() => removeFilter(index)}
                                        title="Rimuovi filtro"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            ))}
                        </div>

                        <button className="btn-add-filter" onClick={addFilter}>
                            ➕ Aggiungi Filtro
                        </button>
                    </div>
                )}
            </div>

            {/* Column Selector */}
            <div className="column-selector card">
                <div className="card-header">
                    <h3>📋 Colonne da Visualizzare</h3>
                    <div className="quick-actions">
                        <button className="btn-link" onClick={selectAllFields}>Seleziona tutto</button>
                        <span>•</span>
                        <button className="btn-link" onClick={deselectAllFields}>Deseleziona tutto</button>
                    </div>
                </div>
                <div className="card-body">
                    <div className="checkbox-grid">
                        {Object.entries(config.fields).map(([key, { label, icon }]) => (
                            <label key={key} className={`checkbox-card ${selectedFields.includes(key) ? 'selected' : ''}`}>
                                <input
                                    type="checkbox"
                                    checked={selectedFields.includes(key)}
                                    onChange={() => toggleField(key)}
                                />
                                <span className="checkbox-icon">{icon}</span>
                                <span className="checkbox-label">{label}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            {/* Search Actions */}
            <div className="search-actions">
                <button
                    className="btn-search"
                    onClick={handleSearch}
                    disabled={apiLoading || selectedFields.length === 0}
                >
                    {apiLoading ? (
                        <>⏳ Ricerca in corso...</>
                    ) : (
                        <>🔍 Cerca nei Log</>
                    )}
                </button>
                {selectedFields.length === 0 && (
                    <p className="warning-text">⚠️ Seleziona almeno una colonna</p>
                )}
            </div>

            {/* Error Message */}
            {apiError && (
                <div className="alert alert-error">
                    <span className="alert-icon">❌</span>
                    <div className="alert-content">
                        <strong>Errore durante la ricerca</strong>
                        <p>{apiError}</p>
                    </div>
                </div>
            )}

            {/* Results */}
            {results && (
                <div className="results-section card">
                    <div className="card-header">
                        <div className="results-info">
                            <h3>📊 Risultati</h3>
                            <span className="results-count">{results.length} record trovati</span>
                        </div>
                        <button className="btn-export" onClick={exportToXLSX} disabled={results.length === 0}>
                            📥 Esporta Excel
                        </button>
                    </div>
                    <div className="card-body">
                        {results.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">🔍</div>
                                <h3>Nessun risultato trovato</h3>
                                <p>Prova a modificare i filtri di ricerca</p>
                            </div>
                        ) : (
                            <div className="table-container">
                                <table className="results-table">
                                    <thead>
                                        <tr>
                                            <th className="row-number">#</th>
                                            {selectedFields.map(field => (
                                                <th key={field}>
                                                    {config.fields[field]?.icon} {config.fields[field]?.label || field}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {results.map((row, i) => (
                                            <tr key={i}>
                                                <td className="row-number">{i + 1}</td>
                                                {selectedFields.map(field => (
                                                    <td key={field}>{row[field] || '-'}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}