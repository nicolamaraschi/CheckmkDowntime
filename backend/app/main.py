from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import logging
import time
import requests
from dotenv import load_dotenv

# Importa il router dal tuo file routes.py
# GIUSTO
from .routes import router as api_router
from .routes_logs import router as logs_router
from .routes_cloudconnexa import router as cloudconnexa_router
from .routes_sap import router as sap_router

# Configura il logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(module)s:%(lineno)d] - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)

logger = logging.getLogger(__name__)

# Carica le variabili d'ambiente
load_dotenv()

# Crea l'app FastAPI
app = FastAPI(title="Checkmk Downtime API")

# Configurazione CORS
origins = [
    "http://localhost",
    "http://localhost:3000",  # Frontend React in sviluppo
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- INCLUSIONE ROUTER ---
# Questa riga dice a FastAPI di usare tutte le rotte definite
# in routes.py e di prefissarle con /api
app.include_router(api_router, prefix="/api")
app.include_router(logs_router, prefix="/api")
app.include_router(cloudconnexa_router, prefix="/api")
app.include_router(sap_router, prefix="/api")

# --- ROUTE DUPLICATE RIMOSSE ---
# Le rotte /api/hosts, /api/downtime, /api/downtimes, /api/test-connection
# sono state rimosse da qui perché ora sono gestite da routes.py

# Configurazione Checkmk (usata solo per il test di avvio)
CHECKMK_HOST = os.getenv("CHECKMK_HOST")
CHECKMK_SITE = os.getenv("CHECKMK_SITE")
CHECKMK_USER = os.getenv("CHECKMK_USER")
CHECKMK_PASSWORD = os.getenv("CHECKMK_PASSWORD")
CHECKMK_API_URL = f"https://{CHECKMK_HOST}/{CHECKMK_SITE}/check_mk/api/1.0"

# Verifica la presenza delle variabili d'ambiente
logger.info("Starting application with configuration:")
logger.info(f"CHECKMK_HOST: {CHECKMK_HOST}")
logger.info(f"CHECKMK_SITE: {CHECKMK_SITE}")
logger.info(f"CHECKMK_USER: {CHECKMK_USER}")
logger.info(f"CHECKMK_PASSWORD: {'*****' if CHECKMK_PASSWORD else 'Not set'}")

# Funzione di utilità per il test di connessione (usata solo allo startup)
def test_checkmk_connection():
    # NOTA: questa sessione è diversa da quella usata in routes.py
    # Questa usa 'requests', routes.py usa 'httpx'
    session = requests.session()
    session.headers['Authorization'] = f"Bearer {CHECKMK_USER} {CHECKMK_PASSWORD}"
    session.headers['Accept'] = 'application/json'
    
    logger.info("Testing connection to Checkmk server...")
    start_time = time.time()
    
    try:
        response = session.get(f"{CHECKMK_API_URL}/version", timeout=10)
        
        if response.status_code == 200:
            end_time = time.time()
            response_time = round(end_time - start_time, 2)
            
            version = response.json().get("value", "unknown")
            logger.info(f"Connection successful! Response time: {response_time}s")
            logger.info(f"Checkmk version: {version}")
            
            return f"Connected to Checkmk v{version} in {response_time}s"
        else:
            logger.error(f"Connection error: HTTP {response.status_code}")
            return f"Connection error: HTTP {response.status_code}"
    except requests.exceptions.Timeout:
        logger.error("Connection timed out (>10s)")
        return "Connection timed out (>10s)"
    except requests.exceptions.RequestException as e:
        logger.error(f"Connection error: {str(e)}")
        return f"Connection error: {str(e)}"

# Rotta principale
@app.get("/")
def root():
    return {"message": "Checkmk Downtime API"}

# Avvio dell'applicazione
@app.on_event("startup")
async def startup_event():
    logger.info("=" * 52)
    logger.info("          Checkmk Downtime API Started              ")
    logger.info("=" * 52)
    
    # Testa la connessione a Checkmk
    connection_result = test_checkmk_connection()
    if "Connected to Checkmk" in connection_result:
        logger.info(f"✅ Successfully connected to Checkmk: {connection_result}")
    else:
        logger.error(f"❌ Failed to connect to Checkmk: {connection_result}")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("=" * 52)
    logger.info("          Checkmk Downtime API Stopped              ")
    logger.info("=" * 52)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)