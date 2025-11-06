# Guida Setup MFA (Multi-Factor Authentication)

## Panoramica

Il sistema ora supporta l'autenticazione a due fattori (MFA) utilizzando AWS Amplify e Amazon Cognito con TOTP (Time-based One-Time Password).

## Pacchetti Installati

- **aws-amplify** (v5.3.14): Libreria principale per integrazione AWS
- **@aws-amplify/ui-react** (v5.3.2): Componenti UI React per Amplify
- **qrcode**: Generazione QR code per setup MFA

## Configurazione AWS Cognito

Per abilitare MFA nel tuo User Pool di AWS Cognito, segui questi passaggi:

### 1. Accedi alla Console AWS Cognito

1. Vai su [AWS Console](https://console.aws.amazon.com/)
2. Cerca "Cognito" nella barra di ricerca
3. Seleziona il tuo User Pool: `eu-west-1_E3d6JEkfX`

### 2. Abilita MFA

1. Nel menu laterale, vai su **Sign-in experience**
2. Scorri fino a **Multi-factor authentication**
3. Clicca su **Edit**
4. Seleziona una delle seguenti opzioni:
   - **Optional**: Gli utenti possono scegliere se attivare MFA
   - **Required**: MFA obbligatorio per tutti gli utenti
5. In **MFA methods**, seleziona:
   - ✅ **Authenticator apps** (TOTP)
6. Clicca su **Save changes**

### 3. Configurazione Avanzata (Opzionale)

Puoi anche configurare:
- **SMS text message**: MFA via SMS (richiede configurazione SNS)
- **MFA enforcement**: Impostare MFA come obbligatorio solo per utenti specifici

## Flusso Utente

### Primo Accesso con MFA

1. L'utente fa login con username e password
2. Se MFA non è configurato, viene reindirizzato a `/mfa-verification?mfaType=setup`
3. Viene mostrato un QR code da scansionare con un'app di autenticazione (Google Authenticator, Authy, Microsoft Authenticator, ecc.)
4. L'utente inserisce il codice a 6 cifre generato dall'app
5. MFA viene configurato e l'utente viene autenticato

### Accessi Successivi

1. L'utente fa login con username e password
2. Viene reindirizzato a `/mfa-verification?mfaType=verify`
3. Inserisce il codice a 6 cifre dall'app di autenticazione
4. Viene autenticato e reindirizzato alla dashboard

## File Modificati

### 1. `/src/auth/cognito.js`
Aggiunte funzioni MFA:
- `confirmSignIn()`: Conferma login con codice MFA
- `setupTOTP()`: Configura TOTP per nuovo utente
- `verifyTotpToken()`: Verifica token TOTP durante setup
- `setPreferredMFA()`: Imposta metodo MFA preferito

### 2. `/src/pages/MFAVerification.jsx`
Nuova pagina che gestisce:
- Setup MFA (generazione QR code)
- Verifica MFA durante login
- Input codice a 6 cifre
- Gestione errori

### 3. `/src/pages/Login.jsx`
Aggiornato per gestire challenge MFA:
- `MFA_SETUP`: Reindirizza al setup
- `SOFTWARE_TOKEN_MFA`: Reindirizza alla verifica

### 4. `/src/App.js`
Aggiunta route `/mfa-verification`

### 5. `/src/styles/login.css`
Aggiunti stili per:
- QR code container
- Codice segreto manuale
- Istruzioni setup
- Form verifica MFA

### 6. `/src/auth/AuthProvider.jsx`
Esportata funzione `checkUser` per refresh stato autenticazione

## App di Autenticazione Consigliate

- **Google Authenticator**: [iOS](https://apps.apple.com/app/google-authenticator/id388497605) | [Android](https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2)
- **Microsoft Authenticator**: [iOS](https://apps.apple.com/app/microsoft-authenticator/id983156458) | [Android](https://play.google.com/store/apps/details?id=com.azure.authenticator)
- **Authy**: [iOS](https://apps.apple.com/app/authy/id494168017) | [Android](https://play.google.com/store/apps/details?id=com.authy.authy)

## Testing

### Test Locale

1. Avvia l'app: `npm start`
2. Vai su `http://localhost:3000/login`
3. Accedi con un account utente
4. Se MFA non è configurato, segui il flusso di setup
5. Nei login successivi, inserisci il codice MFA

### Build Produzione

```bash
npm run build
```

Il progetto compila senza errori bloccanti (solo warning ESLint minori).

## Sicurezza

- I codici TOTP cambiano ogni 30 secondi
- I codici sono generati localmente dall'app di autenticazione (non via rete)
- Il segreto TOTP viene salvato in modo sicuro su AWS Cognito
- MFA aggiunge un layer di sicurezza anche se la password viene compromessa

## Troubleshooting

### "Codice non valido"
- Verifica che l'orario del dispositivo sia sincronizzato
- Assicurati di inserire il codice corrente (si aggiorna ogni 30 secondi)

### QR Code non si carica
- Controlla la connessione a AWS Cognito
- Verifica che setupTOTP sia configurato correttamente nel User Pool

### Utente bloccato da MFA
Come amministratore AWS Cognito:
1. Vai al User Pool
2. Seleziona l'utente
3. Clicca su **Disable MFA** per rimuovere temporaneamente MFA
4. L'utente può rifare il setup

## Prossimi Passi

Possibili miglioramenti futuri:
- Aggiungere supporto SMS MFA
- Backup codes per recovery
- Remember device functionality
- MFA settings nella pagina Settings dell'app

## Supporto

Per problemi o domande, consulta:
- [AWS Amplify Docs](https://docs.amplify.aws/)
- [AWS Cognito MFA Docs](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-mfa.html)
