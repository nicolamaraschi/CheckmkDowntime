import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// 1. Importa i componenti Authenticator e gli stili
import { Authenticator, useAuthenticator, View, Image } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

// 2. *** IMPORTA IL PROVIDER MANCANTE ***
import { ApiCacheProvider } from './contexts/ApiCacheContext'; //

// Importa i tuoi componenti dell'app
import Layout from './components/Layout'; //
import Dashboard from './pages/Dashboard'; //
import DowntimeSchedule from './pages/DowntimeSchedule'; //
import ExistingDowntimes from './pages/ExistingDowntimes'; //
import HostConfig from './pages/HostConfig'; //
import Settings from './pages/Settings'; //

// Importa stili e logo
import './styles/global.css'; //
import logo from './logo.svg'; //

/**
 * Questo componente contiene la tua app protetta.
 * Verrà renderizzato solo DOPO che l'utente ha effettuato l'accesso.
 */
function AppContent() {
  const { user, signOut } = useAuthenticator((context) => [context.user]);

  return (
    // 3. *** AVVOLGI IL ROUTER CON IL PROVIDER ***
    // Ora tutti i componenti (Dashboard, ecc.) possono usare useApiCache()
    <ApiCacheProvider>
      <Router>
        <Routes>
          <Route 
            path="/" 
            element={<Layout user={user} signOut={signOut} />}
          >
            <Route index element={<Dashboard />} /> 
            <Route path="schedule" element={<DowntimeSchedule />} />
            <Route path="existing" element={<ExistingDowntimes />} />
            <Route path="hosts" element={<HostConfig />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<div>404 - Pagina non trovata</div>} />
        </Routes>
      </Router>
    </ApiCacheProvider>
  );
}

/**
 * Questo è il componente principale dell'App.
 * Avvolge l'intera applicazione nell'Authenticator.
 */
function App() {
  
  const components = {
    Header: () => (
      <View textAlign="center" padding="medium">
        <Image 
          alt="Logo" 
          src={logo} 
          height="100px" 
        />
        <h3>Checkmk Downtime Scheduler</h3>
      </View>
    ),
  };

  return (
    <Authenticator 
      loginMechanisms={['username']} 
      hideSignUp={true} 
      components={components}
    >
      <AppContent />
    </Authenticator>
  );
}

export default App;