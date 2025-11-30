import boto3
import time
import os
from typing import List, Dict, Any

# --- CONFIGURAZIONE ---
# Recupera le variabili d'ambiente o usa valori di default
ATHENA_DB = os.getenv("ATHENA_DB", "cloudconnexa_logs_db")
ATHENA_OUTPUT_BUCKET = os.getenv("ATHENA_RESULTS_BUCKET", "tuo-bucket-athena-results")
ATHENA_WORKGROUP = os.getenv("ATHENA_WORKGROUP", "primary")
AWS_REGION = os.getenv("AWS_REGION", "eu-central-1")

# --- WHITELIST CAMPI (Per sicurezza) ---
# Replica la logica di configurazione del vecchio progetto per evitare SQL Injection
FIELDS_CONFIG = {
    "flow-established": [
        "timestamp", "UserName", "UserNameGroup", "DestinationIP", 
        "DestinationPort", "Customer", "eventname", "initiator"
    ],
    "domain-blocked": [
        "timestamp", "parententityname", "dominio_bloccato", 
        "categoria_dominio", "eventname"
    ]
}

def get_athena_client():
    return boto3.client('athena', region_name=AWS_REGION)

def build_dynamic_query(log_type: str, filters: List[Dict], select_fields: List[str]) -> str:
    """Costruisce una query SQL sicura basata sui filtri."""
    
    # 1. Validazione Campi (Whitelist)
    allowed_fields = FIELDS_CONFIG.get(log_type, [])
    if not allowed_fields:
        raise ValueError(f"Tipo di log non valido: {log_type}")

    # Pulisce i campi selezionati mantenendo solo quelli validi
    safe_select = [f for f in select_fields if f in allowed_fields]
    if not safe_select:
        safe_select = ["timestamp"] # Fallback
    
    select_clause = ", ".join([f'"{f}"' for f in safe_select])
    
    # 2. Costruzione WHERE clause
    where_conditions = [f"eventname = '{log_type}'"]
    
    for f in filters:
        field = f.get('field')
        operator = f.get('operator', '=')
        value = f.get('value', '')
        
        if field in allowed_fields and value:
            # Sanitizzazione base per il valore (escape singoli apici)
            safe_value = str(value).replace("'", "''")
            
            if operator == 'LIKE':
                where_conditions.append(f"\"{field}\" LIKE '{safe_value}'")
            else:
                where_conditions.append(f"\"{field}\" = '{safe_value}'")
                
    where_clause = " AND ".join(where_conditions)
    
    # 3. Assemblaggio Query
    query = f"SELECT {select_clause} FROM extracted_logs WHERE {where_clause} ORDER BY timestamp DESC LIMIT 1000"
    return query

def run_athena_query(query_string: str):
    """Esegue la query su Athena e attende i risultati."""
    client = get_athena_client()
    
    # 1. Avvia esecuzione
    response = client.start_query_execution(
        QueryString=query_string,
        QueryExecutionContext={'Database': ATHENA_DB},
        ResultConfiguration={'OutputLocation': f"s3://{ATHENA_OUTPUT_BUCKET}/query_results/"},
        WorkGroup=ATHENA_WORKGROUP
    )
    query_execution_id = response['QueryExecutionId']
    
    # 2. Polling per attesa completamento
    while True:
        stats = client.get_query_execution(QueryExecutionId=query_execution_id)
        status = stats['QueryExecution']['Status']['State']
        
        if status in ['SUCCEEDED', 'FAILED', 'CANCELLED']:
            break
        time.sleep(1) # Attendi 1 secondo
        
    if status != 'SUCCEEDED':
        reason = stats['QueryExecution']['Status'].get('StateChangeReason', 'Errore sconosciuto')
        raise Exception(f"Query Athena fallita: {reason}")
        
    # 3. Recupero Risultati
    results = client.get_query_results(QueryExecutionId=query_execution_id)
    return format_results(results)

def format_results(results):
    """Formatta la risposta complessa di Boto3 in una lista di dizionari JSON-friendly."""
    rows = results['ResultSet']['Rows']
    if not rows:
        return []
        
    # La prima riga contiene gli headers
    headers = [col['VarCharValue'] for col in rows[0]['Data']]
    formatted_data = []
    
    # Salta l'header e processa i dati
    for row in rows[1:]:
        item = {}
        for index, col in enumerate(row['Data']):
            # Gestisce campi vuoti o mancanti
            val = col.get('VarCharValue', '')
            if index < len(headers):
                item[headers[index]] = val
        formatted_data.append(item)
        
    return formatted_data