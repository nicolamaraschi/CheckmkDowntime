import React, { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import '../styles/sap-dashboard.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const COLORS = ['#FF6B35', '#F7931E', '#FDC830', '#F37335', '#FF8C42', '#FF6F61'];

const SapDashboard = () => {
    // State per filtri
    const [startDate, setStartDate] = useState('2025-09-01');
    const [endDate, setEndDate] = useState('2025-10-01');
    const [availableClients, setAvailableClients] = useState([]);
    const [selectedClients, setSelectedClients] = useState([]);
    const [availableSids, setAvailableSids] = useState([]);
    const [selectedSids, setSelectedSids] = useState([]);

    // State per dati
    const [kpis, setKpis] = useState({
        totalDumps: 0,
        failedBackups: 0,
        cancelledJobs: 0
    });
    const [dumpTypesData, setDumpTypesData] = useState([]);
    const [clientIssuesData, setClientIssuesData] = useState([]);
    const [timelineData, setTimelineData] = useState([]);
    const [issuesTableData, setIssuesTableData] = useState([]);

    // State UI
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Carica filtri iniziali
    useEffect(() => {
        fetchFilters();
    }, []);

    // Carica dati dashboard iniziali
    useEffect(() => {
        if (availableClients.length > 0) {
            handleApplyFilters();
        }
    }, [availableClients]);

    // Aggiorna SID disponibili quando cambiano i clienti selezionati
    useEffect(() => {
        if (selectedClients.length > 0) {
            fetchSidsForClients(selectedClients);
        } else {
            setAvailableSids([]);
            setSelectedSids([]);
        }
    }, [selectedClients]);

    const fetchFilters = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/sap/filters`);
            const data = await response.json();
            setAvailableClients(data.clients || []);
            setAvailableSids(data.sids || []);
        } catch (err) {
            console.error('Errore caricamento filtri:', err);
            setError('Impossibile caricare i filtri');
        }
    };

    const fetchSidsForClients = async (clients) => {
        try {
            const response = await fetch(`${API_BASE_URL}/sap/sids`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clients })
            });
            const data = await response.json();
            setAvailableSids(data.sids || []);
        } catch (err) {
            console.error('Errore caricamento SID:', err);
        }
    };

    const handleApplyFilters = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE_URL}/sap/dashboard`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    startDate,
                    endDate,
                    clients: selectedClients,
                    sids: selectedSids
                })
            });

            if (!response.ok) {
                throw new Error('Errore nel caricamento dei dati');
            }

            const data = await response.json();

            // Aggiorna KPI
            setKpis(data.kpis || { totalDumps: 0, failedBackups: 0, cancelledJobs: 0 });

            // Prepara dati per Pie Chart (Dump Types)
            const dumpTypes = (data.dumpTypes?.labels || []).map((label, index) => ({
                name: label,
                value: data.dumpTypes.data[index] || 0
            }));
            setDumpTypesData(dumpTypes);

            // Prepara dati per Bar Chart (Client Issues)
            const clientIssues = (data.clientIssues?.labels || []).map((label, index) => ({
                name: label,
                dumps: data.clientIssues.dumps[index] || 0,
                backups: data.clientIssues.failed_backups[index] || 0,
                jobs: data.clientIssues.cancelled_jobs[index] || 0
            }));
            setClientIssuesData(clientIssues);

            // Prepara dati per Line Chart (Timeline)
            const timeline = (data.timeline?.dates || []).map((date, index) => ({
                date,
                dumps: data.timeline.dumps[index] || 0,
                backups: data.timeline.failed_backups[index] || 0,
                jobs: data.timeline.cancelled_jobs[index] || 0
            }));
            setTimelineData(timeline);

            // Tabella issues
            setIssuesTableData(data.issuesTable || []);

        } catch (err) {
            console.error('Errore caricamento dashboard:', err);
            setError('Errore nel caricamento dei dati. Verifica la configurazione AWS.');
        } finally {
            setLoading(false);
        }
    };

    const handleClientChange = (e) => {
        const options = Array.from(e.target.selectedOptions, option => option.value);
        setSelectedClients(options);
    };

    const handleSidChange = (e) => {
        const options = Array.from(e.target.selectedOptions, option => option.value);
        setSelectedSids(options);
    };

    return (
        <div className="sap-dashboard">
            {/* Header */}
            <header className="sap-header">
                <div className="header-content">
                    <div className="header-icon">💾</div>
                    <div className="header-text">
                        <h1>SAP System Control</h1>
                        <p>Monitoraggio sistemi SAP - Dumps, Backup e Job</p>
                    </div>
                </div>
            </header>

            {/* Filtri */}
            <section className="filters-section card">
                <h3>🔍 Filtri</h3>
                <div className="filters-grid">
                    <div className="filter-item">
                        <label>📅 Data Inizio:</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                    <div className="filter-item">
                        <label>📅 Data Fine:</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                    <div className="filter-item">
                        <label>🏢 Clienti:</label>
                        <select
                            multiple
                            value={selectedClients}
                            onChange={handleClientChange}
                            disabled={loading || availableClients.length === 0}
                            className="multi-select"
                        >
                            {availableClients.map(client => (
                                <option key={client} value={client}>{client}</option>
                            ))}
                        </select>
                        <small>{selectedClients.length} selezionati</small>
                    </div>
                    <div className="filter-item">
                        <label>🎯 SID:</label>
                        <select
                            multiple
                            value={selectedSids}
                            onChange={handleSidChange}
                            disabled={loading || availableSids.length === 0}
                            className="multi-select"
                        >
                            {availableSids.map(sid => (
                                <option key={sid} value={sid}>{sid}</option>
                            ))}
                        </select>
                        <small>{selectedSids.length} selezionati</small>
                    </div>
                </div>
                <button
                    onClick={handleApplyFilters}
                    disabled={loading}
                    className="btn-apply"
                >
                    {loading ? '⏳ Caricamento...' : '🔍 Applica Filtri'}
                </button>
            </section>

            {/* Errore */}
            {error && (
                <div className="alert alert-error">
                    <span className="alert-icon">❌</span>
                    <div className="alert-content">
                        <strong>Errore</strong>
                        <p>{error}</p>
                    </div>
                </div>
            )}

            {/* KPI Cards */}
            {!loading && !error && (
                <>
                    <section className="kpi-section">
                        <div className="kpi-card">
                            <div className="kpi-icon">💥</div>
                            <div className="kpi-content">
                                <h3>Total Dumps</h3>
                                <p className="kpi-value">{kpis.totalDumps}</p>
                            </div>
                        </div>
                        <div className="kpi-card">
                            <div className="kpi-icon">💾</div>
                            <div className="kpi-content">
                                <h3>Failed Backups</h3>
                                <p className="kpi-value">{kpis.failedBackups}</p>
                            </div>
                        </div>
                        <div className="kpi-card">
                            <div className="kpi-icon">⚠️</div>
                            <div className="kpi-content">
                                <h3>Cancelled Jobs</h3>
                                <p className="kpi-value">{kpis.cancelledJobs}</p>
                            </div>
                        </div>
                    </section>

                    {/* Grafici */}
                    <section className="charts-section">
                        <div className="chart-card">
                            <h3>📊 Problemi per Cliente/SID</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={clientIssuesData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="dumps" fill="#FF6B35" name="Dumps" />
                                    <Bar dataKey="backups" fill="#F7931E" name="Backup Falliti" />
                                    <Bar dataKey="jobs" fill="#FDC830" name="Job Cancellati" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="chart-card">
                            <h3>🥧 Distribuzione Tipi Dump</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={dumpTypesData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {dumpTypesData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="chart-card full-width">
                            <h3>📈 Timeline Problemi</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={timelineData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="dumps" stroke="#FF6B35" name="Dumps" strokeWidth={2} />
                                    <Line type="monotone" dataKey="backups" stroke="#F7931E" name="Backup Falliti" strokeWidth={2} />
                                    <Line type="monotone" dataKey="jobs" stroke="#FDC830" name="Job Cancellati" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </section>

                    {/* Tabella Issues */}
                    <section className="table-section card">
                        <h3>📋 Dettaglio Problemi per Cliente/SID</h3>
                        {issuesTableData.length > 0 ? (
                            <div className="table-wrapper">
                                <table className="issues-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>🏢 Cliente</th>
                                            <th>🎯 SID</th>
                                            <th>💥 Dumps</th>
                                            <th>💾 Backup Falliti</th>
                                            <th>⚠️ Job Cancellati</th>
                                            <th>📊 Totale</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {issuesTableData.map((row, index) => {
                                            const total = (row.dumps || 0) + (row.failed_backups || 0) + (row.cancelled_jobs || 0);
                                            return (
                                                <tr key={index}>
                                                    <td>{index + 1}</td>
                                                    <td>{row.nomecliente}</td>
                                                    <td><span className="sid-badge">{row.sid}</span></td>
                                                    <td>{row.dumps || 0}</td>
                                                    <td>{row.failed_backups || 0}</td>
                                                    <td>{row.cancelled_jobs || 0}</td>
                                                    <td><strong>{total}</strong></td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="empty-state">
                                <p>✅ Nessun problema rilevato nel periodo selezionato</p>
                            </div>
                        )}
                    </section>
                </>
            )}

            {/* Loading State */}
            {loading && (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Caricamento dati SAP...</p>
                </div>
            )}
        </div>
    );
};

export default SapDashboard;
