"""
CloudConnexa Dashboard Queries
Tutte le query per la dashboard CloudConnexa, convertite da JavaScript a Python
"""

from typing import Dict, List, Optional
from datetime import datetime, timedelta


def sanitize(value) -> str:
    """Sanitizza i valori per prevenire SQL injection"""
    if isinstance(value, str):
        return value.replace("'", "''")
    if isinstance(value, (int, float, bool)):
        return str(value)
    return ''


def build_base_where(filters: Dict) -> str:
    """Costruisce la clausola WHERE base per i filtri comuni"""
    conditions = []
    
    if filters.get('startDate') and filters.get('endDate'):
        start = sanitize(filters['startDate'])
        end = sanitize(filters['endDate'])
        conditions.append(f"timestamp BETWEEN '{start}' AND '{end}'")
    
    if filters.get('users') and len(filters['users']) > 0:
        user_list = ', '.join([f"'{sanitize(u)}'" for u in filters['users']])
        conditions.append(f"parententityname IN ({user_list})")
    
    if filters.get('gateways') and len(filters['gateways']) > 0:
        gw_list = ', '.join([f"'{sanitize(g)}'" for g in filters['gateways']])
        conditions.append(f"json_extract_scalar(log, '$.sourcegatewayregionname') IN ({gw_list})")
    
    return f"WHERE {' AND '.join(conditions)}" if conditions else ''


# ====================================================================
# QUERY STATISTICHE BASE
# ====================================================================

def get_session_stats_query(filters: Dict) -> str:
    """Query 1: Statistiche Sessioni - USA client-disconnected per avere i dati reali"""
    where_clause = build_base_where(filters)
    
    return f"""
        SELECT 
            COUNT(*) as total_sessions,
            COUNT(DISTINCT parententityname) as unique_users,
            ROUND(AVG(CAST(json_extract_scalar(log, '$.sessionDurationSeconds') AS DOUBLE)), 2) as avg_duration_seconds,
            ROUND(SUM(CAST(json_extract_scalar(log, '$.sessionBytesIn') AS BIGINT)) / 1073741824.0, 2) as total_bytes_in_gb,
            ROUND(SUM(CAST(json_extract_scalar(log, '$.sessionBytesOut') AS BIGINT)) / 1073741824.0, 2) as total_bytes_out_gb
        FROM "cloudconnexa_logs_db"."extracted_logs_v2"
        {where_clause}
            {'AND' if where_clause else 'WHERE'} eventname = 'client-disconnected'
    """


def get_blocked_domains_query(filters: Dict) -> str:
    """Query 2: Domini Bloccati (Minacce)"""
    where_clause = build_base_where(filters)
    
    return f"""
        SELECT 
            COUNT(*) as total_blocked,
            COUNT(DISTINCT json_extract_scalar(log, '$.domain')) as unique_domains,
            COUNT(DISTINCT parententityname) as affected_users
        FROM "cloudconnexa_logs_db"."extracted_logs_v2"
        {where_clause}
            {'AND' if where_clause else 'WHERE'} eventname = 'domain-blocked'
    """


def get_sessions_timeline_query(filters: Dict) -> str:
    """Query 3: Timeline Sessioni - USA client-disconnected per avere dati completi"""
    where_clause = build_base_where(filters)
    
    return f"""
        SELECT 
            DATE(from_iso8601_timestamp(timestamp)) as date,
            COUNT(*) as session_count,
            COUNT(DISTINCT parententityname) as unique_users,
            ROUND(SUM(CAST(json_extract_scalar(log, '$.sessionBytesIn') AS BIGINT)) / 1073741824.0, 2) as bytes_in_gb,
            ROUND(SUM(CAST(json_extract_scalar(log, '$.sessionBytesOut') AS BIGINT)) / 1073741824.0, 2) as bytes_out_gb
        FROM "cloudconnexa_logs_db"."extracted_logs_v2"
        {where_clause}
            {'AND' if where_clause else 'WHERE'} eventname = 'client-disconnected'
        GROUP BY DATE(from_iso8601_timestamp(timestamp))
        ORDER BY date ASC
    """


def get_top_users_by_traffic_query(filters: Dict) -> str:
    """Query 4: Top Utenti per Traffico - USA client-disconnected"""
    where_clause = build_base_where(filters)
    
    return f"""
        SELECT 
            parententityname as username,
            COUNT(*) as session_count,
            ROUND(SUM(CAST(json_extract_scalar(log, '$.sessionBytesIn') AS BIGINT)) / 1073741824.0, 2) as total_in_gb,
            ROUND(SUM(CAST(json_extract_scalar(log, '$.sessionBytesOut') AS BIGINT)) / 1073741824.0, 2) as total_out_gb,
            ROUND((SUM(CAST(json_extract_scalar(log, '$.sessionBytesIn') AS BIGINT)) + 
                   SUM(CAST(json_extract_scalar(log, '$.sessionBytesOut') AS BIGINT))) / 1073741824.0, 2) as total_traffic_gb
        FROM "cloudconnexa_logs_db"."extracted_logs_v2"
        {where_clause}
            {'AND' if where_clause else 'WHERE'} eventname = 'client-disconnected'
            AND parententityname IS NOT NULL
        GROUP BY parententityname
        ORDER BY total_traffic_gb DESC
        LIMIT 10
    """


def get_blocked_domains_by_category_query(filters: Dict) -> str:
    """Query 5: Domini Bloccati per Categoria"""
    where_clause = build_base_where(filters)
    
    return f"""
        SELECT 
            json_extract_scalar(log, '$.category') as category,
            COUNT(*) as count,
            COUNT(DISTINCT json_extract_scalar(log, '$.domain')) as unique_domains
        FROM "cloudconnexa_logs_db"."extracted_logs_v2"
        {where_clause}
            {'AND' if where_clause else 'WHERE'} eventname = 'domain-blocked'
            AND json_extract_scalar(log, '$.category') IS NOT NULL
        GROUP BY json_extract_scalar(log, '$.category')
        ORDER BY count DESC
    """


def get_gateway_distribution_query(filters: Dict) -> str:
    """Query 6: Distribuzione Gateway - USA client-disconnected"""
    where_clause = build_base_where(filters)
    
    return f"""
        SELECT 
            json_extract_scalar(log, '$.gatewayRegionName') as gateway_region,
            COUNT(*) as session_count,
            COUNT(DISTINCT parententityname) as unique_users
        FROM "cloudconnexa_logs_db"."extracted_logs_v2"
        {where_clause}
            {'AND' if where_clause else 'WHERE'} eventname = 'client-disconnected'
            AND json_extract_scalar(log, '$.gatewayRegionName') IS NOT NULL
        GROUP BY json_extract_scalar(log, '$.gatewayRegionName')
        ORDER BY session_count DESC
    """


def get_disconnect_reasons_query(filters: Dict) -> str:
    """Query 7: Motivi di Disconnessione - USA sessionDisconnectReasonDescription"""
    where_clause = build_base_where(filters)
    
    return f"""
        SELECT 
            json_extract_scalar(log, '$.sessionDisconnectReasonDescription') as reason,
            COUNT(*) as count
        FROM "cloudconnexa_logs_db"."extracted_logs_v2"
        {where_clause}
            {'AND' if where_clause else 'WHERE'} eventname = 'client-disconnected'
            AND json_extract_scalar(log, '$.sessionDisconnectReasonDescription') IS NOT NULL
        GROUP BY json_extract_scalar(log, '$.sessionDisconnectReasonDescription')
        ORDER BY count DESC
        LIMIT 10
    """


def get_protocol_distribution_query(filters: Dict) -> str:
    """Query 8: Protocolli Utilizzati - USA protocolname da flow-established"""
    where_clause = build_base_where(filters)
    
    return f"""
        SELECT 
            UPPER(json_extract_scalar(log, '$.protocolname')) as protocol,
            COUNT(*) as count
        FROM "cloudconnexa_logs_db"."extracted_logs_v2"
        {where_clause}
            {'AND' if where_clause else 'WHERE'} eventname = 'flow-established'
            AND json_extract_scalar(log, '$.protocolname') IS NOT NULL
            AND json_extract_scalar(log, '$.protocolname') != ''
        GROUP BY json_extract_scalar(log, '$.protocolname')
        ORDER BY count DESC
    """


def get_security_events_timeline_query(filters: Dict) -> str:
    """Query 9: Timeline Eventi di Sicurezza"""
    where_clause = build_base_where(filters)
    
    return f"""
        SELECT 
            DATE(from_iso8601_timestamp(timestamp)) as date,
            COUNT(*) as blocked_count,
            COUNT(DISTINCT json_extract_scalar(log, '$.domain')) as unique_domains,
            COUNT(DISTINCT parententityname) as affected_users
        FROM "cloudconnexa_logs_db"."extracted_logs_v2"
        {where_clause}
            {'AND' if where_clause else 'WHERE'} eventname = 'domain-blocked'
        GROUP BY DATE(from_iso8601_timestamp(timestamp))
        ORDER BY date ASC
    """


def get_top_destinations_query(filters: Dict) -> str:
    """Query 13: Flussi Stabiliti per Destinazione - USA initiator per gli utenti"""
    where_clause = build_base_where(filters)
    
    return f"""
        SELECT 
            json_extract_scalar(log, '$.destinationentityip') as destination_ip,
            CAST(json_extract_scalar(log, '$.destinationport') AS VARCHAR) as destination_port,
            UPPER(json_extract_scalar(log, '$.protocolname')) as protocol,
            COUNT(*) as connection_count,
            COUNT(DISTINCT json_extract_scalar(log, '$.initiator')) as unique_users
        FROM "cloudconnexa_logs_db"."extracted_logs_v2"
        {where_clause}
            {'AND' if where_clause else 'WHERE'} eventname = 'flow-established'
            AND json_extract_scalar(log, '$.destinationentityip') IS NOT NULL
        GROUP BY 
            json_extract_scalar(log, '$.destinationentityip'),
            json_extract_scalar(log, '$.destinationport'),
            json_extract_scalar(log, '$.protocolname')
        ORDER BY connection_count DESC
        LIMIT 15
    """


# ====================================================================
# SECURITY QUERIES - Query avanzate per cybersecurity
# ====================================================================

def get_blocked_access_attempts_query(filters: Dict) -> str:
    """Query 14: Tentativi di Accesso Bloccati (Security)"""
    where_clause = build_base_where(filters)
    
    return f"""
        SELECT 
            json_extract_scalar(log, '$.destinationentityip') as blocked_destination,
            CAST(json_extract_scalar(log, '$.destinationport') AS VARCHAR) as destination_port,
            COUNT(*) as blocked_attempts,
            COUNT(DISTINCT json_extract_scalar(log, '$.initiator')) as affected_users
        FROM "cloudconnexa_logs_db"."extracted_logs_v2"
        {where_clause}
            {'AND' if where_clause else 'WHERE'} eventname = 'flow-established'
            AND CAST(json_extract_scalar(log, '$.allowed') AS BOOLEAN) = false
        GROUP BY 
            json_extract_scalar(log, '$.destinationentityip'),
            json_extract_scalar(log, '$.destinationport')
        ORDER BY blocked_attempts DESC
        LIMIT 15
    """


def get_non_standard_ports_query(filters: Dict) -> str:
    """Query 15: Porte Non Standard (Security)"""
    where_clause = build_base_where(filters)
    
    return f"""
        SELECT 
            CAST(json_extract_scalar(log, '$.destinationport') AS VARCHAR) as port,
            UPPER(json_extract_scalar(log, '$.protocolname')) as protocol,
            COUNT(*) as connection_count,
            COUNT(DISTINCT json_extract_scalar(log, '$.initiator')) as unique_users,
            COUNT(DISTINCT json_extract_scalar(log, '$.destinationentityip')) as unique_destinations
        FROM "cloudconnexa_logs_db"."extracted_logs_v2"
        {where_clause}
            {'AND' if where_clause else 'WHERE'} eventname = 'flow-established'
            AND CAST(json_extract_scalar(log, '$.destinationport') AS INTEGER) NOT IN (80, 443, 22, 3389, 445, 3306, 1433, 5432)
        GROUP BY 
            json_extract_scalar(log, '$.destinationport'),
            json_extract_scalar(log, '$.protocolname')
        ORDER BY connection_count DESC
        LIMIT 20
    """


def get_asymmetric_traffic_query(filters: Dict) -> str:
    """Query 16: Traffico Asimmetrico (Potential Data Exfiltration)"""
    where_clause = build_base_where(filters)
    
    return f"""
        SELECT 
            parententityname as username,
            COUNT(*) as sessions,
            ROUND(SUM(CAST(json_extract_scalar(log, '$.sessionBytesIn') AS BIGINT)) / 1073741824.0, 2) as download_gb,
            ROUND(SUM(CAST(json_extract_scalar(log, '$.sessionBytesOut') AS BIGINT)) / 1073741824.0, 2) as upload_gb,
            ROUND(
                SUM(CAST(json_extract_scalar(log, '$.sessionBytesOut') AS BIGINT)) / 
                NULLIF(SUM(CAST(json_extract_scalar(log, '$.sessionBytesIn') AS BIGINT)), 0), 
                2
            ) as upload_download_ratio
        FROM "cloudconnexa_logs_db"."extracted_logs_v2"
        {where_clause}
            {'AND' if where_clause else 'WHERE'} eventname = 'client-disconnected'
            AND CAST(json_extract_scalar(log, '$.sessionBytesIn') AS BIGINT) > 0
        GROUP BY parententityname
        HAVING SUM(CAST(json_extract_scalar(log, '$.sessionBytesOut') AS BIGINT)) > 
               SUM(CAST(json_extract_scalar(log, '$.sessionBytesIn') AS BIGINT))
        ORDER BY upload_download_ratio DESC
        LIMIT 15
    """


def get_active_connections_by_customer_query(filters: Dict = None) -> str:
    """Query 17: Connessioni Attive per Cliente (ultime 24 ore)"""
    # Per questa query usiamo sempre le ultime 24 ore, ignorando i filtri di data
    return """
        SELECT 
            COALESCE(NULLIF(json_extract_scalar(log, '$.destinationparentname'), ''), 'Cliente Sconosciuto') as customer,
            COUNT(DISTINCT json_extract_scalar(log, '$.sourceparentid')) as active_connections,
            MAX(timestamp) as last_update
        FROM "cloudconnexa_logs_db"."extracted_logs_v2"
        WHERE eventname = 'flow-established'
            AND timestamp >= date_format(date_add('hour', -24, current_timestamp), '%Y-%m-%d %H:%i:%s')
        GROUP BY COALESCE(NULLIF(json_extract_scalar(log, '$.destinationparentname'), ''), 'Cliente Sconosciuto')
        ORDER BY active_connections DESC
        LIMIT 20
    """


# ====================================================================
# UTILITY QUERIES
# ====================================================================

def get_available_users_query() -> str:
    """Query 10: Lista Utenti Disponibili"""
    return """
        SELECT DISTINCT parententityname
        FROM "cloudconnexa_logs_db"."extracted_logs_v2"
        WHERE parententityname IS NOT NULL
            AND eventname IN ('client-disconnected', 'domain-blocked')
        ORDER BY parententityname
        LIMIT 1000
    """


def get_available_gateways_query() -> str:
    """Query 11: Lista Gateway Disponibili - USA gatewayRegionName da client-disconnected"""
    return """
        SELECT DISTINCT json_extract_scalar(log, '$.gatewayRegionName') as gateway
        FROM "cloudconnexa_logs_db"."extracted_logs_v2"
        WHERE json_extract_scalar(log, '$.gatewayRegionName') IS NOT NULL
            AND eventname = 'client-disconnected'
        ORDER BY gateway
    """
