from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from .athena import run_athena_query, build_dynamic_query
# Se vuoi proteggere questa rotta con login, decommenta sotto e usa Depends
# from .dependencies import get_current_user 

router = APIRouter()

class FilterModel(BaseModel):
    field: str
    operator: str
    value: str

class SearchRequest(BaseModel):
    filters: List[FilterModel]
    selectFields: List[str]

@router.post("/logs/{log_type}")
async def search_logs(log_type: str, request: SearchRequest):
    """
    Endpoint per cercare nei log CloudConnexa tramite Athena.
    log_type può essere 'flow-established' o 'domain-blocked'.
    """
    if log_type not in ["flow-established", "domain-blocked"]:
        raise HTTPException(status_code=400, detail="Tipo log non valido")
    
    try:
        # Costruisci la query SQL
        query = build_dynamic_query(log_type, request.filters, request.selectFields)
        
        # Esegui la query su AWS
        results = run_athena_query(query)
        
        return results
    except Exception as e:
        print(f"Errore Athena: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))