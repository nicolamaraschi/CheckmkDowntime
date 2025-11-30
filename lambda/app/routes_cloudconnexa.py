"""
CloudConnexa Dashboard API Routes
Endpoint per dashboard, sicurezza, clienti e filtri
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from .athena import run_athena_query
from . import cloudconnexa_queries as ccq

router = APIRouter()


class DashboardFilters(BaseModel):
    startDate: str
    endDate: str
    users: Optional[List[str]] = []
    gateways: Optional[List[str]] = []


@router.post("/cloudconnexa/dashboard")
async def get_dashboard_data(filters: DashboardFilters):
    """
    Endpoint principale per la dashboard CloudConnexa.
    Ritorna tutte le statistiche necessarie per visualizzare la dashboard.
    """
    try:
        filters_dict = filters.dict()
        
        # Esegue tutte le query in parallelo (o sequenzialmente per semplicità)
        results = {}
        
        # Statistiche base
        results['sessionStats'] = run_athena_query(
            ccq.get_session_stats_query(filters_dict)
        )
        
        results['blockedDomains'] = run_athena_query(
            ccq.get_blocked_domains_query(filters_dict)
        )
        
        # Timeline
        results['sessionsTimeline'] = run_athena_query(
            ccq.get_sessions_timeline_query(filters_dict)
        )
        
        results['securityTimeline'] = run_athena_query(
            ccq.get_security_events_timeline_query(filters_dict)
        )
        
        # Top lists
        results['topUsers'] = run_athena_query(
            ccq.get_top_users_by_traffic_query(filters_dict)
        )
        
        results['topDestinations'] = run_athena_query(
            ccq.get_top_destinations_query(filters_dict)
        )
        
        # Distribuzioni
        results['gatewayDistribution'] = run_athena_query(
            ccq.get_gateway_distribution_query(filters_dict)
        )
        
        results['protocolDistribution'] = run_athena_query(
            ccq.get_protocol_distribution_query(filters_dict)
        )
        
        results['blockedByCategory'] = run_athena_query(
            ccq.get_blocked_domains_by_category_query(filters_dict)
        )
        
        results['disconnectReasons'] = run_athena_query(
            ccq.get_disconnect_reasons_query(filters_dict)
        )
        
        return results
        
    except Exception as e:
        print(f"Errore dashboard: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/cloudconnexa/filters")
async def get_filter_options():
    """
    Ritorna le opzioni disponibili per i filtri (utenti e gateway).
    """
    try:
        users = run_athena_query(ccq.get_available_users_query())
        gateways = run_athena_query(ccq.get_available_gateways_query())
        
        return {
            'users': [u['parententityname'] for u in users if u.get('parententityname')],
            'gateways': [g['gateway'] for g in gateways if g.get('gateway')]
        }
        
    except Exception as e:
        print(f"Errore filtri: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/cloudconnexa/security")
async def get_security_data(filters: DashboardFilters):
    """
    Endpoint per dati di sicurezza avanzati.
    Ritorna analisi su minacce, porte non standard, traffico asimmetrico.
    """
    try:
        filters_dict = filters.dict()
        
        results = {}
        
        # Security queries
        results['blockedAccess'] = run_athena_query(
            ccq.get_blocked_access_attempts_query(filters_dict)
        )
        
        results['nonStandardPorts'] = run_athena_query(
            ccq.get_non_standard_ports_query(filters_dict)
        )
        
        results['asymmetricTraffic'] = run_athena_query(
            ccq.get_asymmetric_traffic_query(filters_dict)
        )
        
        results['securityTimeline'] = run_athena_query(
            ccq.get_security_events_timeline_query(filters_dict)
        )
        
        results['blockedByCategory'] = run_athena_query(
            ccq.get_blocked_domains_by_category_query(filters_dict)
        )
        
        return results
        
    except Exception as e:
        print(f"Errore security: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/cloudconnexa/customers")
async def get_customers_data():
    """
    Endpoint per connessioni attive per cliente (ultime 24 ore).
    """
    try:
        results = run_athena_query(
            ccq.get_active_connections_by_customer_query()
        )
        
        return {
            'customers': results,
            'timestamp': datetime.now().isoformat()
        }
        
    except Exception as e:
        print(f"Errore customers: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/cloudconnexa/timeline")
async def get_timeline_data(filters: DashboardFilters):
    """
    Endpoint dedicato per dati timeline (sessioni e sicurezza).
    """
    try:
        filters_dict = filters.dict()
        
        return {
            'sessions': run_athena_query(
                ccq.get_sessions_timeline_query(filters_dict)
            ),
            'security': run_athena_query(
                ccq.get_security_events_timeline_query(filters_dict)
            )
        }
        
    except Exception as e:
        print(f"Errore timeline: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/cloudconnexa/users/{username}")
async def get_user_details(username: str, filters: DashboardFilters):
    """
    Endpoint per dettagli specifici di un utente.
    """
    try:
        # Aggiungi l'utente ai filtri
        filters_dict = filters.dict()
        filters_dict['users'] = [username]
        
        return {
            'sessionStats': run_athena_query(
                ccq.get_session_stats_query(filters_dict)
            ),
            'topDestinations': run_athena_query(
                ccq.get_top_destinations_query(filters_dict)
            ),
            'timeline': run_athena_query(
                ccq.get_sessions_timeline_query(filters_dict)
            )
        }
        
    except Exception as e:
        print(f"Errore user details: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
