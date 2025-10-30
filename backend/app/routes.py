from fastapi import APIRouter, Depends, HTTPException, status, Request
from typing import List, Dict, Any, Optional
import requests  # Mantenuto per il test di connessione
import httpx      # NUOVO: Per richieste asincrone
import asyncio    # NUOVO: Per eseguire richieste in parallelo
import os
import logging
import time
import traceback
from datetime import datetime, date, timedelta
import calendar
from .models import DowntimeRequest, HostResponse, StatsResponse, DowntimeResponse, ConnectionTestResponse
from .dependencies import get_current_user

# Configurazione logger
logger = logging.getLogger("checkmk_api")

router = APIRouter()

# Funzione di utilità per ottenere info di configurazione Checkmk
def get_checkmk_config():
    """Restituisce la configurazione Checkmk dalle variabili d'ambiente"""
    config = {
        "host": os.environ.get("CHECKMK_HOST", "monitor-horsarun.horsa.it"),
        "site": os.environ.get("CHECKMK_SITE", "mkhrun"),
        "user": os.environ.get("CHECKMK_USER", "demousera"),
        "password": os.environ.get("CHECKMK_PASSWORD"),
    }
    return config

# Funzione per testare la connessione al server Checkmk (ora usa 'requests' standard)
# NOTA: Questa è 'async def' ora, ma usa 'requests' in un thread separato 
# per non bloccare. Un'alternativa sarebbe riscriverla con httpx.
async def test_checkmk_connection() -> Dict[str, str]:
    """Test di connessione al server Checkmk"""
    try:
        logger.info("Testing connection to Checkmk server...")
        config = get_checkmk_config()
        api_url = f"https://{config['host']}/{config['site']}/check_mk/api/1.0"
        
        # Usiamo requests qui per semplicità, ma potremmo passare a httpx
        session = requests.session()
        session.headers['Authorization'] = f"Bearer {config['user']} {config['password']}"
        session.headers['Accept'] = 'application/json'
        
        start_time = time.time()
        resp = session.get(
            f"{api_url}/version",
            timeout=10
        )
        response_time = time.time() - start_time
        
        if resp.status_code == 200:
            version_info = resp.json() if resp.text else {"version": "unknown"}
            logger.info(f"Connection successful! Response time: {response_time:.2f}s")
            logger.info(f"Checkmk version: {version_info.get('version', 'unknown')}")
            return {
                "status": "success", 
                "message": f"Connected to Checkmk v{version_info.get('version', 'unknown')} in {response_time:.2f}s"
            }
        else:
            logger.error(f"Connection failed with status code: {resp.status_code}")
            return {
                "status": "error", 
                "message": f"Failed with status {resp.status_code}: {resp.text}"
            }
    except requests.exceptions.ConnectionError as e:
        logger.error(f"Connection error: {str(e)}")
        return {"status": "error", "message": f"Connection error: {str(e)}"}
    except requests.exceptions.Timeout:
        logger.error("Connection timed out")
        return {"status": "error", "message": "Connection timed out (>10s)"}
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return {"status": "error", "message": f"Unexpected error: {str(e)}"}

# Endpoint per testare la connessione
@router.get("/connection-test", response_model=ConnectionTestResponse)
async def connection_test():
    """Test di connessione al server Checkmk"""
    result = await test_checkmk_connection()
    return result

def calcolo_dst(day):
    # ... (la tua funzione calcolo_dst è corretta, nessuna modifica)
    logger.debug(f"Calculating DST for date: {day}")
    marzo = calendar.monthcalendar(day.year, 3)
    ottobre = calendar.monthcalendar(day.year, 10)

    dom_marzo = None
    dom_otto = None

    # Trova l'ultima domenica di marzo
    for i in range(len(marzo)-1, -1, -1):
        for j in range(6, -1, -1):
            if marzo[i][j] != 0 and j == 6:
                dom_marzo = marzo[i][j]
                break
        if dom_marzo:
            break

    # Trova l'ultima domenica di ottobre
    for i in range(len(ottobre)-1, -1, -1):
        for j in range(6, -1, -1):
            if ottobre[i][j] != 0 and j == 6:
                dom_otto = ottobre[i][j]
                break
        if dom_otto:
            break

    inizio_ora = date(day.year, 3, dom_marzo)
    fine_ora = date(day.year, 10, dom_otto)
    
    result = "+02:00" if inizio_ora <= day.date() < fine_ora else "+01:00"
    logger.debug(f"DST result for {day}: {result}")
    return result

@router.get("/hosts", response_model=HostResponse)
async def get_hosts(request: Request, token: str = Depends(get_current_user)):
    # ... (la tua funzione get_hosts è corretta, nessuna modifica)
    # ... (puoi considerare di passare a httpx anche qui per coerenza)
    request_id = f"req-{int(time.time())}"
    logger.info(f"[{request_id}] GET /hosts - Request received")
    
    config = get_checkmk_config()
    api_url = f"https://{config['host']}/{config['site']}/check_mk/api/1.0"
    
    try:
        logger.info(f"[{request_id}] Connecting to Checkmk API: {api_url}")
        
        session = requests.session()
        session.headers['Authorization'] = f"Bearer {config['user']} {config['password']}"
        session.headers['Accept'] = 'application/json'
        
        start_time = time.time()
        resp = session.get(
            f"{api_url}/domain-types/host_config/collections/all",
            params={"effective_attributes": False},
            timeout=30
        )
        response_time = time.time() - start_time
        
        logger.info(f"[{request_id}] API response received in {response_time:.2f}s with status: {resp.status_code}")
        
        if resp.status_code == 200:
            host_list = []
            data = resp.json()
            for item in data['value']:
                host_list.append(item['id'])
            
            logger.info(f"[{request_id}] Successfully retrieved {len(host_list)} hosts")
            return {"hosts": host_list}
        else:
            logger.error(f"[{request_id}] API error: {resp.status_code} - {resp.text}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error from Checkmk API: {resp.status_code} - {resp.text}"
            )
    except requests.exceptions.ConnectionError as e:
        error_msg = f"Connection error to Checkmk API: {str(e)}"
        logger.error(f"[{request_id}] {error_msg}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=error_msg
        )
    except requests.exceptions.Timeout:
        error_msg = "Connection timed out to Checkmk API (>30s)"
        logger.error(f"[{request_id}] {error_msg}")
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail=error_msg
        )
    except Exception as e:
        error_msg = f"Failed to fetch hosts: {str(e)}"
        logger.error(f"[{request_id}] {error_msg}")
        logger.error(f"[{request_id}] {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_msg
        )

@router.get("/stats", response_model=StatsResponse)
async def get_stats(request: Request, token: str = Depends(get_current_user)):
    # ... (la tua funzione get_stats è corretta, nessuna modifica)
    # ... (puoi considerare di passare a httpx anche qui)
    request_id = f"req-{int(time.time())}"
    logger.info(f"[{request_id}] GET /stats - Request received")
    
    config = get_checkmk_config()
    api_url = f"https://{config['host']}/{config['site']}/check_mk/api/1.0"
    
    try:
        logger.info(f"[{request_id}] Connecting to Checkmk API: {api_url}")
        
        session = requests.session()
        session.headers['Authorization'] = f"Bearer {config['user']} {config['password']}"
        session.headers['Accept'] = 'application/json'
        
        # Ottieni numero di host
        logger.info(f"[{request_id}] Fetching hosts data...")
        start_time = time.time()
        hosts_resp = session.get(
            f"{api_url}/domain-types/host_config/collections/all",
            params={"effective_attributes": False},
            timeout=30
        )
        hosts_time = time.time() - start_time
        logger.info(f"[{request_id}] Hosts data received in {hosts_time:.2f}s with status: {hosts_resp.status_code}")
        
        # Ottieni downtime attivi
        logger.info(f"[{request_id}] Fetching downtimes data...")
        start_time = time.time()
        downtimes_resp = session.get(
            f"{api_url}/domain-types/downtime/collections/host",
            timeout=30
        )
        downtimes_time = time.time() - start_time
        logger.info(f"[{request_id}] Downtimes data received in {downtimes_time:.2f}s with status: {downtimes_resp.status_code}")
        
        if hosts_resp.status_code == 200 and downtimes_resp.status_code == 200:
            hosts_data = hosts_resp.json()
            downtimes_data = downtimes_resp.json()
            
            host_count = len(hosts_data['value']) if 'value' in hosts_data else 0
            downtime_count = len(downtimes_data['value']) if 'value' in downtimes_data else 0
            
            logger.info(f"[{request_id}] Successfully retrieved stats: {host_count} hosts, {downtime_count} active downtimes")
            
            return {
                "totalHosts": host_count,
                "activeDowntimes": downtime_count
            }
        else:
            error_detail = []
            if hosts_resp.status_code != 200:
                error_detail.append(f"Hosts API error: {hosts_resp.status_code}")
            if downtimes_resp.status_code != 200:
                error_detail.append(f"Downtimes API error: {downtimes_resp.status_code}")
                
            error_msg = " | ".join(error_detail)
            logger.error(f"[{request_id}] API errors: {error_msg}")
            
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error fetching data from Checkmk API: {error_msg}"
            )
    except requests.exceptions.ConnectionError as e:
        error_msg = f"Connection error to Checkmk API: {str(e)}"
        logger.error(f"[{request_id}] {error_msg}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=error_msg
        )
    except requests.exceptions.Timeout:
        error_msg = "Connection timed out to Checkmk API (>30s)"
        logger.error(f"[{request_id}] {error_msg}")
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail=error_msg
        )
    except Exception as e:
        error_msg = f"Failed to fetch stats: {str(e)}"
        logger.error(f"[{request_id}] {error_msg}")
        logger.error(f"[{request_id}] {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_msg
        )

# --- NUOVA FUNZIONE HELPER ASINCRONA ---
async def post_downtime(
    session: httpx.AsyncClient, 
    url: str, 
    payload: dict, 
    request_id: str, 
    index: int, 
    total: int
) -> str:
    """Invia una singola richiesta di downtime in modo asincrono."""
    
    logger.info(f"[{request_id}] Request {index+1}/{total}: Scheduling downtime for {payload['host_name']} from {payload['start_time']} to {payload['end_time']}")
    logger.debug(f"[{request_id}] Request payload: {payload}")
    
    try:
        # Usa await per la richiesta asincrona
        resp = await session.post(url, json=payload, timeout=30.0) 
        
        if resp.status_code == 200 or resp.status_code == 204:
            logger.info(f"[{request_id}] Request {index+1} succeeded (Status: {resp.status_code})")
            return "Done"
        else:
            error_msg = f"Error {resp.status_code}"
            logger.error(f"[{request_id}] Request {index+1} failed: {error_msg} - {resp.text}")
            return error_msg
    except httpx.ReadTimeout:
        error_msg = "Request timed out (>30s)"
        logger.error(f"[{request_id}] Request {index+1} failed with exception: {error_msg}")
        return error_msg
    except Exception as e:
        error_msg = f"Request failed: {str(e)}"
        logger.error(f"[{request_id}] Request {index+1} failed with exception: {str(e)}")
        return error_msg

@router.post("/schedule", response_model=DowntimeResponse)
async def schedule_downtime(request: Request, req: DowntimeRequest, token: str = Depends(get_current_user)):
    """Programma i downtime per gli host selezionati (ORA IN PARALLELO)"""
    request_id = f"req-{int(time.time())}"
    logger.info(f"[{request_id}] POST /schedule - Request received")
    logger.info(f"[{request_id}] Request data: host={req.host}, giorni={req.giorni}, startTime={req.startTime}, endTime={req.endTime}, ripeti={req.ripeti}")
    
    config = get_checkmk_config()
    api_url = f"https://{config['host']}/{config['site']}/check_mk/api/1.0"
    
    try:
        # Parsing dei parametri (nessuna modifica qui)
        host = req.host
        giorni = req.giorni
        start_time = req.startTime
        end_time = req.endTime
        ripeti_val = req.ripeti
        commento = req.commento
        
        # ... (logica di conversione 'ripeti' - nessuna modifica)
        ripeti = 0
        if isinstance(ripeti_val, str):
            if ripeti_val == "domenica":
                ripeti = 30  # Approssimazione
                logger.info(f"[{request_id}] 'domenica' recurrence translated to 30 days")
            elif ripeti_val == "weekend":
                ripeti = 30  # Approssimazione
                logger.info(f"[{request_id}] 'weekend' recurrence translated to 30 days")
            else:
                ripeti = 0
                logger.warning(f"[{request_id}] Unknown string recurrence value: {ripeti_val}, using 0 days")
        else:
            ripeti = ripeti_val
            logger.info(f"[{request_id}] Using numeric recurrence: {ripeti} days")

        
        # Calcola date di downtime (nessuna modifica qui)
        today = datetime.today()
        l_start = []
        l_end = []
        
        logger.info(f"[{request_id}] Calculating downtime dates for {ripeti+1} days starting from {today}")
        
        for i in range(ripeti + 1):
            day = today + timedelta(days=i)
            
            if day.weekday() in giorni:
                logger.debug(f"[{request_id}] Processing day {day} (weekday {day.weekday()})")
                
                start_dt = datetime.strptime(start_time, "%H:%M")
                end_dt = datetime.strptime(end_time, "%H:%M")
                
                day_start = datetime(
                    day.year, day.month, day.day, 
                    start_dt.hour, start_dt.minute
                )
                
                if end_dt.time() < start_dt.time():
                    day_end = datetime(
                        day.year, day.month, day.day,
                        end_dt.hour, end_dt.minute
                    ) + timedelta(days=1)
                    logger.debug(f"[{request_id}] Overnight downtime detected (end < start)")
                else:
                    day_end = datetime(
                        day.year, day.month, day.day,
                        end_dt.hour, end_dt.minute
                    )
                
                tz_start = calcolo_dst(day_start)
                tz_end = calcolo_dst(day_end)
                
                formatted_start = f"{day_start.isoformat()}{tz_start}"
                formatted_end = f"{day_end.isoformat()}{tz_end}"
                
                l_start.append(formatted_start)
                l_end.append(formatted_end)
                
                logger.debug(f"[{request_id}] Added downtime: {formatted_start} to {formatted_end}")
        
        logger.info(f"[{request_id}] Generated {len(l_start)} downtime periods")
        
        if len(l_start) == 0:
            logger.warning(f"[{request_id}] No downtime periods were generated!")
            return {
                "start_times": [],
                "end_times": [],
                "responses": []
            }
        
        # --- INIZIO MODIFICA: Esecuzione Parallela ---
        
        logger.info(f"[{request_id}] Connecting to Checkmk API: {api_url}")
        
        headers = {
            'Authorization': f"Bearer {config['user']} {config['password']}",
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }

        tasks = []
        
        logger.info(f"[{request_id}] Preparing {len(l_end)} downtime schedule requests to run in parallel...")

        # Crea un client asincrono
        async with httpx.AsyncClient(headers=headers, timeout=30.0) as session:
            for i in range(len(l_end)):
                payload = {
                    'start_time': l_start[i],
                    'end_time': l_end[i],
                    'recur': 'fixed',
                    'duration': 0,
                    'comment': commento,
                    'downtime_type': 'host',
                    'host_name': host,
                }
                
                # Aggiungi il *task* (la chiamata di funzione asincrona) alla lista
                tasks.append(post_downtime(
                    session=session,
                    url=f"{api_url}/domain-types/downtime/collections/host",
                    payload=payload,
                    request_id=request_id,
                    index=i,
                    total=len(l_end)
                ))
            
            # Esegui tutti i task in parallelo e attendi i risultati
            logger.info(f"[{request_id}] Sending {len(tasks)} requests...")
            start_exec_time = time.time()
            risposta = await asyncio.gather(*tasks) # Esegue tutto insieme
            exec_time = time.time() - start_exec_time
            logger.info(f"[{request_id}] All requests completed in {exec_time:.2f} seconds")

        # --- FINE MODIFICA ---
        
        success_count = risposta.count("Done")
        logger.info(f"[{request_id}] Schedule complete: {success_count}/{len(risposta)} requests succeeded")
        
        return {
            "start_times": l_start,
            "end_times": l_end,
            "responses": risposta
        }
    except Exception as e:
        error_msg = f"Failed to schedule downtime: {str(e)}"
        logger.error(f"[{request_id}] {error_msg}")
        logger.error(f"[{request_id}] {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_msg
        )

@router.get("/downtimes", response_model=List[Dict[str, Any]])
async def get_downtimes(request: Request, token: str = Depends(get_current_user)):
    # ... (la tua funzione get_downtimes è corretta, nessuna modifica)
    # ... (puoi considerare di passare a httpx anche qui)
    request_id = f"req-{int(time.time())}"
    logger.info(f"[{request_id}] GET /downtimes - Request received")
    
    config = get_checkmk_config()
    api_url = f"https://{config['host']}/{config['site']}/check_mk/api/1.0"
    
    try:
        logger.info(f"[{request_id}] Fetching existing downtimes from Checkmk")
        
        session = requests.session()
        session.headers['Authorization'] = f"Bearer {config['user']} {config['password']}"
        session.headers['Accept'] = 'application/json'
        
        start_time = time.time()
        resp = session.get(
            f"{api_url}/domain-types/downtime/collections/host",
            timeout=30
        )
        response_time = time.time() - start_time
        
        logger.info(f"[{request_id}] API response received in {response_time:.2f}s with status: {resp.status_code}")
        
        if resp.status_code == 200:
            downtimes = resp.json().get('value', [])
            logger.info(f"[{request_id}] Successfully retrieved {len(downtimes)} downtimes")
            
            formatted_downtimes = []
            for dt in downtimes:
                try:
                    formatted_dt = {
                        "id": dt.get("id"),
                        "host_name": dt.get("extensions", {}).get("host_name", ""),
                        "start_time": dt.get("extensions", {}).get("start_time", ""),
                        "end_time": dt.get("extensions", {}).get("end_time", ""),
                        "comment": dt.get("extensions", {}).get("comment", ""),
                        "created_by": dt.get("extensions", {}).get("author", ""),
                    }
                    formatted_downtimes.append(formatted_dt)
                except Exception as e:
                    logger.warning(f"[{request_id}] Error formatting downtime: {e}")
            
            return formatted_downtimes
        else:
            error_msg = f"API error: {resp.status_code} - {resp.text}"
            logger.error(f"[{request_id}] {error_msg}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=error_msg
            )
    except Exception as e:
        error_msg = f"Failed to fetch downtimes: {str(e)}"
        logger.error(f"[{request_id}] {error_msg}")
        logger.error(f"[{request_id}] {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_msg
        )