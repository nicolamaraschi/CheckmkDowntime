import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { forgotPassword } from '../auth/cognito';
import '../styles/login.css';

const ForgotPassword = () => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  
  const navigate = useNavigate();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage('');

    try {
      const result = await forgotPassword(username);

      if (result.success) {
        // Reindirizza alla pagina per inserire il codice
        navigate(`/forgot-password-submit?username=${username}`);
      } else {
        setError(result.error?.message || 'Errore durante la richiesta di reset.');
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
          <h2>Recupera Password</h2>
          <p>Inserisci il tuo username per ricevere un codice di reset via email.</p>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        {message && <div className="success-message">{message}</div>}
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus />
          </div>
          
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Invio...' : 'Invia Codice di Reset'}
          </button>
        </form>
        
        <div className="login-footer-links" style={{ textAlign: 'center', marginTop: '20px' }}>
          <Link to="/login" style={{ color: '#007bff', textDecoration: 'none', fontSize: '14px' }}>
            Torna al Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;