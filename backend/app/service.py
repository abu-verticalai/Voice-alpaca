import uuid
import threading
from .models import AgentModel
from . import storage
from .variables import validate_agent, sync_dynamic_variables, ValidationException

_save_locks = {}

def get_agent_lock(agent_id: str):
    if agent_id not in _save_locks:
        _save_locks[agent_id] = threading.Lock()
    return _save_locks[agent_id]

def assign_stable_ids(agent: AgentModel):
    if agent.greeting and (not agent.greeting.id or agent.greeting.id.startswith("tmp-") or agent.greeting.id.startswith("greeting-temp")):
        agent.greeting.id = f"greeting-{uuid.uuid4().hex[:8]}"
    if agent.closing and (not agent.closing.id or agent.closing.id.startswith("tmp-") or agent.closing.id.startswith("closing-temp")):
        agent.closing.id = f"closing-{uuid.uuid4().hex[:8]}"
        
    for i, conv in enumerate(agent.conversations):
        if not conv.id or conv.id.startswith("tmp-") or conv.id.startswith("conv-"):
            if "-" not in conv.id or len(conv.id.split("-")[1]) != 8:
                conv.id = f"conv-{uuid.uuid4().hex[:8]}"
        conv.position = i + 1
        for intent in conv.intents:
            if not intent.id or intent.id.startswith("tmp-") or intent.id.startswith("intent-"):
                if "-" not in intent.id or len(intent.id.split("-")[1]) != 8:
                    intent.id = f"intent-{uuid.uuid4().hex[:8]}"
            for phrase in intent.example_phrases:
                if not phrase.id or phrase.id.startswith("tmp-") or phrase.id.startswith("phrase-"):
                    if "-" not in phrase.id or len(phrase.id.split("-")[1]) != 8:
                        phrase.id = f"phrase-{uuid.uuid4().hex[:8]}"

def create_agent(agent: AgentModel) -> AgentModel:
    errors, extracted_vars = validate_agent(agent)
    if errors:
        raise ValidationException(errors)
    sync_dynamic_variables(agent, extracted_vars)
    
    agent.id = f"agent-{uuid.uuid4().hex[:8]}"
    agent.version = 1
    assign_stable_ids(agent)
    
    _process_embeddings(agent)
    
    storage.save_agent(agent)
    storage.set_active_version(agent.id, agent.version)
    return agent

def update_agent(agent_id: str, agent: AgentModel) -> AgentModel:
    errors, extracted_vars = validate_agent(agent)
    if errors:
        raise ValidationException(errors)
    sync_dynamic_variables(agent, extracted_vars)
    
    lock = get_agent_lock(agent_id)
    with lock:
        current_version = storage.get_active_version(agent_id)
        if current_version == 0:
            raise ValueError("Agent not found")
        
        agent.id = agent_id
        agent.version = current_version + 1
        assign_stable_ids(agent)
        
        _process_embeddings(agent)
                        
        storage.save_agent(agent)
        storage.set_active_version(agent.id, agent.version)
        return agent

def _process_embeddings(agent: AgentModel):
    from .normalizer import normalize_text
    from .embeddings import get_phrase_hash, get_embeddings
    
    existing_embs = storage.get_agent_embeddings(agent.id)
    new_embs = {}
    
    phrases_to_embed = []
    hashes_to_embed = []
    
    for conv in agent.conversations:
        for intent in conv.intents:
            for phrase in intent.example_phrases:
                norm_text = normalize_text(phrase.text)
                if not norm_text:
                    continue
                phash = get_phrase_hash(norm_text)
                if phash in existing_embs:
                    new_embs[phash] = existing_embs[phash]
                elif phash not in new_embs:
                    phrases_to_embed.append(norm_text)
                    hashes_to_embed.append(phash)
                    new_embs[phash] = None # placeholder
                    
    if phrases_to_embed:
        import numpy as np
        embeddings = get_embeddings(phrases_to_embed)
        for i, phash in enumerate(hashes_to_embed):
            # store as list of floats for JSON serialization
            new_embs[phash] = embeddings[i].tolist()
            
    storage.save_agent_embeddings(agent.id, new_embs)
