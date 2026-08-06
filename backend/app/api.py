from fastapi import APIRouter, HTTPException
from typing import List
from .models import AgentModel
from . import storage, service

router = APIRouter()

@router.post("/api/agents", response_model=AgentModel)
def create_agent(agent: AgentModel):
    try:
        return service.create_agent(agent)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/api/agents", response_model=List[AgentModel])
def list_agents():
    return storage.list_agents()

@router.get("/api/agents/{agent_id}", response_model=AgentModel)
def get_agent(agent_id: str):
    return storage.get_agent(agent_id)

@router.put("/api/agents/{agent_id}", response_model=AgentModel)
def update_agent(agent_id: str, agent: AgentModel):
    try:
        return service.update_agent(agent_id, agent)
    except ValueError as e:
        if str(e) == "Agent not found":
            raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/api/agents/{agent_id}")
def delete_agent(agent_id: str):
    storage.delete_agent(agent_id)
    return {"status": "ok"}
