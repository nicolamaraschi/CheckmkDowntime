# ✅ Checklist Variabili Portainer

Copia e incolla questa lista in Portainer → Environment Variables

## 🔐 CheckMK (4 variabili)
```
CHECKMK_HOST=checkmk.tuodominio.com
CHECKMK_SITE=monitoring
CHECKMK_USER=automation
CHECKMK_PASSWORD=***
```

## 🔐 AWS Cognito (3 variabili)
```
COGNITO_REGION=eu-west-1
COGNITO_USER_POOL_ID=eu-west-1_XXXXXXXXX
COGNITO_APP_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxx
```

## 🔐 AWS Athena CloudConnexa (4 variabili)
```
ATHENA_DB=cloudconnexa_logs_db
ATHENA_RESULTS_BUCKET=s3://bucket-athena-results/
ATHENA_WORKGROUP=primary
AWS_REGION=eu-central-1
```

## 🔐 AWS Athena SAP (2 variabili)
```
SAP_ATHENA_DB=sap_reports_db
SAP_ATHENA_WORKGROUP=ReportCheckSistemiSap
```

## 🔐 AWS Credentials (2 variabili - SOLO se NON usi IAM Role)
```
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=***
```

---

## 📊 Totale Variabili

- **Con IAM Role (EC2)**: 13 variabili
- **Senza IAM Role**: 15 variabili

---

## 🎯 Come inserirle in Portainer

1. **Containers** → **Add container**
2. **Advanced container settings** → **Env**
3. **Add environment variable** (clicca per ogni variabile)
4. Oppure usa **"Advanced mode"** e incolla tutto in formato:
   ```
   CHECKMK_HOST=valore
   CHECKMK_SITE=valore
   ...
   ```

---

## ⚠️ IMPORTANTE

- ✅ Sostituisci `***` con i valori reali
- ✅ Sostituisci `XXXXXXXXX` con gli ID reali
- ✅ Verifica che NON ci siano spazi extra
- ✅ Se usi IAM Role, NON inserire AWS_ACCESS_KEY_ID e AWS_SECRET_ACCESS_KEY
