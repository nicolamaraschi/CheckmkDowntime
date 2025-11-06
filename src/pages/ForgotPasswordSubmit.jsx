import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { forgotPasswordSubmit } from '../auth/cognito';
import '../styles/login.css';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const ForgotPasswordSubmit = () => {
  const [username, setUsername] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();
  const query = useQuery();

  useEffect(() => {
    const userFromQuery = query.get('username');
    if (userFromQuery) {
      setUsername(userFromQuery);
    } else {
      setError('Username non trovato.');
    }
  }, [query]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await forgotPasswordSubmit(username, code, newPassword);
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
          <h2>Imposta Nuova Password</h2>
          <p>Controlla la tua email per il codice e imposta una nuova password.</p>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input id="username" type="text" value={username} readOnly disabled />
          </div>
          <div className="form-group">
            <label htmlFor="code">Codice di Reset</label>
            <input id="code" type="text" value={code} onChange={(e) => setCode(e.target.value)} required autoFocus />
          </div>
          <div className="form-group">
            <label htmlFor="newPassword">Nuova Password</label>
            <input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
          </div>
          
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Salvataggio...' : 'Salva Nuova Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordSubmit;