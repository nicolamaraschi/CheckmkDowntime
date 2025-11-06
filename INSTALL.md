# Istruzioni di Installazione

## Problema con le Dipendenze

Questo progetto utilizza AWS Amplify v5, ma npm può tentare di installare automaticamente la versione 6 a causa delle peer dependencies di `@aws-amplify/ui-react`.

AWS Amplify v6 ha una struttura completamente diversa e **non esporta** `Auth` e `Hub` dal pacchetto principale `aws-amplify`, causando errori di compilazione.

## Soluzione Implementata

Il `package.json` è stato configurato con:

1. **Versioni esatte** (senza `^`):
   ```json
   "aws-amplify": "5.3.14",
   "@aws-amplify/ui-react": "5.3.2"
   ```

2. **Override per forzare le versioni**:
   ```json
   "overrides": {
     "aws-amplify": "5.3.14",
     "@aws-amplify/ui-react": "5.3.2"
   }
   ```

3. **ajv@8.17.1 come dipendenza diretta**:
   Necessario per compatibilità con react-scripts e webpack

## Installazione

### Passo 1: Clona il Repository

```bash
git clone <repository-url>
cd checkmk-downtime
```

### Passo 2: Installa le Dipendenze

**IMPORTANTE:** Usa sempre `--legacy-peer-deps`

```bash
npm install --legacy-peer-deps
```

### Passo 3: Verifica le Versioni

```bash
npm list aws-amplify @aws-amplify/ui-react
```

Dovresti vedere:

```
checkmk-downtime@0.1.0
├── @aws-amplify/ui-react@5.3.2 overridden
└── aws-amplify@5.3.14 overridden
```

### Passo 4: Build

```bash
npm run build
```

La build dovrebbe completarsi con successo:

```
Compiled with warnings.
File sizes after gzip:
  143.38 kB  build/static/js/main.*.js
  5.6 kB     build/static/css/main.*.css
```

### Passo 5: Avvia il Dev Server

```bash
npm start
```

L'applicazione sarà disponibile su `http://localhost:3000`

## Troubleshooting

### Errore: "Auth is not exported from aws-amplify"

**Causa:** npm ha installato AWS Amplify v6 invece di v5

**Soluzione:**
```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### Errore: "Cannot find module 'ajv/dist/compile/codegen'"

**Causa:** ajv@6 installato invece di ajv@8

**Soluzione:**
```bash
npm install ajv@8.17.1 --legacy-peer-deps
```

### Verificare le Versioni Installate

```bash
# Verifica Amplify
npm list aws-amplify

# Verifica ajv
npm list ajv

# Verifica tutto
npm list
```

## Aggiunta di Nuove Dipendenze

Quando aggiungi nuove dipendenze, usa sempre:

```bash
npm install <package-name> --legacy-peer-deps
```

## Configurazione AWS Cognito

Vedi `MFA_SETUP_GUIDE.md` per istruzioni dettagliate sulla configurazione MFA con AWS Cognito.

## Compatibilità

- Node.js: v18 o superiore
- npm: v8 o superiore
- React: v19.2.0
- AWS Amplify: v5.3.14 (NON v6)

## Note Importanti

- **NON rimuovere** `--legacy-peer-deps` durante l'installazione
- **NON aggiornare** aws-amplify a v6 senza refactoring completo del codice
- Gli `overrides` in package.json sono **essenziali** per mantenere la compatibilità

## Struttura delle Dipendenze

```
dependencies/
├── aws-amplify@5.3.14 (LOCKED)
├── @aws-amplify/ui-react@5.3.2 (LOCKED)
├── ajv@8.17.1
├── react@19.2.0
├── react-scripts@5.0.1
└── ... altre dipendenze
```

## Build di Produzione

```bash
npm run build
```

I file di build saranno generati in `/build`

Per servire la build:

```bash
npx serve -s build
```

## Docker (Opzionale)

Se usi Docker, assicurati di:

1. Copiare `package.json` e `package-lock.json`
2. Eseguire `npm install --legacy-peer-deps` nel Dockerfile
3. Non usare `npm ci` (usa `npm install --legacy-peer-deps`)

Esempio Dockerfile:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=0 /app/build /usr/share/nginx/html
```

## Support

Per problemi o domande:
- Consulta `MFA_SETUP_GUIDE.md` per configurazione MFA
- Controlla questo file per problemi di installazione
- Verifica sempre le versioni installate con `npm list`
