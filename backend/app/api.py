from fastapi import APIRouter, HTTPException
from typing import List
from .models import AgentModel, MatchRequest
from . import storage, service, tts
from pydantic import BaseModel
from fastapi.responses import Response

from .variables import ValidationException

router = APIRouter()

@router.post("/api/agents", response_model=AgentModel)
def create_agent(agent: AgentModel):
    try:
        return service.create_agent(agent)
    except ValidationException as e:
        raise HTTPException(status_code=400, detail=e.errors)
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
    except ValidationException as e:
        raise HTTPException(status_code=400, detail=e.errors)
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

@router.post("/api/agents/{agent_id}/match")
def match_intent_endpoint(agent_id: str, req: MatchRequest):
    try:
        agent = storage.get_agent(agent_id)
        from .matcher import match_intent
        return match_intent(agent, req.conversation_id, req.text, req.failed_attempts)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

class PreviewRequest(BaseModel):
    speaker: str
    language: str
    text: str

@router.get("/api/voices")
def list_voices(language: str):
    catalog = tts.get_voice_catalog(language)
    return catalog

@router.post("/api/voices/preview")
def preview_voice(req: PreviewRequest):
    try:
        audio_bytes = tts.generate_preview(req.speaker, req.language, req.text)
        return Response(content=audio_bytes, media_type="audio/wav")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

