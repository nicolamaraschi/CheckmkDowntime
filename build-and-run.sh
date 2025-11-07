#!/bin/bash

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "=========================================="
echo "  BUILD E DEPLOY CHECKMK DOWNTIME APP"
echo "=========================================="
echo ""

# Step 1: Build
echo -e "${YELLOW}Step 1: Build immagine Docker...${NC}"
docker build -t checkmk-downtime-app:latest .
echo -e "${GREEN}✓ Immagine costruita${NC}"
echo ""

# Step 2: Ferma container vecchi
echo -e "${YELLOW}Step 2: Fermo container vecchi...${NC}"
docker rm -f checkmk-app 2>/dev/null || true
echo -e "${GREEN}✓ Container vecchi rimossi${NC}"
echo ""

# Step 3: Input variabili
echo "=========================================="
echo "  CONFIGURAZIONE VARIABILI"
echo "=========================================="
echo ""

read -p "CHECKMK_HOST [checkmk.horsacloudtech.net]: " CHECKMK_HOST
CHECKMK_HOST=${CHECKMK_HOST:-checkmk.horsacloudtech.net}

read -p "CHECKMK_SITE [mkhrun]: " CHECKMK_SITE
CHECKMK_SITE=${CHECKMK_SITE:-mkhrun}

read -p "CHECKMK_USER [demousera]: " CHECKMK_USER
CHECKMK_USER=${CHECKMK_USER:-demousera}

read -sp "CHECKMK_PASSWORD (obbligatoria): " CHECKMK_PASSWORD
echo ""

if [ -z "$CHECKMK_PASSWORD" ]; then
    echo -e "${YELLOW}❌ Password obbligatoria!${NC}"
    exit 1
fi

read -p "COGNITO_REGION [eu-west-1]: " COGNITO_REGION
COGNITO_REGION=${COGNITO_REGION:-eu-west-1}

read -p "COGNITO_USER_POOL_ID [eu-west-1_E3d6JEkfX]: " COGNITO_USER_POOL_ID
COGNITO_USER_POOL_ID=${COGNITO_USER_POOL_ID:-eu-west-1_E3d6JEkfX}

read -p "COGNITO_APP_CLIENT_ID [5v6sqab99b9mbb7es880cg6mjc]: " COGNITO_APP_CLIENT_ID
COGNITO_APP_CLIENT_ID=${COGNITO_APP_CLIENT_ID:-5v6sqab99b9mbb7es880cg6mjc}

echo ""
echo -e "${YELLOW}Step 3: Avvio container...${NC}"

# Step 4: Run container CON LE VARIABILI
docker run -d \
  --name checkmk-app \
  --restart unless-stopped \
  -p 8436:80 \
  -e CHECKMK_HOST="$CHECKMK_HOST" \
  -e CHECKMK_SITE="$CHECKMK_SITE" \
  -e CHECKMK_USER="$CHECKMK_USER" \
  -e CHECKMK_PASSWORD="$CHECKMK_PASSWORD" \
  -e COGNITO_REGION="$COGNITO_REGION" \
  -e COGNITO_USER_POOL_ID="$COGNITO_USER_POOL_ID" \
  -e COGNITO_APP_CLIENT_ID="$COGNITO_APP_CLIENT_ID" \
  checkmk-downtime-app:latest

echo -e "${GREEN}✓ Container avviato${NC}"
echo ""

echo "=========================================="
echo -e "${GREEN}✓✓✓ DEPLOY COMPLETATO! ✓✓✓${NC}"
echo "=========================================="
echo ""
echo "🌐 App: http://localhost:8436"
echo ""
echo "📋 Comandi utili:"
echo "  docker logs -f checkmk-app"
echo "  docker restart checkmk-app"
echo "  docker stop checkmk-app"
echo ""