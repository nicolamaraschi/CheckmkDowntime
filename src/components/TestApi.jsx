import React, { useState } from 'react';
import { useAuth } from '../auth/AuthProvider'; // Importiamo il provider auth
import Loader from './Loader';
// Non importiamo più 'api' da useApi

const TestApi = () => {
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // Prendiamo token, refreshToken e logout dal nostro hook Auth
    const { token, refreshToken, logout } = useAuth(); 

    const runTest = async () => {
        setLoading(true);
        setError(null);
        setResult(null);

        if (!token) {
            setError("Token non disponibile. Effettua il login.");
            setLoading(false);
            return;
        }

        try {
            // --- INIZIO CORREZIONE ---
            // Usiamo fetch() invece di api.get()
            const response = await fetch('/api/connection-test', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            // Gestione token scaduto (401)
            if (response.status === 401) {
                const newToken = await refreshToken();
                if (newToken) {
                    // Riprova la richiesta con il nuovo token
                    const retryResponse = await fetch('/api/connection-test', {
                        headers: { 
                            'Authorization': `Bearer ${newToken}` 
                        }
                    });

                    if (!retryResponse.ok) {
                        throw new Error(`Errore dopo il refresh: ${retryResponse.status}`);
                    }
                    const data = await retryResponse.json();
                    setResult(data);

                } else {
                    // Se il refresh fallisce, fai il logout
                    logout();
                    throw new Error("Sessione scaduta. Effettua nuovamente il login.");
                }
            } else if (!response.ok) {
                // Gestione altri errori HTTP
                const errData = await response.json();
                throw new Error(errData.detail || `Errore HTTP: ${response.status}`);
            } else {
                // Successo
                const data = await response.json();
                setResult(data);
            }
            // --- FINE CORREZIONE ---

        } catch (err) {
            setError(err.message || 'Errore sconosciuto nel test API');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="api-test">
            <button onClick={runTest} disabled={loading} className="api-test-button">
                {loading ? 'Test in corso...' : 'Esegui Test Connessione'}
            </button>
            {loading && <Loader text="Connessione a Checkmk in corso..." />}
            
            {/* Mostra i risultati */}
            {error && (
                <div className="api-result error">
                    <strong>Errore:</strong> {error}
                </div>
            )}
            
            {result && (
                <div className={`api-result ${result.status === 'success' ? 'success' : 'error'}`}>
                    <strong>Stato:</strong> <span style={{ textTransform: 'capitalize' }}>{result.status}</span>
                    <br />
                    <strong>Messaggio:</strong> {result.message}
                </div>
            )}
        </div>
    );
};

export default TestApi;