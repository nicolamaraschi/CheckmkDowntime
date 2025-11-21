import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import '../styles/cloudconnexa-dashboard.css';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function CloudConnexaDashboard() {
    const { post } = useApi();
    const [filters, setFilters] = useState({
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        users: [],
        gateways: []
    });

    const [dashboardData, setDashboardData] = useState(null);
    const [filterOptions, setFilterOptions] = useState({ users: [], gateways: [] });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Carica opzioni filtri all'avvio
    useEffect(() => {
        loadFilterOptions();
    }, []);

    // Carica dati dashboard quando cambiano i filtri
    useEffect(() => {
        if (filters.startDate && filters.endDate) {
            loadDashboardData();
        }
    }, [filters]);

    const loadFilterOptions = async () => {
        try {
            const response = await fetch('/api/cloudconnexa/filters');
            const data = await response.json();
            setFilterOptions(data);
        } catch (err) {
            console.error('Errore caricamento filtri:', err);
        }
    };

    const loadDashboardData = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await post('/cloudconnexa/dashboard', filters);
            setDashboardData(data);
        } catch (err) {
            console.error('Errore caricamento dashboard:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    if (loading && !dashboardData) {
        return <div className="dashboard-loading">Caricamento dashboard...</div>;
    }

    const sessionStats = dashboardData?.sessionStats?.[0] || {};
    const blockedStats = dashboardData?.blockedDomains?.[0] || {};

    return (
        <div className="cloudconnexa-dashboard">
            <header className="dashboard-header">
                <h1>📊 CloudConnexa Dashboard</h1>
                <p>Monitoraggio sessioni VPN e sicurezza</p>
            </header>

            {/* Filtri */}
            <div className="dashboard-filters card">
                <div className="filter-row">
                    <div className="filter-item">
                        <label>Data Inizio:</label>
                        <input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => handleFilterChange('startDate', e.target.value)}
                        />
                    </div>
                    <div className="filter-item">
                        <label>Data Fine:</label>
                        <input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => handleFilterChange('endDate', e.target.value)}
                        />
                    </div>
                    <div className="filter-item">
                        <label>Utenti:</label>
                        <select
                            multiple
                            value={filters.users}
                            onChange={(e) => handleFilterChange('users', Array.from(e.target.selectedOptions, o => o.value))}
                            className="multi-select"
                        >
                            {(filterOptions?.users || []).map(user => (
                                <option key={user} value={user}>{user}</option>
                            ))}
                        </select>
                    </div>
                    <div className="filter-item">
                        <label>Gateway:</label>
                        <select
                            multiple
                            value={filters.gateways}
                            onChange={(e) => handleFilterChange('gateways', Array.from(e.target.selectedOptions, o => o.value))}
                            className="multi-select"
                        >
                            {(filterOptions?.gateways || []).map(gw => (
                                <option key={gw} value={gw}>{gw}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            {dashboardData && (
                <>
                    {/* KPI Cards */}
                    <div className="kpi-grid">
                        <div className="kpi-card">
                            <div className="kpi-icon">🔗</div>
                            <div className="kpi-content">
                                <h3>{sessionStats.total_sessions || 0}</h3>
                                <p>Sessioni Totali</p>
                            </div>
                        </div>
                        <div className="kpi-card">
                            <div className="kpi-icon">👥</div>
                            <div className="kpi-content">
                                <h3>{sessionStats.unique_users || 0}</h3>
                                <p>Utenti Unici</p>
                            </div>
                        </div>
                        <div className="kpi-card">
                            <div className="kpi-icon">📊</div>
                            <div className="kpi-content">
                                <h3>{(parseFloat(sessionStats.total_bytes_in_gb || 0) + parseFloat(sessionStats.total_bytes_out_gb || 0)).toFixed(2)} GB</h3>
                                <p>Traffico Totale</p>
                            </div>
                        </div>
                        <div className="kpi-card alert">
                            <div className="kpi-icon">🛡️</div>
                            <div className="kpi-content">
                                <h3>{blockedStats.total_blocked || 0}</h3>
                                <p>Domini Bloccati</p>
                            </div>
                        </div>
                    </div>

                    {/* Grafici */}
                    <div className="charts-grid">
                        {/* Timeline Sessioni */}
                        <div className="chart-card">
                            <h3>Timeline Sessioni</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={dashboardData.sessionsTimeline || []}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="session_count" stroke="#8884d8" name="Sessioni" />
                                    <Line type="monotone" dataKey="unique_users" stroke="#82ca9d" name="Utenti" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Top Utenti */}
                        <div className="chart-card">
                            <h3>Top 10 Utenti per Traffico</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={dashboardData.topUsers || []}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="username" angle={-45} textAnchor="end" height={100} />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="total_traffic_gb" fill="#8884d8" name="Traffico (GB)" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Distribuzione Gateway */}
                        <div className="chart-card">
                            <h3>Distribuzione Gateway</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={dashboardData.gatewayDistribution || []}
                                        dataKey="session_count"
                                        nameKey="gateway_region"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        label
                                    >
                                        {(dashboardData.gatewayDistribution || []).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Protocolli */}
                        <div className="chart-card">
                            <h3>Protocolli Utilizzati</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={dashboardData.protocolDistribution || []}
                                        dataKey="count"
                                        nameKey="protocol"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        label
                                    >
                                        {(dashboardData.protocolDistribution || []).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Tabelle */}
                    <div className="tables-grid">
                        {/* Top Destinazioni */}
                        <div className="table-card card">
                            <h3>Top Destinazioni</h3>
                            <div className="table-responsive">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>IP Destinazione</th>
                                            <th>Porta</th>
                                            <th>Protocollo</th>
                                            <th>Connessioni</th>
                                            <th>Utenti</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(dashboardData.topDestinations || []).map((dest, idx) => (
                                            <tr key={idx}>
                                                <td>{dest.destination_ip}</td>
                                                <td>{dest.destination_port}</td>
                                                <td>{dest.protocol}</td>
                                                <td>{dest.connection_count}</td>
                                                <td>{dest.unique_users}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Domini Bloccati per Categoria */}
                        <div className="table-card card">
                            <h3>Domini Bloccati per Categoria</h3>
                            <div className="table-responsive">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Categoria</th>
                                            <th>Blocchi</th>
                                            <th>Domini Unici</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(dashboardData.blockedByCategory || []).map((cat, idx) => (
                                            <tr key={idx}>
                                                <td>{cat.category}</td>
                                                <td>{cat.count}</td>
                                                <td>{cat.unique_domains}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
