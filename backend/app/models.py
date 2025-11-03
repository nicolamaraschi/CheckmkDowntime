from pydantic import BaseModel, Field
from typing import List, Optional, Union
from datetime import datetime

class DowntimeRequest(BaseModel):
    host: str
    giorni: List[int]
    startTime: str
    endTime: str
    ripeti: Union[int, str]
    commento: str

class HostWithFolder(BaseModel):
    id: str
    folder: str

class HostResponse(BaseModel):
    hosts: List[Union[str, HostWithFolder]]

class ClientResponse(BaseModel):
    clients: List[str]

class StatsResponse(BaseModel):
    totalHosts: int
    activeDowntimes: int

class DowntimeResponse(BaseModel):
    start_times: List[str]
    end_times: List[str]
    responses: List[str]

class ConnectionTestResponse(BaseModel):
    status: str
    message: str

class DowntimeDeleteRequest(BaseModel):
    downtime_id: str
    site_id: str

class BatchDeleteRequest(BaseModel):
    downtimes: List[DowntimeDeleteRequest]

class BatchDeleteResponse(BaseModel):
    succeeded: int
    failed: int
    errors: List[str]