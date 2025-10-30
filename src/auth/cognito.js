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

// Esporta le singole funzioni e un oggetto di default
const authExports = { signIn, completeNewPassword, signOut, getCurrentUser, getToken };
export default authExports;
