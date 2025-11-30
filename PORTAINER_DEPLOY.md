# 🐳 Guida Deployment su Portainer (AWS Account Aziendale)

## 📦 Preparazione dell'Immagine

### 1. Build dell'immagine Docker (x86)
```bash
# Esegui lo script di build
./build-x86-tar.sh

# Questo creerà un file .tar con l'immagine
# Esempio: checkmk-downtime-x86.tar
```

### 2. Caricamento su Portainer

1. **Login a Portainer** (AWS Account Aziendale)
2. **Images** → **Import**
3. **Carica** il file `.tar` generato

---

## ⚙️ Configurazione Container in Portainer

### 1. Creazione Container

**Container name:** `checkmk-downtime`

**Image:** Seleziona l'immagine appena caricata

### 2. Port Mapping

**IMPORTANTE:** Mappa la porta interna 80 (Nginx) alla porta esterna desiderata

```
Host Port: 8436
Container Port: 80
Protocol: TCP
```

**Perché porta 80 del container?**
- L'immagine usa Nginx che ascolta sulla porta 80
- Nginx fa da reverse proxy per il backend (porta 8000)
- Tutto il traffico HTTP passa attraverso Nginx

### 3. Variabili d'Ambiente (FONDAMENTALE)

**Vai su:** Advanced container settings → Env

Aggiungi **TUTTE** le seguenti variabili:

#### 🔐 CheckMK (Obbligatorie)

| Nome | Esempio | Descrizione |
|------|---------|-------------|
| `CHECKMK_HOST` | `checkmk.tuodominio.com` | Hostname CheckMK (senza https://) |
| `CHECKMK_SITE` | `monitoring` | Nome del site CheckMK |
| `CHECKMK_USER` | `automation` | Username automazione |
| `CHECKMK_PASSWORD` | `***` | Password automazione |

#### 🔐 AWS Cognito (Autenticazione)

| Nome | Esempio | Descrizione |
|------|---------|-------------|
| `COGNITO_REGION` | `eu-west-1` | Regione AWS Cognito |
| `COGNITO_USER_POOL_ID` | `eu-west-1_XXXXXXXXX` | ID User Pool |
| `COGNITO_APP_CLIENT_ID` | `xxxxxxxxxxxxxxxxxxxxx` | ID App Client |

#### 🔐 AWS Athena (CloudConnexa Dashboard)

| Nome | Esempio | Descrizione |
|------|---------|-------------|
| `ATHENA_DB` | `cloudconnexa_logs_db` | Database Athena CloudConnexa |
| `ATHENA_RESULTS_BUCKET` | `s3://bucket-athena-results/` | Bucket risultati query |
| `ATHENA_WORKGROUP` | `primary` | Workgroup Athena |
| `AWS_REGION` | `eu-central-1` | Regione AWS |

#### 🔐 AWS Athena (SAP Dashboard)

| Nome | Esempio | Descrizione |
|------|---------|-------------|
| `SAP_ATHENA_DB` | `sap_reports_db` | Database Athena SAP |
| `SAP_ATHENA_WORKGROUP` | `ReportCheckSistemiSap` | Workgroup Athena SAP |

#### 🔐 AWS Credentials (Se non usi IAM Role)

| Nome | Esempio | Descrizione |
|------|---------|-------------|
| `AWS_ACCESS_KEY_ID` | `AKIAXXXXXXXXXXXXXXXX` | Access Key AWS |
| `AWS_SECRET_ACCESS_KEY` | `***` | Secret Key AWS |

**NOTA:** Se il container gira su EC2 con IAM Role, NON servono le credenziali AWS.

#### 📝 Variabili Opzionali

| Nome | Valore Default | Descrizione |
|------|----------------|-------------|
| `BACKEND_PORT` | `8000` | Porta backend |
| `NGINX_PORT` | `80` | Porta Nginx |

### 4. Volumes (Opzionale)

Se vuoi persistere i log:

```
/var/log/checkmk-downtime → /path/on/host/logs
```

### 5. Network

Seleziona la rete appropriata per il tuo ambiente AWS

### 6. Restart Policy

**Consigliato:** `Unless stopped`

---

## 🚀 Deploy

1. Clicca **Deploy the container**
2. Attendi che il container si avvii
3. Verifica i log in Portainer
4. Accedi all'app: `http://<aws-host>:8436`

---

## 🔄 Aggiornamento dell'App

### Scenario 1: Solo codice modificato (NO variabili)

1. Rebuild immagine: `./build-x86-tar.sh`
2. Carica nuovo `.tar` in Portainer
3. **Stop** container esistente
4. **Remove** container (le variabili d'ambiente rimangono salvate nel template)
5. **Ricrea** container con la nuova immagine
6. Le variabili d'ambiente vengono riapplicate automaticamente

### Scenario 2: Variabili modificate

1. **Container** → **Duplicate/Edit**
2. Modifica le variabili d'ambiente
3. **Deploy**

---

## 🛡️ Best Practices

### ✅ DA FARE:
- ✅ Usa variabili d'ambiente in Portainer per credenziali
- ✅ Genera un `SECRET_KEY` unico e sicuro
- ✅ Usa HTTPS in produzione (configura reverse proxy)
- ✅ Monitora i log del container
- ✅ Backup delle variabili d'ambiente (esporta stack)

### ❌ NON FARE:
- ❌ NON mettere password nell'immagine Docker
- ❌ NON committare `.env` con credenziali reali
- ❌ NON usare porte privilegiate (<1024) senza necessità
- ❌ NON esporre il backend direttamente (usa sempre Nginx)

---

## 🔍 Troubleshooting

### Container non si avvia
```bash
# Controlla i log in Portainer
# Oppure da CLI:
docker logs checkmk-downtime
```

### Variabili d'ambiente non funzionano
- Verifica che siano scritte ESATTAMENTE come nell'esempio
- Controlla che non ci siano spazi extra
- Riavvia il container dopo le modifiche

### Porta 8436 non risponde
- Verifica il port mapping: `8436:80`
- Controlla il firewall AWS
- Verifica che Nginx sia in ascolto: `docker exec checkmk-downtime netstat -tulpn`

---

## 📊 Architettura del Container

```
┌─────────────────────────────────────┐
│   Host AWS (Portainer)              │
│                                     │
│   Port 8436                         │
│      ↓                              │
│   ┌─────────────────────────────┐  │
│   │  Container                  │  │
│   │                             │  │
│   │  Port 80 → Nginx            │  │
│   │             ↓               │  │
│   │  Port 8000 → FastAPI Backend│  │
│   │             ↓               │  │
│   │  CheckMK API                │  │
│   └─────────────────────────────┘  │
└─────────────────────────────────────┘
```

---

## 🔐 Generazione SECRET_KEY Sicura

```bash
# Opzione 1: Python
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# Opzione 2: OpenSSL
openssl rand -base64 32

# Opzione 3: Online (usa solo per dev)
# https://randomkeygen.com/
```

---

## 📝 Checklist Pre-Deploy

- [ ] Immagine Docker builddata con `build-x86-tar.sh`
- [ ] File `.tar` caricato in Portainer
- [ ] Port mapping configurato: `8436:80`
- [ ] Variabili d'ambiente configurate (TUTTE)
- [ ] `SECRET_KEY` generata e sicura
- [ ] Credenziali CheckMK corrette
- [ ] Network selezionata
- [ ] Restart policy impostata
- [ ] Container deployato e in running
- [ ] Log verificati (nessun errore)
- [ ] App accessibile da browser

---

## 🎯 Vantaggi di questo Approccio

1. **Sicurezza**: Credenziali solo in Portainer, non nell'immagine
2. **Flessibilità**: Cambi variabili senza rebuild
3. **Portabilità**: Stessa immagine per dev/staging/prod
4. **Semplicità**: Port mapping chiaro e documentato
5. **Manutenibilità**: Aggiornamenti rapidi

---

**Domande?** Consulta questa guida o chiedi supporto! 🚀
