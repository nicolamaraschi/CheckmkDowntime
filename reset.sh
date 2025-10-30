#!/bin/bash

echo "⚠️ Questo script fermerà e rimuoverà tutti i container Docker dell'applicazione."
read -p "Sei sicuro di voler procedere? (s/n): " CONFIRM
if [[ $CONFIRM != "s" ]]; then
    echo "Operazione annullata."
    exit 0
fi

echo "Fermando e rimuovendo i container..."
docker-compose down -v

echo "Rimuovendo logs..."
rm -rf logs/*
rm -rf backend/logs/*

echo "Rimuovendo cache Docker..."
docker builder prune -f

echo "Reset completato. Per riavviare l'applicazione, esegui ./start.sh"
