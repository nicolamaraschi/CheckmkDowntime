"""
SAP System Control - API Routes
FastAPI router per endpoint SAP dashboard
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
from dotenv import load_dotenv

from . import sap_queries
from .athena import run_athena_query

load_dotenv()

router = APIRouter()

# Configurazione SAP Athena
SAP_ATHENA_DB = os.getenv('SAP_ATHENA_DB', 'sap_reports_db')
SAP_ATHENA_WORKGROUP = os.getenv('SAP_ATHENA_WORKGROUP', 'ReportCheckSistemiSap')


class DashboardFilters(BaseModel):
    """Modello per i filtri dashboard"""
    startDate: str
    endDate: str
    clients: List[str] = []
    sids: List[str] = []


class TimelineFilters(BaseModel):
    """Modello per i filtri timeline"""
    startDate: str
    endDate: str
    clients: List[str] = []
    sids: List[str] = []


class SIDsRequest(BaseModel):
    """Modello per richiesta SID"""
    clients: List[str] = []


@router.post("/sap/dashboard")
async def get_sap_dashboard(filters: DashboardFilters):
    """
    Endpoint principale dashboard SAP
    Ritorna KPI, grafici e tabelle aggregate
    """
    try:
        filters_dict = filters.dict()
        
        # Esegui query in parallelo (concettualmente - Athena le eseguirà sequenzialmente)
        total_dumps_query = sap_queries.get_total_dumps_query(filters_dict)
        failed_backups_query = sap_queries.get_failed_backups_query(filters_dict)
        cancelled_jobs_query = sap_queries.get_cancelled_jobs_query(filters_dict)
        dump_types_query = sap_queries.get_dump_types_query(filters_dict)
        issues_by_client_query = sap_queries.get_issues_by_client_query(filters_dict)
        problems_timeline_query = sap_queries.get_problems_timeline_query(filters_dict)
        
        # Esegui query
        total_dumps_results = run_athena_query(total_dumps_query, SAP_ATHENA_DB, SAP_ATHENA_WORKGROUP)
        failed_backups_results = run_athena_query(failed_backups_query, SAP_ATHENA_DB, SAP_ATHENA_WORKGROUP)
        cancelled_jobs_results = run_athena_query(cancelled_jobs_query, SAP_ATHENA_DB, SAP_ATHENA_WORKGROUP)
        dump_types_results = run_athena_query(dump_types_query, SAP_ATHENA_DB, SAP_ATHENA_WORKGROUP)
        issues_by_client_results = run_athena_query(issues_by_client_query, SAP_ATHENA_DB, SAP_ATHENA_WORKGROUP)
        problems_timeline_results = run_athena_query(problems_timeline_query, SAP_ATHENA_DB, SAP_ATHENA_WORKGROUP)
        
        # Calcola KPI
        total_dumps = sum(int(row.get('total_dumps', 0)) for row in total_dumps_results)
        total_failed_backups = sum(int(row.get('failed_backups', 0)) for row in failed_backups_results)
        total_cancelled_jobs = sum(int(row.get('cancelled_jobs', 0)) for row in cancelled_jobs_results)
        
        # Prepara dati per grafici
        # Dump types per Pie Chart
        dump_types_chart = {
            'labels': [row.get('dump_type', 'Unknown') for row in dump_types_results[:10]],  # Top 10
            'data': [int(row.get('count', 0)) for row in dump_types_results[:10]]
        }
        
        # Issues by client per Bar Chart
        client_issues_chart = {
            'labels': [f"{row.get('nomecliente', 'Unknown')} - {row.get('sid', 'N/A')}" for row in issues_by_client_results],
            'dumps': [int(row.get('dumps', 0)) for row in issues_by_client_results],
            'failed_backups': [int(row.get('failed_backups', 0)) for row in issues_by_client_results],
            'cancelled_jobs': [int(row.get('cancelled_jobs', 0)) for row in issues_by_client_results]
        }
        
        # Timeline per Line Chart
        timeline_chart = {
            'dates': [row.get('datacontrollo', '') for row in problems_timeline_results],
            'dumps': [int(row.get('dumps', 0)) for row in problems_timeline_results],
            'failed_backups': [int(row.get('failed_backups', 0)) for row in problems_timeline_results],
            'cancelled_jobs': [int(row.get('cancelled_jobs', 0)) for row in problems_timeline_results]
        }
        
        return {
            'kpis': {
                'totalDumps': total_dumps,
                'failedBackups': total_failed_backups,
                'cancelledJobs': total_cancelled_jobs
            },
            'dumpTypes': dump_types_chart,
            'clientIssues': client_issues_chart,
            'timeline': timeline_chart,
            'issuesTable': issues_by_client_results
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore recupero dati dashboard: {str(e)}")


@router.get("/sap/filters")
async def get_sap_filters():
    """
    Ritorna le opzioni disponibili per i filtri (clienti e SID)
    """
    try:
        clients_query = sap_queries.get_available_clients_query()
        sids_query = sap_queries.get_available_sids_query()
        
        clients_results = run_athena_query(clients_query, SAP_ATHENA_DB, SAP_ATHENA_WORKGROUP)
        sids_results = run_athena_query(sids_query, SAP_ATHENA_DB, SAP_ATHENA_WORKGROUP)
        
        clients = [row.get('nomecliente', '') for row in clients_results if row.get('nomecliente')]
        sids = [row.get('sid', '') for row in sids_results if row.get('sid')]
        
        return {
            'clients': sorted(clients),
            'sids': sorted(sids)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore recupero filtri: {str(e)}")


@router.post("/sap/timeline")
async def get_sap_timeline(filters: TimelineFilters):
    """
    Ritorna dati timeline per grafici temporali
    """
    try:
        filters_dict = filters.dict()
        
        problems_query = sap_queries.get_problems_timeline_query(filters_dict)
        services_query = sap_queries.get_services_timeline_query(filters_dict)
        
        problems_results = run_athena_query(problems_query, SAP_ATHENA_DB, SAP_ATHENA_WORKGROUP)
        services_results = run_athena_query(services_query, SAP_ATHENA_DB, SAP_ATHENA_WORKGROUP)
        
        return {
            'problems': problems_results,
            'services': services_results
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore recupero timeline: {str(e)}")


@router.get("/sap/clients")
async def get_sap_clients():
    """
    Ritorna lista clienti disponibili
    """
    try:
        query = sap_queries.get_available_clients_query()
        results = run_athena_query(query, SAP_ATHENA_DB, SAP_ATHENA_WORKGROUP)
        
        clients = [row.get('nomecliente', '') for row in results if row.get('nomecliente')]
        
        return {
            'clients': sorted(clients)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore recupero clienti: {str(e)}")


@router.post("/sap/sids")
async def get_sap_sids(request: SIDsRequest):
    """
    Ritorna lista SID disponibili (opzionalmente filtrati per cliente)
    """
    try:
        query = sap_queries.get_available_sids_query(request.clients if request.clients else None)
        results = run_athena_query(query, SAP_ATHENA_DB, SAP_ATHENA_WORKGROUP)
        
        # Raggruppa SID per cliente
        sids_by_client = {}
        for row in results:
            client = row.get('nomecliente', 'Unknown')
            sid = row.get('sid', '')
            if sid:
                if client not in sids_by_client:
                    sids_by_client[client] = []
                sids_by_client[client].append(sid)
        
        # Se filtrato per clienti, ritorna solo quelli
        if request.clients:
            filtered_sids = []
            for client in request.clients:
                filtered_sids.extend(sids_by_client.get(client, []))
            return {
                'sids': sorted(list(set(filtered_sids)))
            }
        
        # Altrimenti ritorna tutti i SID
        all_sids = [sid for sids in sids_by_client.values() for sid in sids]
        return {
            'sids': sorted(list(set(all_sids))),
            'sidsByClient': sids_by_client
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore recupero SID: {str(e)}")
