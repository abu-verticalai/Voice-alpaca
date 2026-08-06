import json
import os
import glob
from . import settings
from .models import AgentModel
from fastapi import HTTPException

def get_active_version(agent_id: str) -> int:
    path = os.path.join(settings.ACTIVE_DIR, f"{agent_id}.json")
    if not os.path.exists(path):
        return 0
    with open(path, "r") as f:
        data = json.load(f)
        return data.get("active_version", 0)

def set_active_version(agent_id: str, version: int):
    path = os.path.join(settings.ACTIVE_DIR, f"{agent_id}.json")
    with open(path, "w") as f:
        json.dump({"active_version": version}, f)

def get_agent(agent_id: str, version: int = None) -> AgentModel:
    if version is None:
        version = get_active_version(agent_id)
    if version == 0:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    path = os.path.join(settings.AGENTS_DIR, agent_id, f"v{version}.json")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Agent version not found")
    
    with open(path, "r") as f:
        return AgentModel(**json.load(f))

def list_agents() -> list[AgentModel]:
    agents = []
    if not os.path.exists(settings.ACTIVE_DIR):
        return agents
    for filename in os.listdir(settings.ACTIVE_DIR):
        if filename.endswith(".json"):
            agent_id = filename[:-5]
            try:
                agents.append(get_agent(agent_id))
            except HTTPException:
                pass
    return agents

def save_agent(agent: AgentModel) -> AgentModel:
    agent_dir = os.path.join(settings.AGENTS_DIR, agent.id)
    os.makedirs(agent_dir, exist_ok=True)
    
    path = os.path.join(agent_dir, f"v{agent.version}.json")
    with open(path, "w") as f:
        json.dump(agent.model_dump(), f, indent=2)
    
    return agent

def save_agent_embeddings(agent_id: str, embeddings_data: dict):
    path = os.path.join(settings.EMBEDDINGS_DIR, f"{agent_id}.json")
    with open(path, "w") as f:
        json.dump(embeddings_data, f)

def get_agent_embeddings(agent_id: str) -> dict:
    path = os.path.join(settings.EMBEDDINGS_DIR, f"{agent_id}.json")
    if not os.path.exists(path):
        return {}
    with open(path, "r") as f:
        return json.load(f)

def delete_agent(agent_id: str):
    active_path = os.path.join(settings.ACTIVE_DIR, f"{agent_id}.json")
    if os.path.exists(active_path):
        os.remove(active_path)
        
    emb_path = os.path.join(settings.EMBEDDINGS_DIR, f"{agent_id}.json")
    if os.path.exists(emb_path):
        os.remove(emb_path)
    
    agent_dir = os.path.join(settings.AGENTS_DIR, agent_id)
    if os.path.exists(agent_dir):
        for f in glob.glob(os.path.join(agent_dir, "*.json")):
            os.remove(f)
        os.rmdir(agent_dir)
