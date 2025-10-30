import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';

const TestApi = () => {
  const [connectionStatus, setConnectionStatus] = useState('');
  const [hosts, setHosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const api = useApi();

  useEffect(() => {
    const testConnection = async () => {
      try {
        setLoading(true);
        
        // Test connessione al backend
        const connectionData = await api.get('/test-connection');
        setConnectionStatus(connectionData.message);
        
        // Ottieni la lista degli host
        const hostsData = await api.get('/hosts');
        setHosts(hostsData);
        
        setLoading(false);
      } catch (err) {
        console.error('Error testing connection:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    testConnection();
  }, [api]);

  return (
    <div style={{ padding: '20px' }}>
      <h1>API Test</h1>
      
      {loading && <p>Caricamento in corso...</p>}
      
      {error && (
        <div style={{ padding: '10px', backgroundColor: '#ffeeee', color: 'red', borderRadius: '4px', marginBottom: '20px' }}>
          <h3>Errore</h3>
          <p>{error}</p>
        </div>
      )}
      
      {connectionStatus && (
        <div style={{ padding: '10px', backgroundColor: '#eeffee', borderRadius: '4px', marginBottom: '20px' }}>
          <h3>Stato Connessione</h3>
          <p>{connectionStatus}</p>
        </div>
      )}
      
      {hosts.length > 0 && (
        <div>
          <h3>Host disponibili ({hosts.length})</h3>
          <ul>
            {hosts.map(host => (
              <li key={host}>{host}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TestApi;
