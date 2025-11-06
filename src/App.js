import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider';
import { ApiCacheProvider } from './contexts/ApiCacheContext';
import ProtectedRoute from './auth/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import NewPassword from './pages/NewPassword';
import MFASetup from './pages/MFASetup';
import MFAVerification from './pages/MFAVerification';
import Dashboard from './pages/Dashboard';
import HostConfig from './pages/HostConfig';
import DowntimeSchedule from './pages/DowntimeSchedule';
import ExistingDowntimes from './pages/ExistingDowntimes';
import Settings from './pages/Settings';
import TestApi from './components/TestApi';
import './styles/global.css';

function App() {
  return (
    <AuthProvider>
      <ApiCacheProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/new-password" element={<NewPassword />} />
            <Route path="/mfa-setup" element={<MFASetup />} />
            <Route path="/mfa-verification" element={<MFAVerification />} />
            <Route path="/test-api" element={<TestApi />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
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
    </AuthProvider>
  );
}

export default App;
