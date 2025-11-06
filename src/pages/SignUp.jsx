import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signUp } from '../auth/cognito';
import '../styles/login.css'; // Riutilizziamo lo stile

const SignUp = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Le password non corrispondono.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const result = await signUp(username, password, email);

      if (result.success) {
        if (result.nextStep === 'CONFIRM_SIGN_UP') {
          // Reindirizza alla pagina di conferma
          navigate(`/confirm-signup?username=${username}`);
        } else {
          // Registrazione completa (raro se la conferma è richiesta)
          navigate('/login');
        }
      } else {
        setError(result.error?.message || 'Errore durante la registrazione.');
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
          <h2>Crea un nuovo account</h2>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Conferma Password</label>
            <input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          </div>
          
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Registrazione...' : 'Registrati'}
          </button>
        </form>
        
        <div className="login-footer-links" style={{ textAlign: 'center', marginTop: '20px' }}>
          <Link to="/login" style={{ color: '#007bff', textDecoration: 'none', fontSize: '14px' }}>
            Hai già un account? Accedi
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignUp;