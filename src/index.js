import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// 1. Importa Amplify
import { Amplify } from 'aws-amplify';

// 2. CORRETTO: Usa la nuova struttura di configurazione v6
Amplify.configure({
  Auth: {
    // La configurazione deve essere dentro 'Cognito'
    Cognito: {
      // 3. CORRETTO: Rinomina 'userPoolWebClientId' in 'userPoolClientId'
      userPoolClientId: '5v6sqab99b9mbb7es880cg6mjc',
      userPoolId: 'eu-west-1_E3d6JEkfX',
      region: 'eu-west-1',
      // 4. CORRETTO: Aggiungi questo blocco per specificare come l'utente accede
      loginWith: {
        username: true // L'utente accede con 'username'
      }
      // 'mandatorySignIn' e 'authenticationFlowType' sono
      // ora gestiti dalle impostazioni del pool o dedotti.
    }
  }
});


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();