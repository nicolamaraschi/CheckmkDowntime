import { Amplify } from 'aws-amplify';
import { Auth } from '@aws-amplify/auth';

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

export const signIn = async (username, password) => {
  try {
    const user = await Auth.signIn(username, password);

    // Controlla se è richiesto il cambio password
    if (user.challengeName === 'NEW_PASSWORD_REQUIRED') {
      return {
        success: false,
        requireNewPassword: true,
        user,
        error: { message: 'È richiesto il cambio password' }
      };
    }

    // Controlla se è richiesta la configurazione MFA
    if (user.challengeName === 'MFA_SETUP') {
      return {
        success: false,
        requireMfaSetup: true,
        user,
        error: { message: 'È richiesta la configurazione MFA' }
      };
    }

    // Controlla se è richiesta la verifica MFA
    if (user.challengeName === 'SOFTWARE_TOKEN_MFA') {
      return {
        success: false,
        requireMfaVerification: true,
        user,
        error: { message: 'È richiesta la verifica MFA' }
      };
    }

    return { success: true, user };
  } catch (error) {
    console.error('Error signing in:', error);
    return { success: false, error };
  }
};

export const completeNewPassword = async (user, newPassword) => {
  try {
    const loggedUser = await Auth.completeNewPassword(user, newPassword);
    return { success: true, user: loggedUser };
  } catch (error) {
    console.error('Error completing new password:', error);
    return { success: false, error };
  }
};

export const signOut = async () => {
  try {
    await Auth.signOut();
    return { success: true };
  } catch (error) {
    console.error('Error signing out:', error);
    return { success: false, error };
  }
};

export const getCurrentUser = async () => {
  try {
    const user = await Auth.currentAuthenticatedUser();
    return { success: true, user };
  } catch (error) {
    console.error('Error getting current user:', error);
    return { success: false, error };
  }
};

export const getToken = async () => {
  try {
    const session = await Auth.currentSession();
    return session.getIdToken().getJwtToken();
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

// MFA Functions
export const confirmSignIn = async (user, code, mfaType = 'SOFTWARE_TOKEN_MFA') => {
  try {
    const loggedUser = await Auth.confirmSignIn(user, code, mfaType);
    return { success: true, user: loggedUser };
  } catch (error) {
    console.error('Error confirming sign in:', error);
    return { success: false, error };
  }
};

export const setupTOTP = async (user) => {
  try {
    const code = await Auth.setupTOTP(user);
    return { success: true, code };
  } catch (error) {
    console.error('Error setting up TOTP:', error);
    return { success: false, error };
  }
};

export const verifyTotpToken = async (user, challengeAnswer) => {
  try {
    const loggedUser = await Auth.verifyTotpToken(user, challengeAnswer);
    return { success: true, user: loggedUser };
  } catch (error) {
    console.error('Error verifying TOTP token:', error);
    return { success: false, error };
  }
};

export const setPreferredMFA = async (user, mfaType) => {
  try {
    await Auth.setPreferredMFA(user, mfaType);
    return { success: true };
  } catch (error) {
    console.error('Error setting preferred MFA:', error);
    return { success: false, error };
  }
};

// Esporta le singole funzioni e un oggetto di default
const authExports = {
  signIn,
  completeNewPassword,
  signOut,
  getCurrentUser,
  getToken,
  confirmSignIn,
  setupTOTP,
  verifyTotpToken,
  setPreferredMFA
};
export default authExports;
