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

class HostResponse(BaseModel):
    hosts: List[str]

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
