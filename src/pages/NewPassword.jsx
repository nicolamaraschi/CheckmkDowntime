import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Auth } from 'aws-amplify';
import '../styles/login.css';

const NewPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const cognitoUser = location.state?.user;

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

    // Verifica che abbiamo l'utente Cognito
    if (!cognitoUser) {
      setError('Sessione scaduta, effettua nuovamente il login');
      setTimeout(() => navigate('/login'), 2000);
      setLoading(false);
      return;
    }

    try {
      // Completa il cambio password
      await Auth.completeNewPassword(cognitoUser, newPassword);
      // Reindirizza alla home
      navigate('/');
    } catch (err) {
      console.error('Errore nel cambio password:', err);
      setError(err.message || 'Si e verificato un errore imprevisto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h2>Imposta Nuova Password</h2>
          <p>E richiesto il cambio della password temporanea</p>
        </div>

        {error && (
          <div className="error-message">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="newPassword">Nuova Password</label>
            <input
              id="newPassword"
              type="password"
              className="form-control"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              required
              minLength="8"
            />
            <small>La password deve essere lunga almeno 8 caratteri e contenere lettere maiuscole, minuscole, numeri e caratteri speciali</small>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Conferma Password</label>
            <input
              id="confirmPassword"
              type="password"
              className="form-control"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
              minLength="8"
            />
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Cambio in corso...' : 'Cambia Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewPassword;
