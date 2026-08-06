import numpy as np
from typing import Dict, Any
from .models import AgentModel
from .normalizer import normalize_text
from .embeddings import get_phrase_hash, get_embeddings, compute_similarity
from . import storage

MATCH_ACCEPTANCE_THRESHOLD = 0.80
MATCH_CLARIFICATION_THRESHOLD = 0.60
MATCH_MINIMUM_MARGIN = 0.08
MAX_FAILED_ATTEMPTS = 2

def match_intent(agent: AgentModel, conversation_id: str, transcript: str, failed_attempts: int) -> Dict[str, Any]:
    conv = next((c for c in agent.conversations if c.id == conversation_id), None)
    if not conv:
        raise ValueError("Conversation not found")
        
    normalized_transcript = normalize_text(transcript)
    if not normalized_transcript:
        return _handle_failure(agent, failed_attempts, decision="no_match")
        
    # 1. Exact Matching
    exact_matches = []
    for intent in conv.intents:
        for phrase in intent.example_phrases:
            norm_phrase = normalize_text(phrase.text)
            if norm_phrase == normalized_transcript:
                if intent.id not in exact_matches:
                    exact_matches.append(intent.id)
                    
    if len(exact_matches) == 1:
        intent = next(i for i in conv.intents if i.id == exact_matches[0])
        return {
            "decision": "accept",
            "intent_id": intent.id,
            "fixed_response": intent.fixed_response,
            "top_score": 1.0,
            "second_score": 0.0,
            "margin": 1.0,
            "failed_attempts": 0,
            "move_to_closing": False
        }
    elif len(exact_matches) > 1:
        return _handle_failure(agent, failed_attempts, decision="ambiguous", top_score=1.0, second_score=1.0, margin=0.0)
        
    # 2. Semantic Matching
    transcript_emb = get_embeddings([normalized_transcript])[0]
    agent_embs = storage.get_agent_embeddings(agent.id)
    
    intent_scores = {}
    for intent in conv.intents:
        best_score = 0.0
        for phrase in intent.example_phrases:
            norm_phrase = normalize_text(phrase.text)
            phash = get_phrase_hash(norm_phrase)
            phrase_emb = agent_embs.get(phash)
            if phrase_emb:
                score = compute_similarity(transcript_emb, np.array(phrase_emb))
                if score > best_score:
                    best_score = score
        intent_scores[intent.id] = best_score
        
    ranked = sorted(intent_scores.items(), key=lambda x: x[1], reverse=True)
    if not ranked:
        return _handle_failure(agent, failed_attempts, decision="no_match")
        
    top_intent_id, top_score = ranked[0]
    second_score = ranked[1][1] if len(ranked) > 1 else 0.0
    margin = top_score - second_score
    
    if top_score >= MATCH_ACCEPTANCE_THRESHOLD and margin >= MATCH_MINIMUM_MARGIN:
        intent = next(i for i in conv.intents if i.id == top_intent_id)
        return {
            "decision": "accept",
            "intent_id": intent.id,
            "fixed_response": intent.fixed_response,
            "top_score": float(top_score),
            "second_score": float(second_score),
            "margin": float(margin),
            "failed_attempts": 0,
            "move_to_closing": False
        }
    elif top_score >= MATCH_ACCEPTANCE_THRESHOLD and margin < MATCH_MINIMUM_MARGIN:
        return _handle_failure(agent, failed_attempts, decision="ambiguous", top_score=float(top_score), second_score=float(second_score), margin=float(margin))
    elif top_score >= MATCH_CLARIFICATION_THRESHOLD and top_score < MATCH_ACCEPTANCE_THRESHOLD:
        return _handle_failure(agent, failed_attempts, decision="clarify", top_score=float(top_score), second_score=float(second_score), margin=float(margin))
    else:
        return _handle_failure(agent, failed_attempts, decision="no_match", top_score=float(top_score), second_score=float(second_score), margin=float(margin))

def _handle_failure(agent: AgentModel, failed_attempts: int, decision: str, top_score: float = 0.0, second_score: float = 0.0, margin: float = 0.0) -> Dict[str, Any]:
    failed_attempts += 1
    # Use global MAX_FAILED_ATTEMPTS for consistency with requirements
    move_to_closing = failed_attempts >= MAX_FAILED_ATTEMPTS
    
    fixed_response = agent.fallbacks.failure_script if move_to_closing else agent.fallbacks.clarify_script
    
    return {
        "decision": decision,
        "intent_id": None,
        "fixed_response": fixed_response,
        "top_score": top_score,
        "second_score": second_score,
        "margin": margin,
        "failed_attempts": failed_attempts,
        "move_to_closing": move_to_closing
    }
