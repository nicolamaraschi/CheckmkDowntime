import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { confirmSignIn, setupTOTP, verifyTotpToken, setPreferredMFA } from '../auth/cognito';
import QRCode from 'qrcode';
import '../styles/login.css';

const MFAVerification = () => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secretCode, setSecretCode] = useState('');
  const [isSetup, setIsSetup] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const user = location.state?.user;
  const mfaType = location.state?.mfaType || 'verify'; // 'setup' o 'verify'

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    const initMFA = async () => {
      if (mfaType === 'setup') {
        setIsSetup(true);
        setLoading(true);
        try {
          const result = await setupTOTP(user);
          if (result.success) {
            const code = result.code;
            setSecretCode(code);

            // Genera il QR code per Google Authenticator/Authy
            const username = user.username || user.challengeParam?.USER_ID_FOR_SRP;
            const issuer = 'CheckmkDowntime';
            const otpAuthUrl = `otpauth://totp/${issuer}:${username}?secret=${code}&issuer=${issuer}`;

            const qrCode = await QRCode.toDataURL(otpAuthUrl);
            setQrCodeUrl(qrCode);
          } else {
            setError(result.error?.message || 'Errore durante il setup MFA');
          }
        } catch (err) {
          setError(err.message || 'Errore durante il setup MFA');
        } finally {
          setLoading(false);
        }
      }
    };

    initMFA();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, mfaType, navigate]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSetup) {
        // Setup mode: verify TOTP and set as preferred MFA
        const verifyResult = await verifyTotpToken(user, code);
        if (verifyResult.success) {
          // Set TOTP as preferred MFA
          await setPreferredMFA(verifyResult.user, 'TOTP');
          console.log('MFA setup completed successfully');
          navigate('/');
        } else {
          setError(verifyResult.error?.message || 'Codice non valido');
        }
      } else {
        // Verification mode: confirm sign in with MFA code
        const result = await confirmSignIn(user, code);
        if (result.success) {
          console.log('MFA verification successful');
          navigate('/');
        } else {
          setError(result.error?.message || 'Codice non valido');
        }
      }
    } catch (err) {
      setError(err.message || 'Errore durante la verifica');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h2>{isSetup ? 'Configura Autenticazione a Due Fattori' : 'Verifica Autenticazione'}</h2>
          <p>
            {isSetup
              ? 'Scansiona il QR code con la tua app di autenticazione'
              : 'Inserisci il codice dalla tua app di autenticazione'}
          </p>
        </div>

        {error && <div className="error-message">{error}</div>}

        {isSetup && qrCodeUrl && (
          <div className="mfa-setup">
            <div className="qr-code-container">
              <img src={qrCodeUrl} alt="QR Code" className="qr-code" />
            </div>
            <div className="secret-code">
              <p>Oppure inserisci manualmente questo codice:</p>
              <code>{secretCode}</code>
            </div>
            <div className="mfa-instructions">
              <h3>Istruzioni:</h3>
              <ol>
                <li>Scarica un'app di autenticazione (Google Authenticator, Authy, ecc.)</li>
                <li>Scansiona il QR code con l'app</li>
                <li>Inserisci il codice a 6 cifre generato dall'app</li>
              </ol>
            </div>
          </div>
        )}

        <form onSubmit={handleVerify} className="login-form">
          <div className="form-group">
            <label htmlFor="code">Codice di Verifica</label>
            <input
              id="code"
              type="text"
              className="form-control"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength="6"
              pattern="\d{6}"
              autoComplete="one-time-code"
              required
            />
            <small>Inserisci il codice a 6 cifre</small>
          </div>

          <button type="submit" className="login-button" disabled={loading || code.length !== 6}>
            {loading ? 'Verifica in corso...' : 'Verifica'}
          </button>
        </form>

        <div className="mfa-footer">
          <button
            onClick={() => navigate('/login')}
            className="link-button"
            disabled={loading}
          >
            Torna al login
          </button>
        </div>
      </div>
    </div>
  );
};

export default MFAVerification;
