import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { confirmSignInMFA } from '../auth/cognito';
import { useAuth } from '../auth/AuthProvider';
import '../styles/login.css';

const MFAVerification = () => {
  const [user, setUser] = useState(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { checkAuth } = useAuth();

  useEffect(() => {
    // Recupera l'utente dalla sessionStorage
    const storedUser = sessionStorage.getItem('mfaUser');
    if (!storedUser) {
      navigate('/login');
      return;
    }

    setUser(JSON.parse(storedUser));
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await confirmSignInMFA(user, code);
      if (result.success) {
        // MFA verificato con successo
        sessionStorage.removeItem('mfaUser');
        // Aggiorna lo stato di autenticazione
        await checkAuth();
        navigate('/');
      } else {
        setError(result.error?.message || 'Codice non valido. Riprova.');
        setCode(''); // Resetta il campo
      }
    } catch (err) {
      setError('Errore durante la verifica. Riprova.');
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    sessionStorage.removeItem('mfaUser');
    navigate('/login');
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2>Verifica Multi-Fattore</h2>

        <p className="mfa-instruction">
          Inserisci il codice a 6 cifre dalla tua app di autenticazione
        </p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="code">Codice MFA</label>
            <input
              type="text"
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              maxLength="6"
              pattern="[0-9]{6}"
              required
              autoFocus
              autoComplete="off"
            />
          </div>

          <button type="submit" disabled={loading || code.length !== 6}>
            {loading ? 'Verifica...' : 'Verifica'}
          </button>
        </form>

        <div className="login-footer">
          <button
            onClick={handleCancel}
            className="link-button"
            disabled={loading}
          >
            Annulla
          </button>
        </div>
      </div>
    </div>
  );
};

export default MFAVerification;
