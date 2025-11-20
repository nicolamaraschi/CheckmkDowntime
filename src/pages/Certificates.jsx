import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import '../styles/certificates.css';

const Certificates = () => {
    const [activeTab, setActiveTab] = useState('create');
    const [certificates, setCertificates] = useState([
        { id: 1, clientName: 'Acciaierie', certificateId: 'CERT-001', status: 'active', bucket: 'prod-bucket' },
        { id: 2, clientName: 'Attiva', certificateId: 'CERT-002', status: 'active', bucket: 'dev-bucket' },
        { id: 3, clientName: 'Cobo', certificateId: 'CERT-003', status: 'revoked', bucket: 'test-bucket' }
    ]);

    // Fetch clients from API
    const { data: clients, loading: clientsLoading } = useApi('clients');

    // Form states for Create
    const [newCert, setNewCert] = useState({
        clientName: '',
        certificateId: '',
        status: 'active',
        bucket: ''
    });

    // Form states for Revoke/Renew
    const [selectedCertId, setSelectedCertId] = useState('');

    const handleCreateCertificate = (e) => {
        e.preventDefault();
        const newCertificate = {
            id: certificates.length + 1,
            ...newCert
        };
        setCertificates([...certificates, newCertificate]);
        setNewCert({ clientName: '', certificateId: '', status: 'active', bucket: '' });
        alert('Certificato creato con successo!');
    };

    const handleRevokeCertificate = (e) => {
        e.preventDefault();
        setCertificates(certificates.map(cert =>
            cert.id === parseInt(selectedCertId) ? { ...cert, status: 'revoked' } : cert
        ));
        setSelectedCertId('');
        alert('Certificato revocato con successo!');
    };

    const handleRenewCertificate = (e) => {
        e.preventDefault();
        setCertificates(certificates.map(cert =>
            cert.id === parseInt(selectedCertId) ? { ...cert, status: 'active' } : cert
        ));
        setSelectedCertId('');
        alert('Certificato rinnovato con successo!');
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            active: { label: 'Attivo', class: 'status-active' },
            revoked: { label: 'Revocato', class: 'status-revoked' },
            expired: { label: 'Scaduto', class: 'status-expired' }
        };
        const statusInfo = statusMap[status] || { label: status, class: '' };
        return <span className={`status-badge ${statusInfo.class}`}>{statusInfo.label}</span>;
    };

    return (
        <div className="certificates-page">
            <header className="page-header">
                <h1>🛡️ Gestione Certificati</h1>
                <p>Crea, revoca e rinnova certificati per i tuoi clienti</p>
            </header>

            {/* Stats Dashboard */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">📊</div>
                    <div className="stat-content">
                        <h3>{certificates.length}</h3>
                        <p>Totale Certificati</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-content">
                        <h3>{certificates.filter(c => c.status === 'active').length}</h3>
                        <p>Attivi</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">❌</div>
                    <div className="stat-content">
                        <h3>{certificates.filter(c => c.status === 'revoked').length}</h3>
                        <p>Revocati</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs-container">
                <div className="tabs-header">
                    <button
                        className={`tab-button ${activeTab === 'create' ? 'active' : ''}`}
                        onClick={() => setActiveTab('create')}
                    >
                        ➕ Crea Certificato
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'revoke' ? 'active' : ''}`}
                        onClick={() => setActiveTab('revoke')}
                    >
                        🚫 Revoca Certificato
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'renew' ? 'active' : ''}`}
                        onClick={() => setActiveTab('renew')}
                    >
                        🔄 Rinnova Certificato
                    </button>
                </div>

                <div className="tab-content">
                    {/* CREATE TAB */}
                    {activeTab === 'create' && (
                        <div className="tab-panel">
                            <h2>Crea Nuovo Certificato</h2>
                            <form onSubmit={handleCreateCertificate} className="cert-form">
                                <div className="form-group">
                                    <label>Nome Cliente (Checkmk)</label>
                                    <select
                                        value={newCert.clientName}
                                        onChange={(e) => setNewCert({ ...newCert, clientName: e.target.value })}
                                        required
                                        disabled={clientsLoading}
                                    >
                                        <option value="">-- Seleziona Cliente --</option>
                                        {clients && clients.map(client => (
                                            <option key={client} value={client}>{client}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>ID Certificato</label>
                                    <input
                                        type="text"
                                        value={newCert.certificateId}
                                        onChange={(e) => setNewCert({ ...newCert, certificateId: e.target.value })}
                                        placeholder="es. CERT-001"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Stato Iniziale</label>
                                    <select
                                        value={newCert.status}
                                        onChange={(e) => setNewCert({ ...newCert, status: e.target.value })}
                                    >
                                        <option value="active">Attivo</option>
                                        <option value="revoked">Revocato</option>
                                        <option value="expired">Scaduto</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Bucket (opzionale)</label>
                                    <input
                                        type="text"
                                        value={newCert.bucket}
                                        onChange={(e) => setNewCert({ ...newCert, bucket: e.target.value })}
                                        placeholder="es. prod-bucket"
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary">Crea Certificato</button>
                            </form>
                        </div>
                    )}

                    {/* REVOKE TAB */}
                    {activeTab === 'revoke' && (
                        <div className="tab-panel">
                            <h2>Revoca Certificato</h2>
                            <form onSubmit={handleRevokeCertificate} className="cert-form">
                                <div className="form-group">
                                    <label>Seleziona Certificato da Revocare</label>
                                    <select
                                        value={selectedCertId}
                                        onChange={(e) => setSelectedCertId(e.target.value)}
                                        required
                                    >
                                        <option value="">-- Seleziona --</option>
                                        {certificates.filter(c => c.status === 'active').map(cert => (
                                            <option key={cert.id} value={cert.id}>
                                                {cert.clientName} - {cert.certificateId}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <button type="submit" className="btn btn-danger">Revoca Certificato</button>
                            </form>
                        </div>
                    )}

                    {/* RENEW TAB */}
                    {activeTab === 'renew' && (
                        <div className="tab-panel">
                            <h2>Rinnova Certificato</h2>
                            <form onSubmit={handleRenewCertificate} className="cert-form">
                                <div className="form-group">
                                    <label>Seleziona Certificato da Rinnovare</label>
                                    <select
                                        value={selectedCertId}
                                        onChange={(e) => setSelectedCertId(e.target.value)}
                                        required
                                    >
                                        <option value="">-- Seleziona --</option>
                                        {certificates.filter(c => c.status !== 'active').map(cert => (
                                            <option key={cert.id} value={cert.id}>
                                                {cert.clientName} - {cert.certificateId}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <button type="submit" className="btn btn-success">Rinnova Certificato</button>
                            </form>
                        </div>
                    )}
                </div>
            </div>

            {/* Certificates List */}
            <div className="certificates-list">
                <h2>Lista Certificati</h2>
                <table className="cert-table">
                    <thead>
                        <tr>
                            <th>Cliente</th>
                            <th>ID Certificato</th>
                            <th>Stato</th>
                            <th>Bucket</th>
                        </tr>
                    </thead>
                    <tbody>
                        {certificates.map(cert => (
                            <tr key={cert.id}>
                                <td>{cert.clientName}</td>
                                <td><code>{cert.certificateId}</code></td>
                                <td>{getStatusBadge(cert.status)}</td>
                                <td>{cert.bucket || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Certificates;
