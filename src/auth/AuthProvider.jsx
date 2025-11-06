import React, { createContext, useContext, useState, useEffect } from 'react';
import { Hub } from '@aws-amplify/core';
import { getCurrentUser, getToken, signOut, signIn } from './cognito';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  const checkUser = async () => {
    setLoading(true);
    try {
      const { success, user } = await getCurrentUser();
      if (success && user) {
        setUser(user);
        const authToken = await getToken();
        setToken(authToken);
      } else {
        setUser(null);
        setToken(null);
      }
    } catch (error) {
      console.log('No authenticated user on check');
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const hubListener = (data) => {
      switch (data.payload.event) {
        case 'signIn':
        case 'autoSignIn':
          checkUser();
          break;
        case 'signOut':
          setUser(null);
          setToken(null);
          break;
        default:
          break;
      }
    };

    Hub.listen('auth', hubListener);
    checkUser(); // Initial check

    return () => {
      Hub.remove('auth', hubListener);
    };
  }, []);

  const login = async (username, password) => {
    const result = await signIn(username, password);
    if (result.success) {
      // The Hub listener will handle setting the user state
      return result;
    } else {
      // Let the login page handle the error
      throw result.error;
    }
  };

  const logout = async () => {
    await signOut();
    // Hub listener will handle state change
    window.location.href = '/login';
  };

  const refreshToken = async () => {
    try {
      const authToken = await getToken();
      setToken(authToken);
      return authToken;
    } catch (error) {
      console.error('Error refreshing token', error);
      return null;
    }
  };

  const value = {
    user,
    loading,
    token,
    login,
    refreshToken,
    logout,
    checkUser,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
