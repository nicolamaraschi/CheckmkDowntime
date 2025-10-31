#!/bin/bash
#
# Script per testare le API del backend CheckmkDowntime
#
# REQUISITI:
#   1. 'jq' (JSON processor): sudo apt-get install jq
#   2. Un Token JWT valido (da passare come primo argomento)
#

# --- Configurazione ---
BASE_URL="http://localhost:8000/api"
LOG_FILE="api_test.log"

# --- Colori per l'output ---
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[1;33m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

# --- Controllo Argomenti (Token) ---
if [ -z "$1" ]; then
    echo -e "${RED}ERRORE: Token di autenticazione non fornito.${NC}"
    echo -e "Uso: $0 <IL_TUO_TOKEN_JWT>"
    echo -e "Puoi ottenere un token JWT accedendo al frontend dell'applicazione."
    exit 1
fi
TOKEN="$1"
AUTH_HEADER="Authorization: Bearer $TOKEN"

# --- Funzione di Logging ---
# Stampa un messaggio sia sulla console che sul file di log
log() {
    local message="$1"
    # Aggiunge timestamp e rimuove codici colore per il file di log
    echo -e "[$(date +'%Y-%m-%d %H:%M:%S')] $message" | tee -a "$LOG_FILE"
}

# --- Funzione Helper per Test ---
# Esegue un singolo test API
# --- Funzione Helper per Test ---
# Esegue un singolo test API
run_test() {
    local test_name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4" # Dati JSON (opzionali) come stringa
    
    log "${YELLOW}-----------------------------------------------------${NC}"
    log "${YELLOW}--- INIZIO TEST: $test_name ---${NC}"
    log "${BLUE}Endpoint: $method $BASE_URL$endpoint${NC}"

    # --- CORREZIONE PER MACOS: usare %s (secondi) ---
    local start_time=$(date +%s) 
    
    local curl_opts=("-s" "-L" "-w" "%{http_code}" "-X" "$method")
    
    # Aggiungi header
    curl_opts+=("-H" "Accept: application/json")

    if [ "$endpoint" == "/connection-test" ]; then
        # Il test di connessione non richiede autenticazione
        log "Auth: No"
    elif [ "$method" == "POST" ]; then
        # POST con Auth
        log "Auth: Sì (Token fornito)"
        curl_opts+=("-H" "$AUTH_HEADER")
        curl_opts+=("-H" "Content-Type: application/json")
        curl_opts+=("-d" "$data")
        log "Payload: $data"
    else
        # GET con Auth
        log "Auth: Sì (Token fornito)"
        curl_opts+=("-H" "$AUTH_HEADER")
    fi
    
    # Esegui curl
    response_with_code=$(curl "${curl_opts[@]}" "$BASE_URL$endpoint")
    
    # Estrai codice HTTP (ultimi 3 caratteri)
    http_code=${response_with_code: -3}
    # Estrai corpo (tutto tranne gli ultimi 3 caratteri)
    response_body=${response_with_code:0:${#response_with_code}-3}
    
    # --- CORREZIONE PER MACOS: calcolo in secondi ---
    local end_time=$(date +%s)
    local duration=$(($end_time - $start_time)) # Secondi
    
    log "Risposta (HTTP $http_code) ricevuta in ${duration}s" # Modificato in 's'
    log "--- Corpo della Risposta ---"
    
    # Formatta JSON se è JSON, altrimenti stampa
    if echo "$response_body" | jq . > /dev/null 2>&1; then
        echo "$response_body" | jq . | tee -a >(sed 's/^/    /' >> "$LOG_FILE")
    else
        echo "$response_body" | tee -a >(sed 's/^/    /' >> "$LOG_FILE")
    fi
    log "----------------------------"

    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        log "${GREEN}RISULTATO: PASS (HTTP $http_code)${NC}"
    else
        log "${RED}RISULTATO: FAIL (HTTP $http_code)${NC}"
    fi
    
    log "${YELLOW}--- FINE TEST: $test_name ---${NC}\n"
}

# --- Esecuzione dei Test ---

# Pulisci log precedente
> "$LOG_FILE"
log "Inizio test API backend... (Log completo in $LOG_FILE)"
log "URL Base: $BASE_URL"
log "Token (primi 10 caratteri): ${TOKEN:0:10}..."

# Test 1: Connection Test (Nessuna auth richiesta)
run_test "Connection Test" "GET" "/connection-test"

# Test 2: Get Hosts (Auth richiesta)
run_test "Get Hosts" "GET" "/hosts"

# Test 3: Get Stats (Auth richiesta)
run_test "Get Stats" "GET" "/stats"

# Test 4: Get Downtimes (Auth richiesta)
run_test "Get Downtimes" "GET" "/downtimes"

# --- Test 5: Schedule Downtime (Auth richiesta) ---
#
# ATTENZIONE: Questo test cercherà di creare un downtime REALE.
# Modifica la variabile 'TEST_HOST' con un host valido per il test.
#
# !! MODIFICA QUESTA VARIABILE !!
TEST_HOST="un-host-di-esempio" 
# !! ------------------------- !!

log "${YELLOW}ATTENZIONE: Il test /schedule (Test 5) userà l'host '$TEST_HOST'.${NC}"
log "${YELLOW}Assicurati che sia un host valido o modifica lo script.${NC}"
sleep 3 # Diamo tempo all'utente di leggere

# Payload JSON.
# Nota: le virgolette interne sono escapate.
# Questo payload crea un downtime per 5 minuti (23:00-23:05)
# solo per oggi (ripeti: 0) e solo se oggi è Lunedì (giorni: [0]).
# Modifica 'giorni' se vuoi testare in un altro giorno.
SCHEDULE_PAYLOAD="{\"host\":\"$TEST_HOST\",\"giorni\":[0,1,2,3,4,5,6],\"startTime\":\"23:00\",\"endTime\":\"23:05\",\"ripeti\":0,\"commento\":\"Test API da script automatico\"}"

run_test "Schedule Downtime (Test)" "POST" "/schedule" "$SCHEDULE_PAYLOAD"

log "Tutti i test sono completati."
log "Controllare $LOG_FILE per i dettagli completi delle risposte."