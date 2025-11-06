import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Auth } from '@aws-amplify/auth';
import '../styles/login.css';

const NewPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // Verifica che le password corrispondano
    if (newPassword !== confirmPassword) {
      setError('Le password non corrispondono');
      setLoading(false);
      return;
    }
    
    // Recupera le credenziali
    const username = sessionStorage.getItem('username');
    const password = sessionStorage.getItem('password');
    
    if (!username || !password) {
      setError('Sessione scaduta, effettua nuovamente il login');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }
    
    try {
      // Effettua nuovamente il login per ottenere l'oggetto user con la sfida
      const user = await Auth.signIn(username, password);
      
      // Verifica che sia richiesto il cambio password
      if (user.challengeName === 'NEW_PASSWORD_REQUIRED') {
        // Completa il cambio password
        await Auth.completeNewPassword(user, newPassword);
        
        // Pulisci sessionStorage
        sessionStorage.removeItem('username');
        sessionStorage.removeItem('password');
        
        // Reindirizza alla home
        navigate('/');
      } else {
        // Situazione inaspettata
        setError('Errore: cambio password non richiesto');
        setTimeout(() => navigate('/'), 2000);
      }
    } catch (err) {
      console.error('Errore nel cambio password:', err);
      setError(err.message || 'Si è verificato un errore imprevisto');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="login-container">
      <div className="login-form">
        <h1>Checkmk Downtime Scheduler</h1>
        <h2>Imposta una nuova password</h2>
        
        {error && (
          <div className="error-message">{error}</div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="new-password">Nuova password</label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
            <small>La password deve essere lunga almeno 8 caratteri e contenere lettere maiuscole, minuscole, numeri e caratteri speciali</small>
          </div>
          
          <div className="form-group">
            <label htmlFor="confirm-password">Conferma password</label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Elaborazione in corso...' : 'Conferma'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewPassword;
