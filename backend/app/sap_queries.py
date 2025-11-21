"""
SAP System Control - Athena Query Builder
Converte query JavaScript in Python per monitoraggio sistemi SAP
"""

from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any


def sanitize(value: Any) -> str:
    """Sanitizza i valori per prevenire SQL injection"""
    if isinstance(value, str):
        return value.replace("'", "''")
    if isinstance(value, (int, float, bool)):
        return str(value)
    return ''


def build_base_where(filters: Dict[str, Any]) -> str:
    """Costruisce la clausola WHERE base per i filtri comuni"""
    conditions = []
    
    if filters.get('startDate') and filters.get('endDate'):
        start = sanitize(filters['startDate'])
        end = sanitize(filters['endDate'])
        conditions.append(f"datacontrollo BETWEEN '{start}' AND '{end}'")
    
    if filters.get('clients') and len(filters['clients']) > 0:
        client_list = ','.join([f"'{sanitize(c)}'" for c in filters['clients']])
        conditions.append(f"nomecliente IN ({client_list})")
    
    if filters.get('sids') and len(filters['sids']) > 0:
        sid_list = ','.join([f"'{sanitize(s)}'" for s in filters['sids']])
        conditions.append(f"sid IN ({sid_list})")
    elif 'sids' in filters and len(filters.get('sids', [])) == 0 and filters.get('clients') and len(filters['clients']) > 0:
        # Se clienti selezionati ma nessun SID, non restituire risultati
        conditions.append("sid = 'NESSUN_SID_SELEZIONATO'")
    
    return f"WHERE {' AND '.join(conditions)}" if conditions else ''


def get_total_dumps_query(filters: Dict[str, Any]) -> str:
    """Query 1: Conteggio totale dump ABAP"""
    conditions = []
    
    if filters.get('startDate') and filters.get('endDate'):
        conditions.append(f"datacontrollo BETWEEN '{sanitize(filters['startDate'])}' AND '{sanitize(filters['endDate'])}'")
    if filters.get('clients') and len(filters['clients']) > 0:
        client_list = ','.join([f"'{sanitize(c)}'" for c in filters['clients']])
        conditions.append(f"nomecliente IN ({client_list})")
    if filters.get('sids') and len(filters['sids']) > 0:
        sid_list = ','.join([f"'{sanitize(s)}'" for s in filters['sids']])
        conditions.append(f"sid IN ({sid_list})")
    elif 'sids' in filters and len(filters.get('sids', [])) == 0 and filters.get('clients') and len(filters['clients']) > 0:
        conditions.append("sid = 'NESSUN_SID_SELEZIONATO'")
    
    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ''
    
    return f"""
        SELECT 
            nomecliente,
            datacontrollo,
            COUNT(*) as total_dumps
        FROM "sap_reports_db"."reportparquet"
        CROSS JOIN UNNEST(abap_short_dumps) AS t(dump)
        {where_clause}
        GROUP BY nomecliente, datacontrollo
    """


def get_failed_backups_query(filters: Dict[str, Any]) -> str:
    """Query 2: Backup falliti"""
    conditions = []
    
    if filters.get('startDate') and filters.get('endDate'):
        conditions.append(f"datacontrollo BETWEEN '{sanitize(filters['startDate'])}' AND '{sanitize(filters['endDate'])}'")
    if filters.get('clients') and len(filters['clients']) > 0:
        client_list = ','.join([f"'{sanitize(c)}'" for c in filters['clients']])
        conditions.append(f"nomecliente IN ({client_list})")
    if filters.get('sids') and len(filters['sids']) > 0:
        sid_list = ','.join([f"'{sanitize(s)}'" for s in filters['sids']])
        conditions.append(f"sid IN ({sid_list})")
    elif 'sids' in filters and len(filters.get('sids', [])) == 0 and filters.get('clients') and len(filters['clients']) > 0:
        conditions.append("sid = 'NESSUN_SID_SELEZIONATO'")
    
    conditions.append("(backup.STATUS LIKE '%failed%' OR backup.STATUS LIKE '%FAILED%')")
    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ''
    
    return f"""
        SELECT 
            nomecliente,
            COUNT(*) as failed_backups,
            datacontrollo
        FROM "sap_reports_db"."reportparquet"
        CROSS JOIN UNNEST(situazione_backup) AS t(backup)
        {where_clause}
        GROUP BY nomecliente, datacontrollo
    """


def get_cancelled_jobs_query(filters: Dict[str, Any]) -> str:
    """Query 3: Job cancellati"""
    conditions = []
    
    if filters.get('startDate') and filters.get('endDate'):
        conditions.append(f"datacontrollo BETWEEN '{sanitize(filters['startDate'])}' AND '{sanitize(filters['endDate'])}'")
    if filters.get('clients') and len(filters['clients']) > 0:
        client_list = ','.join([f"'{sanitize(c)}'" for c in filters['clients']])
        conditions.append(f"nomecliente IN ({client_list})")
    if filters.get('sids') and len(filters['sids']) > 0:
        sid_list = ','.join([f"'{sanitize(s)}'" for s in filters['sids']])
        conditions.append(f"sid IN ({sid_list})")
    elif 'sids' in filters and len(filters.get('sids', [])) == 0 and filters.get('clients') and len(filters['clients']) > 0:
        conditions.append("sid = 'NESSUN_SID_SELEZIONATO'")
    
    conditions.append("job.STATUS = 'CANCELLED'")
    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ''
    
    return f"""
        SELECT 
            nomecliente,
            COUNT(*) as cancelled_jobs,
            datacontrollo
        FROM "sap_reports_db"."reportparquet"
        CROSS JOIN UNNEST(abap_batch_jobs) AS t(job)
        {where_clause}
        GROUP BY nomecliente, datacontrollo
    """


def get_services_ko_query(filters: Dict[str, Any]) -> str:
    """Query 4: Servizi in errore (KO)"""
    where_clause = build_base_where(filters)
    
    return f"""
        SELECT 
            nomecliente,
            datacontrollo,
            stato_servizi.Dump as dump_status,
            stato_servizi.job_in_errore as job_error_status,
            stato_servizi.processi_attivi as active_processes_status,
            stato_servizi.spazio_database as db_space_status,
            stato_servizi.spazio_log as log_space_status
        FROM "sap_reports_db"."reportparquet"
        {where_clause}
    """


def get_dump_types_query(filters: Dict[str, Any]) -> str:
    """Query 5: Distribuzione tipi di dump"""
    conditions = []
    
    if filters.get('startDate') and filters.get('endDate'):
        conditions.append(f"datacontrollo BETWEEN '{sanitize(filters['startDate'])}' AND '{sanitize(filters['endDate'])}'")
    if filters.get('clients') and len(filters['clients']) > 0:
        client_list = ','.join([f"'{sanitize(c)}'" for c in filters['clients']])
        conditions.append(f"nomecliente IN ({client_list})")
    if filters.get('sids') and len(filters['sids']) > 0:
        sid_list = ','.join([f"'{sanitize(s)}'" for s in filters['sids']])
        conditions.append(f"sid IN ({sid_list})")
    elif 'sids' in filters and len(filters.get('sids', [])) == 0 and filters.get('clients') and len(filters['clients']) > 0:
        conditions.append("sid = 'NESSUN_SID_SELEZIONATO'")
    
    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ''
    
    return f"""
        SELECT 
            dump.SHORT_DUMP_TYPE as dump_type,
            COUNT(*) as count,
            nomecliente
        FROM "sap_reports_db"."reportparquet"
        CROSS JOIN UNNEST(abap_short_dumps) AS t(dump)
        {where_clause}
        GROUP BY dump.SHORT_DUMP_TYPE, nomecliente
        ORDER BY count DESC
    """


def get_issues_by_client_query(filters: Dict[str, Any]) -> str:
    """Query 6: Problemi aggregati per cliente e SID"""
    conditions = []
    
    if filters.get('startDate') and filters.get('endDate'):
        conditions.append(f"datacontrollo BETWEEN '{sanitize(filters['startDate'])}' AND '{sanitize(filters['endDate'])}'")
    if filters.get('clients') and len(filters['clients']) > 0:
        client_list = ','.join([f"'{sanitize(c)}'" for c in filters['clients']])
        conditions.append(f"nomecliente IN ({client_list})")
    if filters.get('sids') and len(filters['sids']) > 0:
        sid_list = ','.join([f"'{sanitize(s)}'" for s in filters['sids']])
        conditions.append(f"sid IN ({sid_list})")
    elif 'sids' in filters and len(filters.get('sids', [])) == 0 and filters.get('clients') and len(filters['clients']) > 0:
        conditions.append("sid = 'NESSUN_SID_SELEZIONATO'")
    
    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ''
    
    backup_conditions = conditions + ["(backup.STATUS LIKE '%failed%' OR backup.STATUS LIKE '%FAILED%')"]
    backup_where_clause = f"WHERE {' AND '.join(backup_conditions)}" if backup_conditions else ''
    
    job_conditions = conditions + ["job.STATUS = 'CANCELLED'"]
    job_where_clause = f"WHERE {' AND '.join(job_conditions)}" if job_conditions else ''
    
    return f"""
        WITH dumps AS (
            SELECT nomecliente, sid, COUNT(*) as dump_count
            FROM "sap_reports_db"."reportparquet"
            CROSS JOIN UNNEST(abap_short_dumps) AS t(dump)
            {where_clause}
            GROUP BY nomecliente, sid
        ),
        failed_backups AS (
            SELECT nomecliente, sid, COUNT(*) as backup_count
            FROM "sap_reports_db"."reportparquet"
            CROSS JOIN UNNEST(situazione_backup) AS t(backup)
            {backup_where_clause}
            GROUP BY nomecliente, sid
        ),
        cancelled_jobs AS (
            SELECT nomecliente, sid, COUNT(*) as job_count
            FROM "sap_reports_db"."reportparquet"
            CROSS JOIN UNNEST(abap_batch_jobs) AS t(job)
            {job_where_clause}
            GROUP BY nomecliente, sid
        )
        SELECT 
            COALESCE(d.nomecliente, fb.nomecliente, cj.nomecliente) as nomecliente,
            COALESCE(d.sid, fb.sid, cj.sid) as sid,
            COALESCE(d.dump_count, 0) as dumps,
            COALESCE(fb.backup_count, 0) as failed_backups,
            COALESCE(cj.job_count, 0) as cancelled_jobs
        FROM dumps d
        FULL OUTER JOIN failed_backups fb ON d.nomecliente = fb.nomecliente AND d.sid = fb.sid
        FULL OUTER JOIN cancelled_jobs cj ON COALESCE(d.nomecliente, fb.nomecliente) = cj.nomecliente AND COALESCE(d.sid, fb.sid) = cj.sid
        ORDER BY nomecliente, sid
    """


def get_services_timeline_query(filters: Dict[str, Any]) -> str:
    """Query 7: Timeline andamento servizi nel tempo"""
    where_clause = build_base_where(filters)
    
    return f"""
        SELECT 
            datacontrollo,
            nomecliente,
            SUM(CASE WHEN stato_servizi.Dump = 'ko' THEN 1 ELSE 0 END) as dump_ko,
            SUM(CASE WHEN stato_servizi.job_in_errore = 'ko' THEN 1 ELSE 0 END) as job_ko,
            SUM(CASE WHEN stato_servizi.processi_attivi = 'ko' THEN 1 ELSE 0 END) as processi_ko,
            SUM(CASE WHEN stato_servizi.spazio_database = 'ko' THEN 1 ELSE 0 END) as db_ko,
            SUM(CASE WHEN stato_servizi.spazio_log = 'ko' THEN 1 ELSE 0 END) as log_ko,
            SUM(CASE WHEN stato_servizi.scadenza_certificati = 'ko' THEN 1 ELSE 0 END) as cert_ko,
            SUM(CASE WHEN stato_servizi.update_in_errore = 'ko' THEN 1 ELSE 0 END) as update_ko,
            SUM(CASE WHEN stato_servizi.Spool = 'ko' THEN 1 ELSE 0 END) as spool_ko
        FROM "sap_reports_db"."reportparquet"
        {where_clause}
        GROUP BY datacontrollo, nomecliente
        ORDER BY datacontrollo ASC
    """


def get_problems_timeline_query(filters: Dict[str, Any]) -> str:
    """Query 8: Timeline andamento problemi (dumps, backups, jobs)"""
    conditions = []
    
    if filters.get('startDate') and filters.get('endDate'):
        conditions.append(f"datacontrollo BETWEEN '{sanitize(filters['startDate'])}' AND '{sanitize(filters['endDate'])}'")
    if filters.get('clients') and len(filters['clients']) > 0:
        client_list = ','.join([f"'{sanitize(c)}'" for c in filters['clients']])
        conditions.append(f"nomecliente IN ({client_list})")
    if filters.get('sids') and len(filters['sids']) > 0:
        sid_list = ','.join([f"'{sanitize(s)}'" for s in filters['sids']])
        conditions.append(f"sid IN ({sid_list})")
    elif 'sids' in filters and len(filters.get('sids', [])) == 0 and filters.get('clients') and len(filters['clients']) > 0:
        conditions.append("sid = 'NESSUN_SID_SELEZIONATO'")
    
    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ''
    
    backup_conditions = conditions + ["(backup.STATUS LIKE '%failed%' OR backup.STATUS LIKE '%FAILED%')"]
    backup_where_clause = f"WHERE {' AND '.join(backup_conditions)}" if backup_conditions else ''
    
    job_conditions = conditions + ["job.STATUS = 'CANCELLED'"]
    job_where_clause = f"WHERE {' AND '.join(job_conditions)}" if job_conditions else ''
    
    return f"""
        WITH daily_dumps AS (
            SELECT 
                datacontrollo,
                COUNT(*) as dump_count
            FROM "sap_reports_db"."reportparquet"
            CROSS JOIN UNNEST(abap_short_dumps) AS t(dump)
            {where_clause}
            GROUP BY datacontrollo
        ),
        daily_backups AS (
            SELECT 
                datacontrollo,
                COUNT(*) as backup_count
            FROM "sap_reports_db"."reportparquet"
            CROSS JOIN UNNEST(situazione_backup) AS t(backup)
            {backup_where_clause}
            GROUP BY datacontrollo
        ),
        daily_jobs AS (
            SELECT 
                datacontrollo,
                COUNT(*) as job_count
            FROM "sap_reports_db"."reportparquet"
            CROSS JOIN UNNEST(abap_batch_jobs) AS t(job)
            {job_where_clause}
            GROUP BY datacontrollo
        )
        SELECT 
            COALESCE(dd.datacontrollo, db.datacontrollo, dj.datacontrollo) as datacontrollo,
            COALESCE(dd.dump_count, 0) as dumps,
            COALESCE(db.backup_count, 0) as failed_backups,
            COALESCE(dj.job_count, 0) as cancelled_jobs
        FROM daily_dumps dd
        FULL OUTER JOIN daily_backups db ON dd.datacontrollo = db.datacontrollo
        FULL OUTER JOIN daily_jobs dj ON COALESCE(dd.datacontrollo, db.datacontrollo) = dj.datacontrollo
        ORDER BY datacontrollo ASC
    """


def get_available_clients_query() -> str:
    """Query 9: Lista clienti disponibili"""
    return """
        SELECT DISTINCT nomecliente
        FROM "sap_reports_db"."reportparquet"
        ORDER BY nomecliente
    """


def get_available_sids_query(clients: Optional[List[str]] = None) -> str:
    """Query 10: Lista SID disponibili (opzionalmente filtrati per cliente)"""
    query = """
        SELECT DISTINCT sid, nomecliente
        FROM "sap_reports_db"."reportparquet"
    """
    
    if clients and len(clients) > 0:
        client_list = ','.join([f"'{sanitize(c)}'" for c in clients])
        query += f" WHERE nomecliente IN ({client_list})"
    
    query += " ORDER BY sid"
    return query


def get_previous_period_data(filters: Dict[str, Any], data_type: str) -> Optional[str]:
    """
    Query 11: Dati periodo precedente per calcolo trend
    
    Args:
        filters: Filtri correnti
        data_type: Tipo di dato ('dumps', 'backups', 'jobs')
    
    Returns:
        Query SQL o None se tipo non valido
    """
    if not filters.get('startDate') or not filters.get('endDate'):
        return None
    
    # Calcola periodo precedente
    start = datetime.strptime(filters['startDate'], '%Y-%m-%d')
    end = datetime.strptime(filters['endDate'], '%Y-%m-%d')
    diff = end - start
    
    prev_end = start - timedelta(days=1)
    prev_start = prev_end - diff
    
    prev_filters = {
        **filters,
        'startDate': prev_start.strftime('%Y-%m-%d'),
        'endDate': prev_end.strftime('%Y-%m-%d')
    }
    
    conditions = []
    
    if prev_filters.get('startDate') and prev_filters.get('endDate'):
        conditions.append(f"datacontrollo BETWEEN '{sanitize(prev_filters['startDate'])}' AND '{sanitize(prev_filters['endDate'])}'")
    if prev_filters.get('clients') and len(prev_filters['clients']) > 0:
        client_list = ','.join([f"'{sanitize(c)}'" for c in prev_filters['clients']])
        conditions.append(f"nomecliente IN ({client_list})")
    if prev_filters.get('sids') and len(prev_filters['sids']) > 0:
        sid_list = ','.join([f"'{sanitize(s)}'" for s in prev_filters['sids']])
        conditions.append(f"sid IN ({sid_list})")
    elif 'sids' in prev_filters and len(prev_filters.get('sids', [])) == 0 and prev_filters.get('clients') and len(prev_filters['clients']) > 0:
        conditions.append("sid = 'NESSUN_SID_SELEZIONATO'")
    
    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ''
    
    if data_type == 'dumps':
        return f"""
            SELECT 
                nomecliente,
                datacontrollo,
                COUNT(*) as total_dumps
            FROM "sap_reports_db"."reportparquet"
            CROSS JOIN UNNEST(abap_short_dumps) AS t(dump)
            {where_clause}
            GROUP BY nomecliente, datacontrollo
        """
    elif data_type == 'backups':
        backup_conditions = conditions + ["(backup.STATUS LIKE '%failed%' OR backup.STATUS LIKE '%FAILED%')"]
        backup_where_clause = f"WHERE {' AND '.join(backup_conditions)}" if backup_conditions else ''
        return f"""
            SELECT 
                nomecliente,
                datacontrollo,
                COUNT(*) as failed_backups
            FROM "sap_reports_db"."reportparquet"
            CROSS JOIN UNNEST(situazione_backup) AS t(backup)
            {backup_where_clause}
            GROUP BY nomecliente, datacontrollo
        """
    elif data_type == 'jobs':
        job_conditions = conditions + ["job.STATUS = 'CANCELLED'"]
        job_where_clause = f"WHERE {' AND '.join(job_conditions)}" if job_conditions else ''
        return f"""
            SELECT 
                nomecliente,
                datacontrollo,
                COUNT(*) as cancelled_jobs
            FROM "sap_reports_db"."reportparquet"
            CROSS JOIN UNNEST(abap_batch_jobs) AS t(job)
            {job_where_clause}
            GROUP BY nomecliente, datacontrollo
        """
    
    return None
