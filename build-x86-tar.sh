#!/bin/bash

set -e

# Colori
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "=========================================="
echo "  BUILD IMMAGINE DOCKER x86 → TAR"
echo "=========================================="

# Nome immagine e file output
IMAGE_NAME="checkmk-downtime-app"
IMAGE_TAG="latest"
OUTPUT_FILE="checkmk-downtime-app-x86.tar"

echo -e "${BLUE}Configurazione:${NC}"
echo "  - Immagine: ${IMAGE_NAME}:${IMAGE_TAG}"
echo "  - Piattaforma: linux/amd64 (x86)"
echo "  - Output: ${OUTPUT_FILE}"
echo ""

# Verifica Docker
echo -e "${YELLOW}[1/4] Verifica Docker...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker non trovato!${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker trovato${NC}"

# Verifica Dockerfile
echo -e "${YELLOW}[2/4] Verifica Dockerfile...${NC}"
if [ ! -f "Dockerfile" ]; then
    echo -e "${RED}❌ Dockerfile non trovato!${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Dockerfile presente${NC}"

# Build immagine per x86
echo -e "${YELLOW}[3/4] Build immagine per x86 (può richiedere alcuni minuti)...${NC}"
docker buildx build \
  --platform linux/amd64 \
  --tag ${IMAGE_NAME}:${IMAGE_TAG} \
  --load \
  .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Build completata con successo${NC}"
else
    echo -e "${RED}❌ Build fallita${NC}"
    exit 1
fi

# Verifica dimensione immagine
IMAGE_SIZE=$(docker images ${IMAGE_NAME}:${IMAGE_TAG} --format "{{.Size}}")
echo -e "${BLUE}ℹ️  Dimensione immagine: ${IMAGE_SIZE}${NC}"

# Export immagine in tar
echo -e "${YELLOW}[4/4] Export immagine in file TAR...${NC}"
docker save ${IMAGE_NAME}:${IMAGE_TAG} -o ${OUTPUT_FILE}

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Export completato${NC}"
else
    echo -e "${RED}❌ Export fallito${NC}"
    exit 1
fi

# Info file tar
TAR_SIZE=$(du -h ${OUTPUT_FILE} | cut -f1)
echo ""
echo "=========================================="
echo -e "${GREEN}✓✓✓ COMPLETATO CON SUCCESSO! ✓✓✓${NC}"
echo "=========================================="
echo ""
echo "📦 File creato: ${OUTPUT_FILE}"
echo "📊 Dimensione: ${TAR_SIZE}"
echo ""
echo "📋 Per importare su un altro server:"
echo "   docker load -i ${OUTPUT_FILE}"
echo ""
echo "🚀 Per avviare il container:"
echo "   docker run -d \\"
echo "     --name checkmk-app \\"
echo "     --restart unless-stopped \\"
echo "     -p 8436:80 \\"
echo "     -e CHECKMK_HOST=checkmk.horsacloudtech.net \\"
echo "     -e CHECKMK_SITE=mkhrun \\"
echo "     -e CHECKMK_USER=demousera \\"
echo "     -e CHECKMK_PASSWORD=TUA_PASSWORD \\"
echo "     -e COGNITO_REGION=eu-west-1 \\"
echo "     -e COGNITO_USER_POOL_ID=eu-west-1_E3d6JEkfX \\"
echo "     -e COGNITO_APP_CLIENT_ID=5v6sqab99b9mbb7es880cg6mjc \\"
echo "     ${IMAGE_NAME}:${IMAGE_TAG}"
echo ""