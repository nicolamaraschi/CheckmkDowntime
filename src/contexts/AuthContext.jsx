import React, { createContext, useContext, useState, useEffect } from 'react';
import { Auth } from 'aws-amplify';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children, user, signOut }) => {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getToken = async () => {
      try {
        const session = await Auth.currentSession();
        const idToken = session.getIdToken().getJwtToken();
        setToken(idToken);
      } catch (error) {
        console.error('Error getting token:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      getToken();
    } else {
      setLoading(false);
    }
  }, [user]);

  const refreshToken = async () => {
    try {
      const session = await Auth.currentSession();
      const idToken = session.getIdToken().getJwtToken();
      setToken(idToken);
      return idToken;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  };

  const value = {
    user,
    token,
    loading,
    logout: signOut,
    refreshToken,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};