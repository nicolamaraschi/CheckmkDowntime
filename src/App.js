import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css'; // Stili di default
import { Amplify } from 'aws-amplify';
import { ApiCacheProvider } from './contexts/ApiCacheContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import HostConfig from './pages/HostConfig';
import DowntimeSchedule from './pages/DowntimeSchedule';
import ExistingDowntimes from './pages/ExistingDowntimes';
import Settings from './pages/Settings';
import './styles/global.css';

// Configurazione Cognito
Amplify.configure({
  Auth: {
    region: 'eu-west-1',
    userPoolId: 'eu-west-1_E3d6JEkfX',
    userPoolWebClientId: '5v6sqab99b9mbb7es880cg6mjc',
    mandatorySignIn: true,
    authenticationFlowType: 'USER_PASSWORD_AUTH'
  }
});

function App() {
  return (
    <Authenticator>
      {({ signOut, user }) => (
        <ApiCacheProvider user={user} signOut={signOut}>
          <Router>
            <Routes>
              <Route path="/" element={<Layout user={user} signOut={signOut} />}>
                <Route index element={<Dashboard />} />
                <Route path="hosts" element={<HostConfig />} />
                <Route path="schedule" element={<DowntimeSchedule />} />
                <Route path="downtimes" element={<ExistingDowntimes />} />
                <Route path="settings" element={<Settings />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </ApiCacheProvider>
      )}
    </Authenticator>
  );
}

export default App;