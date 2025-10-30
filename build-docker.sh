#!/bin/bash
set -e

echo "Costruzione dell'immagine Docker..."

# Assicurati che .env esista
if [ ! -f .env ]; then
  echo "File .env non trovato. Creazione con valori predefiniti..."
  cp .env.example .env
  echo "IMPORTANTE: Aggiorna il file .env con i tuoi valori!"
fi

# Costruisci le immagini Docker
docker-compose build

echo "Immagini costruite con successo!"
echo "Per avviare l'applicazione esegui: ./start.sh"
