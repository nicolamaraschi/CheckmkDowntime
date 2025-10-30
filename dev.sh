#!/bin/bash

# Avvia il backend in un nuovo terminale
osascript -e 'tell app "Terminal" to do script "cd '$(pwd)'/backend && pip install -r requirements.txt && uvicorn app.main:app --reload"'

# Avvia il frontend
npm start
