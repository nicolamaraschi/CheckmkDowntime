import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { confirmSignUp } from '../auth/cognito';
import '../styles/login.css';

// Funzione helper per leggere i query params
function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const ConfirmSignUp = () => {
  const [username, setUsername] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();
  const query = useQuery();

  useEffect(() => {
    const userFromQuery = query.get('username');
    if (userFromQuery) {
      setUsername(userFromQuery);
    } else {
      setError('Username non trovato. Torna alla registrazione.');
    }
  }, [query]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await confirmSignUp(username, code);
      if (result.success) {
        navigate('/login');
      } else {
        setError(result.error?.message || 'Codice non valido o errore.');
      }
    } catch (err) {
      setError(err.message || 'Si è verificato un errore imprevisto');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h2>Conferma il tuo Account</h2>
          <p>Controlla la tua email ({username}) e inserisci il codice di conferma.</p>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username (sola lettura)</label>
            <input id="username" type="text" value={username} readOnly disabled />
          </div>
          <div className="form-group">
            <label htmlFor="code">Codice di Conferma</label>
            <input id="code" type="text" value={code} onChange={(e) => setCode(e.target.value)} required autoFocus />
          </div>
          
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Conferma...' : 'Conferma Account'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ConfirmSignUp;