from starlette.responses import Response
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from typing import List, Dict, Any, Optional
import requests
import httpx
import asyncio
import os
import logging
import time
import traceback
from datetime import datetime, date, timedelta
import calendar
from .models import DowntimeRequest, HostResponse, ClientResponse, StatsResponse, DowntimeResponse, ConnectionTestResponse, BatchDeleteRequest, BatchDeleteResponse
from .dependencies import get_current_user

logger = logging.getLogger("checkmk_api")

router = APIRouter()

def get_checkmk_config():
    config = {
        "host": os.environ.get("CHECKMK_HOST", "monitor-horsarun.horsa.it"),
        "site": os.environ.get("CHECKMK_SITE", "mkhrun"),
        "user": os.environ.get("CHECKMK_USER", "demousera"),
        "password": os.environ.get("CHECKMK_PASSWORD"),
    }
    return config

async def get_all_hosts_map(config: dict, headers: dict) -> Dict[str, str]:
    api_url = f"https://{config['host']}/{config['site']}/check_mk/api/1.0"
    logger.info("[Helper] Fetching host map...")
    
    try:
        async with httpx.AsyncClient(headers=headers, timeout=30.0, verify=False) as session:
            resp = await session.get(
                f"{api_url}/domain-types/host_config/collections/all",
                params={"effective_attributes": False}
            )
        resp.raise_for_status()
        
        host_map = {}
        data = resp.json()
        for item in data['value']:
            host_id = item['id']
            folder = item['extensions'].get('folder', '/')
            host_map[host_id] = folder
            
        logger.info(f"[Helper] Host map created with {len(host_map)} entries.")
        return host_map
    except httpx.HTTPStatusError as e:
        logger.error(f"[Helper] API error fetching hosts: {e.response.status_code} - {e.response.text}")
        return {}
    except Exception as e:
        logger.error(f"[Helper] Generic error fetching hosts: {type(e).__name__} - {str(e)}")
        logger.error(f"[Helper] Traceback: {traceback.format_exc()}")
        return {}

async def test_checkmk_connection() -> Dict[str, str]:
    try:
        logger.info("Testing connection to Checkmk server...")
        config = get_checkmk_config()
        api_url = f"https://{config['host']}/{config['site']}/check_mk/api/1.0"
        
        headers = {
            'Authorization': f"Bearer {config['user']} {config['password']}",
            'Accept': 'application/json'
        }
        
        start_time = time.time()
        
        async with httpx.AsyncClient(headers=headers, timeout=10.0, verify=False) as session:
            resp = await session.get(f"{api_url}/version")
        
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
            return {"status": "error", "message": f"Failed with status {resp.status_code}: {resp.text}"}
    except Exception as e:
        logger.error(f"Connection error: {str(e)}")
        return {"status": "error", "message": f"Connection error: {str(e)}"}

@router.get("/connection-test", response_model=ConnectionTestResponse)
async def connection_test():
    result = await test_checkmk_connection()
    return result

def calcolo_dst(day):
    logger.debug(f"Calculating DST for date: {day}")
    marzo = calendar.monthcalendar(day.year, 3)
    ottobre = calendar.monthcalendar(day.year, 10)

    dom_marzo = None
    dom_otto = None

    for i in range(len(marzo)-1, -1, -1):
        for j in range(6, -1, -1):
            if marzo[i][j] != 0 and j == 6:
                dom_marzo = marzo[i][j]
                break
        if dom_marzo:
            break

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
    request_id = f"req-{int(time.time())}"
    logger.info(f"[{request_id}] GET /hosts - Request received")
    
    config = get_checkmk_config()
    api_url = f"https://{config['host']}/{config['site']}/check_mk/api/1.0"
    
    headers = {
        'Authorization': f"Bearer {config['user']} {config['password']}",
        'Accept': 'application/json'
    }
    
    try:
        logger.info(f"[{request_id}] Connecting to Checkmk API (async): {api_url}")
        
        async with httpx.AsyncClient(headers=headers, timeout=30.0, verify=False) as session:
            start_time = time.time()
            resp = await session.get(
                f"{api_url}/domain-types/host_config/collections/all",
                params={"effective_attributes": False}
            )
            response_time = time.time() - start_time
        
        logger.info(f"[{request_id}] API response received in {response_time:.2f}s with status: {resp.status_code}")
        
        resp.raise_for_status()
        
        host_list = []
        data = resp.json()
        for item in data['value']:
            host_obj = {
                'id': item['id'],
                'folder': item['extensions'].get('folder', '/')
            }
            host_list.append(host_obj)

        logger.info(f"[{request_id}] Successfully retrieved {len(host_list)} hosts")
        return {"hosts": host_list}

    except httpx.HTTPStatusError as e:
        logger.error(f"[{request_id}] API error: {e.response.status_code} - {e.response.text}")
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"Error from Checkmk API: {e.response.status_code} - {e.response.text}"
        )
    except Exception as e:
        error_msg = f"Failed to fetch hosts: {str(e)}"
        logger.error(f"[{request_id}] {error_msg}")
        logger.error(f"[{request_id}] {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_msg
        )

@router.get("/clients", response_model=ClientResponse)
async def get_clients(request: Request, token: str = Depends(get_current_user)):
    request_id = f"req-{int(time.time())}"
    logger.info(f"[{request_id}] GET /clients - Request received")

    config = get_checkmk_config()
    api_url = f"https://{config['host']}/{config['site']}/check_mk/api/1.0"

    headers = {
        'Authorization': f"Bearer {config['user']} {config['password']}",
        'Accept': 'application/json'
    }

    try:
        logger.info(f"[{request_id}] Connecting to Checkmk API (async): {api_url}")

        async with httpx.AsyncClient(headers=headers, timeout=30.0, verify=False) as session:
            start_time = time.time()
            resp = await session.get(
                f"{api_url}/domain-types/host_config/collections/all",
                params={"effective_attributes": False}
            )
            response_time = time.time() - start_time

        logger.info(f"[{request_id}] API response received in {response_time:.2f}s with status: {resp.status_code}")
        
        resp.raise_for_status()

        data = resp.json()
        folders = set()
        for item in data['value']:
            folder = item['extensions'].get('folder', '/')
            folders.add(folder)

        client_list = sorted(list(folders))
        logger.info(f"[{request_id}] Successfully retrieved {len(client_list)} unique clients")
        return {"clients": client_list}
        
    except httpx.HTTPStatusError as e:
        logger.error(f"[{request_id}] API error: {e.response.status_code} - {e.response.text}")
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"Error from Checkmk API: {e.response.status_code} - {e.response.text}"
        )
    except Exception as e:
        error_msg = f"Failed to fetch clients: {str(e)}"
        logger.error(f"[{request_id}] {error_msg}")
        logger.error(f"[{request_id}] {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_msg
        )

@router.get("/stats", response_model=StatsResponse)
async def get_stats(request: Request, token: str = Depends(get_current_user)):
    request_id = f"req-{int(time.time())}"
    logger.info(f"[{request_id}] GET /stats - Request received")
    
    config = get_checkmk_config()
    api_url = f"https://{config['host']}/{config['site']}/check_mk/api/1.0"
    
    headers = {
        'Authorization': f"Bearer {config['user']} {config['password']}",
        'Accept': 'application/json'
    }
    
    try:
        logger.info(f"[{request_id}] Connecting to Checkmk API (async): {api_url}")
        
        async with httpx.AsyncClient(headers=headers, timeout=30.0, verify=False) as session:
            logger.info(f"[{request_id}] Fetching hosts data...")
            start_time = time.time()
            hosts_resp = await session.get(
                f"{api_url}/domain-types/host_config/collections/all",
                params={"effective_attributes": False}
            )
            hosts_time = time.time() - start_time
        
        logger.info(f"[{request_id}] Hosts data received in {hosts_time:.2f}s with status: {hosts_resp.status_code}")
        
        hosts_resp.raise_for_status()
        
        hosts_data = hosts_resp.json()
        host_count = len(hosts_data['value']) if 'value' in hosts_data else 0
        
        logger.info(f"[{request_id}] Successfully retrieved stats: {host_count} hosts")
        
        return {
            "totalHosts": host_count,
            "activeDowntimes": 0
        }
    
    except httpx.HTTPStatusError as e:
        error_msg = f"Hosts API error: {e.response.status_code} - {e.response.text}"
        logger.error(f"[{request_id}] API errors: {error_msg}")
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"Error fetching data from Checkmk API: {error_msg}"
        )
    except Exception as e:
        error_msg = f"Failed to fetch stats: {str(e)}"
        logger.error(f"[{request_id}] {error_msg}")
        logger.error(f"[{request_id}] {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_msg
        )

@router.get("/downtimes")
async def get_downtimes(
    request: Request, 
    token: str = Depends(get_current_user),
    host: str = None,
    cliente: str = None
):
    request_id = f"req-{int(time.time())}"
    logger.info(f"[{request_id}] GET /downtimes - host={host}, cliente={cliente}")
    
    config = get_checkmk_config()
    api_url = f"https://{config['host']}/{config['site']}/check_mk/api/1.0"
    
    headers = {
        'Authorization': f"Bearer {config['user']} {config['password']}",
        'Accept': 'application/json'
    }

    try:
        all_downtimes = []
        
        async with httpx.AsyncClient(headers=headers, timeout=300.0, verify=False) as session:
            
            if cliente:
                logger.info(f"[{request_id}] Filtering by cliente: {cliente}")
                
                host_map = await get_all_hosts_map(config, headers)
                if not host_map:
                    raise HTTPException(status_code=500, detail="Could not fetch host list to filter by client")
                
                hosts_in_cliente = [host_name for host_name, folder in host_map.items() if folder == cliente]
                
                if not hosts_in_cliente:
                    logger.warning(f"[{request_id}] No hosts found for cliente: {cliente}")
                    return {"downtimes": []}
                
                logger.info(f"[{request_id}] Found {len(hosts_in_cliente)} hosts for cliente. Fetching downtimes in parallel...")
                
                MAX_CONCURRENT_REQUESTS = 20
                semaphore = asyncio.Semaphore(MAX_CONCURRENT_REQUESTS)
                
                tasks = []

                async def get_with_semaphore(host_name):
                    async with semaphore:
                        query_params = {"host_name": host_name}
                        logger.debug(f"[{request_id}] Fetching downtime for {host_name}")
                        return await session.get(
                            f"{api_url}/domain-types/downtime/collections/all",
                            params=query_params
                        )

                for host_name in hosts_in_cliente:
                    tasks.append(get_with_semaphore(host_name))
                
                logger.info(f"[{request_id}] Executing {len(tasks)} GET requests (limited to {MAX_CONCURRENT_REQUESTS} at a time)...")
                start_time = time.time()
                responses = await asyncio.gather(*tasks, return_exceptions=True)
                response_time = time.time() - start_time
                logger.info(f"[{request_id}] Parallel fetch completed in {response_time:.2f}s")

                for resp in responses:
                    if isinstance(resp, httpx.Response) and resp.status_code == 200:
                        data = resp.json()
                        all_downtimes.extend(data.get('value', []))
                    elif isinstance(resp, Exception):
                        logger.error(f"[{request_id}] Parallel task failed: {type(resp).__name__} - {str(resp)}")
                
            elif host:
                logger.info(f"[{request_id}] Filtering by single host: {host}")
                query_params = {"host_name": host}
                start_time = time.time()
                resp = await session.get(
                    f"{api_url}/domain-types/downtime/collections/all",
                    params=query_params
                )
                response_time = time.time() - start_time
                logger.info(f"[{request_id}] API response received in {response_time:.2f}s with status: {resp.status_code}")
                
                resp.raise_for_status()
                data = resp.json()
                all_downtimes = data.get('value', [])
                
            else:
                logger.warning(f"[{request_id}] No filter (host or cliente) provided. Returning empty list.")
                return {"downtimes": []}
        
        logger.info(f"[{request_id}] Successfully retrieved {len(all_downtimes)} total downtimes")
        return {"downtimes": all_downtimes}
        
    except httpx.HTTPStatusError as e:
        logger.error(f"[{request_id}] API error: {e.response.status_code} - {e.response.text}")
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"Error from Checkmk API: {e.response.status_code} - {e.response.text}"
        )
    except Exception as e:
        error_msg = f"Failed to fetch downtimes: {str(e)}"
        logger.error(f"[{request_id}] {error_msg}")
        logger.error(f"[{request_id}] {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_msg
        )
        
        
@router.post("/schedule", response_model=DowntimeResponse)
async def schedule_downtime(request: Request, req: DowntimeRequest, token: str = Depends(get_current_user)):
    request_id = f"req-{int(time.time())}"
    logger.info(f"[{request_id}] POST /schedule - Request received for {len(req.hosts)} hosts")
    
    config = get_checkmk_config()
    api_url = f"https://{config['host']}/{config['site']}/check_mk/api/1.0"
    
    try:
        hosts = req.hosts 
        start_time_user = req.startTime
        end_time_user = req.endTime
        ripeti_val = req.ripeti
        commento = req.commento
        
        ripeti = 0
        if isinstance(ripeti_val, str):
            if ripeti_val == "domenica": ripeti = 30
            elif ripeti_val == "weekend": ripeti = 30
            else: ripeti = 0
        else:
            ripeti = ripeti_val

        today = datetime.today()
        l_start = []
        l_end = []
        
        logger.info(f"[{request_id}] Calculating downtime dates for {ripeti+1} days")
        
        for i in range(ripeti + 1):
            day = today + timedelta(days=i)
            current_weekday = day.weekday()
            
            start_dt_user = datetime.strptime(start_time_user, "%H:%M")
            end_dt_user = datetime.strptime(end_time_user, "%H:%M")
            
            day_start_user = datetime(day.year, day.month, day.day, start_dt_user.hour, start_dt_user.minute)
            
            if end_dt_user.time() < start_dt_user.time():
                day_end_user = datetime(day.year, day.month, day.day, end_dt_user.hour, end_dt_user.minute) + timedelta(days=1)
            else:
                day_end_user = datetime(day.year, day.month, day.day, end_dt_user.hour, end_dt_user.minute)
            
            l_start.append(f"{day_start_user.isoformat()}{calcolo_dst(day_start_user)}")
            l_end.append(f"{day_end_user.isoformat()}{calcolo_dst(day_end_user)}")

            if current_weekday == 5: # Sabato
                logger.debug(f"[{request_id}] Adding Full Weekend block for {day.date()}")
                we_start = datetime(day.year, day.month, day.day, 0, 0)
                sunday = day + timedelta(days=1)
                we_end = datetime(sunday.year, sunday.month, sunday.day, 23, 59)
                
                l_start.append(f"{we_start.isoformat()}{calcolo_dst(we_start)}")
                l_end.append(f"{we_end.isoformat()}{calcolo_dst(we_end)}")

        logger.info(f"[{request_id}] Generated {len(l_start)} downtime periods per host.")
        
        if len(l_start) == 0:
            logger.warning(f"[{request_id}] No downtime periods were generated!")
            return {"start_times": [], "end_times": [], "responses": []}
        
        all_payloads = []
        for host in hosts:
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
                all_payloads.append(payload)
        
        total_items = len(all_payloads)
        responses_list = []

        BATCH_SIZE = 4
        DELAY_BETWEEN_BATCHES = 3.0
        
        logger.info(f"[{request_id}] Starting execution: {total_items} total requests. Batch size: {BATCH_SIZE}, Delay: {DELAY_BETWEEN_BATCHES}s")
        
        headers = {
            'Authorization': f"Bearer {config['user']} {config['password']}",
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }

        # Timeout generale del client: 300 secondi (5 minuti)
        # Questo verrà usato da ogni richiesta .post()
        async with httpx.AsyncClient(headers=headers, timeout=300.0, verify=False) as session:
            for i in range(0, total_items, BATCH_SIZE):
                batch_payloads = all_payloads[i : i + BATCH_SIZE]
                batch_index_start = i + 1
                batch_index_end = i + len(batch_payloads)
                
                logger.info(f"[{request_id}] Processing batch {batch_index_start}-{batch_index_end} / {total_items}...")
                
                batch_tasks = []
                for idx, p in enumerate(batch_payloads):
                    current_global_idx = i + idx
                    batch_tasks.append(post_downtime(
                        session=session,
                        url=f"{api_url}/domain-types/downtime/collections/host",
                        payload=p,
                        request_id=request_id,
                        index=current_global_idx,
                        total=total_items
                    ))
                
                batch_results = await asyncio.gather(*batch_tasks)
                responses_list.extend(batch_results)
                
                if (i + BATCH_SIZE) < total_items:
                    logger.info(f"[{request_id}] Batch finished. Cooling down for {DELAY_BETWEEN_BATCHES}s...")
                    await asyncio.sleep(DELAY_BETWEEN_BATCHES)

        success_count = responses_list.count("Done")
        logger.info(f"[{request_id}] Schedule complete: {success_count}/{len(responses_list)} requests succeeded")
        
        return {
            "start_times": l_start,
            "end_times": l_end,
            "responses": responses_list
        }
    except Exception as e:
        error_msg = f"Failed to schedule downtime: {str(e)}"
        logger.error(f"[{request_id}] {error_msg}")
        logger.error(f"[{request_id}] {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_msg
        )

# Funzione helper per 'schedule_downtime'
async def post_downtime(session: httpx.AsyncClient, url: str, payload: dict, request_id: str, index: int, total: int) -> str:
    try:
        logger.debug(f"[{request_id}] Sending request {index+1}/{total}: {payload.get('host_name')} from {payload.get('start_time')}")
        
        # --- MODIFICA CHIAVE ---
        # Rimosso il timeout=15.0
        # Ora userà il timeout del client (300 secondi)
        resp = await session.post(url, json=payload) 
        
        resp.raise_for_status()
        logger.debug(f"[{request_id}] Request {index+1}/{total} successful")
        return "Done"
    except httpx.TimeoutException:
         # Questo scatterà solo dopo 300 secondi (5 minuti)
         error_msg = f"Timeout (300s) request {index+1}/{total} for {payload.get('host_name')}"
         logger.error(f"[{request_id}] {error_msg}")
         return "Timeout"
    except httpx.HTTPStatusError as e:
        error_msg = f"Failed request {index+1}/{total}: {e.response.status_code} - {e.response.text}"
        logger.error(f"[{request_id}] {error_msg}")
        return error_msg
    except Exception as e:
        error_msg = f"Failed request {index+1}/{total}: {str(e)}"
        logger.error(f"[{request_id}] {error_msg}")
        return error_msg


@router.post("/downtimes/delete-batch", response_model=BatchDeleteResponse)
async def delete_downtime_batch(
    request: Request,
    batch_request: BatchDeleteRequest,
    token: str = Depends(get_current_user)
):
    request_id = f"req-{int(time.time())}"
    downtimes_to_delete = batch_request.downtimes
    if not downtimes_to_delete:
        raise HTTPException(status_code=400, detail="No downtimes provided")
        
    logger.info(f"[{request_id}] POST /downtimes/delete-batch - Request to delete {len(downtimes_to_delete)} downtimes")
    
    config = get_checkmk_config()
    api_url = f"https://{config['host']}/{config['site']}/check_mk/api/1.0/domain-types/downtime/actions/delete/invoke"
    headers = {
        'Authorization': f"Bearer {config['user']} {config['password']}",
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }
    
    MAX_CONCURRENT_REQUESTS = 20
    semaphore = asyncio.Semaphore(MAX_CONCURRENT_REQUESTS)
    
    tasks = []

    async def delete_with_semaphore(session, payload, dt):
        async with semaphore:
            logger.debug(f"[{request_id}] Sending delete for {dt.downtime_id} on {dt.site_id}")
            try:
                # --- MODIFICA CHIAVE ---
                # Rimosso il timeout=15.0
                # Ora userà il timeout del client (300 secondi)
                return await session.post(api_url, json=payload)
            except Exception as e:
                logger.error(f"[{request_id}] Exception in delete_with_semaphore: {e}")
                return e

    # Timeout generale del client: 300 secondi (5 minuti)
    async with httpx.AsyncClient(headers=headers, timeout=300.0, verify=False) as session:
        for dt in downtimes_to_delete:
            payload = {
                "delete_type": "by_id",
                "downtime_id": dt.downtime_id,
                "site_id": dt.site_id
            }
            tasks.append(delete_with_semaphore(session, payload, dt))
        
        logger.info(f"[{request_id}] Sending {len(tasks)} delete requests (limited to {MAX_CONCURRENT_REQUESTS} at a time)...")
        results = await asyncio.gather(*tasks, return_exceptions=False)
    
    succeeded = 0
    failed = 0
    errors = []
    
    for i, res in enumerate(results):
        dt = downtimes_to_delete[i]
        if isinstance(res, httpx.Response) and res.status_code == 204:
            succeeded += 1
        else:
            failed += 1
            error_msg = f"Failed dt {dt.downtime_id} on site {dt.site_id}: "
            if isinstance(res, httpx.HTTPStatusError):
                error_msg += f"{res.response.status_code} - {res.response.text}"
            elif isinstance(res, httpx.TimeoutException):
                error_msg += "Timeout (300s)" # Aggiornato messaggio
            elif isinstance(res, Exception):
                error_msg += f"{type(res).__name__} - {str(res)}"
            else:
                error_msg += f"Unknown error - Status {res.status_code if hasattr(res, 'status_code') else 'N/A'}"
            logger.error(f"[{request_id}] {error_msg}")
            errors.append(error_msg)
    
    logger.info(f"[{request_id}] Batch delete complete. Succeeded: {succeeded}, Failed: {failed}")
    return {"succeeded": succeeded, "failed": failed, "errors": errors}