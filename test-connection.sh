#!/bin/bash
set -e

# Carica variabili d'ambiente
set -a
source .env
set +a

echo "Testing connection to Checkmk API..."
echo "Host: $CHECKMK_HOST"
echo "Site: $CHECKMK_SITE"
echo "User: $CHECKMK_USER"

# Esegui curl per testare la connessione
curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $CHECKMK_USER $CHECKMK_PASSWORD" \
  -H "Accept: application/json" \
  "https://$CHECKMK_HOST/$CHECKMK_SITE/check_mk/api/1.0/version" || echo "Connection failed"

echo ""
echo "Done."
