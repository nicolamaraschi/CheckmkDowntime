import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { setupTOTP, verifyTOTPSetup } from '../auth/cognito';
import '../styles/login.css';

const MFASetup = () => {
  const [user, setUser] = useState(null);
  const [secretCode, setSecretCode] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [setupLoading, setSetupLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Recupera l'utente dalla sessionStorage
    const storedUser = sessionStorage.getItem('mfaUser');
    if (!storedUser) {
      navigate('/login');
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);

    // Setup TOTP
    const initSetup = async () => {
      try {
        const result = await setupTOTP(parsedUser);
        if (result.success) {
          setSecretCode(result.secretCode);
        } else {
          setError('Errore durante il setup MFA. Riprova.');
        }
      } catch (err) {
        setError('Errore durante il setup MFA. Riprova.');
      } finally {
        setSetupLoading(false);
      }
    };

    initSetup();
  }, [navigate]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await verifyTOTPSetup(user, verificationCode);
      if (result.success) {
        // Setup completato, pulisce sessionStorage e reindirizza al login
        sessionStorage.removeItem('mfaUser');
        alert('MFA configurato con successo! Effettua nuovamente il login.');
        navigate('/login');
      } else {
        setError(result.error?.message || 'Codice non valido. Riprova.');
      }
    } catch (err) {
      setError('Errore durante la verifica. Riprova.');
    } finally {
      setLoading(false);
    }
  };

  // Genera l'URL per il QR code (formato otpauth)
  const getQRCodeURL = () => {
    const appName = 'CheckMK Downtime';
    const username = user?.username || 'user';
    return `otpauth://totp/${appName}:${username}?secret=${secretCode}&issuer=${appName}`;
  };

  if (setupLoading) {
    return (
      <div className="login-page">
        <div className="login-card">
          <h2>Setup MFA</h2>
          <p>Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h2>Configura Autenticazione Multi-Fattore</h2>

        <div className="mfa-setup-instructions">
          <p><strong>Passaggio 1:</strong> Scarica un'app di autenticazione sul tuo telefono:</p>
          <ul>
            <li>Google Authenticator</li>
            <li>Microsoft Authenticator</li>
            <li>Authy</li>
          </ul>

          <p><strong>Passaggio 2:</strong> Scansiona questo QR code con l'app:</p>

          {secretCode && (
            <div className="qr-code-container">
              <QRCodeSVG
                value={getQRCodeURL()}
                size={200}
                level="M"
                includeMargin={true}
              />
            </div>
          )}

          <p><strong>Codice manuale (se non riesci a scannerizzare il QR):</strong></p>
          <div className="secret-code">
            <code>{secretCode}</code>
          </div>

          <p><strong>Passaggio 3:</strong> Inserisci il codice a 6 cifre dall'app:</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleVerify}>
          <div className="form-group">
            <label htmlFor="verificationCode">Codice di Verifica</label>
            <input
              type="text"
              id="verificationCode"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="000000"
              maxLength="6"
              pattern="[0-9]{6}"
              required
              autoFocus
            />
          </div>

          <button type="submit" disabled={loading || verificationCode.length !== 6}>
            {loading ? 'Verifica...' : 'Verifica e Completa Setup'}
          </button>
        </form>

        <div className="login-footer">
          <button
            onClick={() => navigate('/login')}
            className="link-button"
            disabled={loading}
          >
            Torna al Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default MFASetup;
