FROM python:3.9-slim

WORKDIR /app

# Installa dipendenze
COPY ./requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Aggiunge esplicitamente httpx in caso di problemi
RUN pip install --no-cache-dir httpx>=0.25.0

# Crea directory per i log
RUN mkdir -p /app/logs

# Copia l'applicazione
COPY ./app /app/app

# Espone la porta
EXPOSE 8000

# Avvia l'applicazione con output completo
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--log-level", "info"]