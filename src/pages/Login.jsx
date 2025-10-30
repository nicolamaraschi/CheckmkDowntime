import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import '../styles/login.css';
import logo from '../logo.svg'; // Placeholder logo

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const result = await login(username, password);
      
      if (result.requireNewPassword) {
        console.log("Password change required");
        // The user object for the challenge is in result.user
        // You might need to pass this to the new password page
        navigate('/new-password');
      } else {
        console.log("Login successful, navigating...");
        navigate('/');
      }
    } catch (err) {
      console.error("Errore nel login:", err);
      setError(err.message || 'Si è verificato un errore imprevisto');
    } finally {
      setLoading(false);
    }
  };
  
  // Don't render the form if we are already authenticated and about to navigate away
  if (authLoading || isAuthenticated) {
    return <div className="loading">Verifica autenticazione...</div>;
  }
  
  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <img src={logo} alt="Logo" className="login-logo" />
          <h2>Accedi al tuo account</h2>
          <p>Benvenuto in Checkmk Downtime Scheduler</p>
        </div>
        
        {error && (
          <div className="error-message">{error}</div>
        )}
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Accesso in corso...' : 'Accedi'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
