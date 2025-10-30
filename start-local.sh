#!/bin/bash

# Avvia il backend in background
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Torna alla directory principale e avvia il frontend
cd ..
npm start &
FRONTEND_PID=$!

# Gestione della chiusura
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT TERM
wait
