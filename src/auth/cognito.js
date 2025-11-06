import { Amplify, Auth } from 'aws-amplify';

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

    // Controlla se è richiesto il codice MFA
    if (user.challengeName === 'SOFTWARE_TOKEN_MFA') {
      return {
        success: false,
        requireMFA: true,
        user,
        error: { message: 'È richiesto il codice MFA' }
      };
    }

    // Controlla se è richiesto il setup MFA
    if (user.challengeName === 'MFA_SETUP') {
      return {
        success: false,
        requireMFASetup: true,
        user,
        error: { message: 'È richiesto il setup MFA' }
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

// ===== FUNZIONI MFA =====

// Setup TOTP - Ottiene il codice segreto per generare il QR code
export const setupTOTP = async (user) => {
  try {
    const code = await Auth.setupTOTP(user);
    return { success: true, secretCode: code };
  } catch (error) {
    console.error('Error setting up TOTP:', error);
    return { success: false, error };
  }
};

// Verifica il setup TOTP con il codice inserito dall'utente
export const verifyTOTPSetup = async (user, code) => {
  try {
    await Auth.verifyTotpToken(user, code);
    // Imposta TOTP come metodo MFA preferito
    await Auth.setPreferredMFA(user, 'TOTP');
    return { success: true };
  } catch (error) {
    console.error('Error verifying TOTP setup:', error);
    return { success: false, error };
  }
};

// Conferma il sign-in con il codice MFA
export const confirmSignInMFA = async (user, code) => {
  try {
    const loggedUser = await Auth.confirmSignIn(user, code, 'SOFTWARE_TOKEN_MFA');
    return { success: true, user: loggedUser };
  } catch (error) {
    console.error('Error confirming sign in with MFA:', error);
    return { success: false, error };
  }
};

// Ottieni lo stato MFA dell'utente corrente
export const getMFAStatus = async () => {
  try {
    const user = await Auth.currentAuthenticatedUser();
    const preferredMFA = await Auth.getPreferredMFA(user);
    return { success: true, mfaType: preferredMFA };
  } catch (error) {
    console.error('Error getting MFA status:', error);
    return { success: false, error };
  }
};

// Disabilita MFA per l'utente corrente
export const disableMFA = async () => {
  try {
    const user = await Auth.currentAuthenticatedUser();
    await Auth.setPreferredMFA(user, 'NOMFA');
    return { success: true };
  } catch (error) {
    console.error('Error disabling MFA:', error);
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
  setupTOTP,
  verifyTOTPSetup,
  confirmSignInMFA,
  getMFAStatus,
  disableMFA
};
export default authExports;
