#!/bin/bash
set -e

# Assicura che le directory necessarie esistano
mkdir -p logs
mkdir -p backend/logs

# Verifica se .env esiste
if [ ! -f .env ]; then
  echo "File .env non trovato. Creazione con valori predefiniti..."
  cat > .env << 'END_ENV'
CHECKMK_HOST=monitor-horsarun.horsa.it
CHECKMK_SITE=mkhrun
CHECKMK_USER=demousera
CHECKMK_PASSWORD=
END_ENV
  echo "⚠️ IMPORTANTE: Aggiorna il file .env con i tuoi valori!"
fi

# Esporta le variabili d'ambiente mantenendo i caratteri speciali
set -a
source .env
set +a

echo "=================================="
echo "  Avvio applicazione Checkmk     "
echo "=================================="
echo "Configurazione:"
echo "CHECKMK_HOST: ${CHECKMK_HOST}"
echo "CHECKMK_SITE: ${CHECKMK_SITE}"
echo "CHECKMK_USER: ${CHECKMK_USER}"
echo "CHECKMK_PASSWORD: ********"

# Verifica che Docker sia installato
if ! command -v docker &> /dev/null; then
    echo "❌ Docker non è installato. Installa Docker e riprova."
    exit 1
fi

# Verifica che Docker Compose sia installato
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose non è installato. Installa Docker Compose e riprova."
    exit 1
fi

# Costruisci e avvia i container
echo "Avvio dei container Docker..."
docker-compose up -d --build

echo ""
echo "✅ Applicazione avviata!"
echo "Frontend: http://localhost"
echo "Backend API: http://localhost/api"
echo ""
echo "Visualizza log del backend in tempo reale:"
echo "docker-compose logs -f backend"
echo ""
echo "I log sono anche disponibili nella directory ./logs"

# Opzione per vedere i log immediatamente
read -p "Visualizzare i log in tempo reale? (s/n): " SHOW_LOGS
if [[ $SHOW_LOGS == "s" ]]; then
    docker-compose logs -f backend
fi
