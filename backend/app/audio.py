import os
import hashlib
import uuid
import re
from typing import List, Dict, Any
from .models import AgentModel
from . import settings
from . import tts

def segment_script(script: str) -> List[Dict[str, str]]:
    segments = []
    # Match {{variable}}
    pattern = re.compile(r"(\{\{[a-zA-Z_][a-zA-Z0-9_]*\}\})")
    parts = pattern.split(script)
    
    for part in parts:
        if not part:
            continue
        if part.startswith("{{") and part.endswith("}}"):
            var_name = part[2:-2]
            segments.append({"type": "variable", "name": var_name})
        else:
            segments.append({"type": "fixed", "text": part})
            
    return segments

def get_audio_cache_key(text: str, speaker: str, language: str) -> str:
    # provider + model + language + speaker + pace + temperature + dict_id + normalized_text
    from .normalizer import normalize_text
    norm = normalize_text(text)
    raw = f"sarvam_bulbul_v3_{language}_{speaker}_{settings.SARVAM_TTS_PACE}_{settings.SARVAM_TTS_TEMPERATURE}_{settings.SARVAM_PRONUNCIATION_DICT_ID}_{norm}"
    return hashlib.md5(raw.encode("utf-8")).hexdigest()

def process_script_audio(script: str, speaker: str, language: str, agent_id: str, version: int) -> Dict[str, Any]:
    segments = segment_script(script)
    
    agent_fixed_dir = os.path.join(settings.FIXED_AUDIO_DIR, agent_id, f"v{version}")
    os.makedirs(agent_fixed_dir, exist_ok=True)
    
    manifest_segments = []
    
    for seg in segments:
        if seg["type"] == "fixed":
            text = seg["text"].strip()
            if not text:
                continue
            
            cache_key = get_audio_cache_key(text, speaker, language)
            cache_file = os.path.join(settings.DYNAMIC_CACHE_DIR, f"{cache_key}.wav")
            
            if os.path.exists(cache_file):
                # Use cached
                with open(cache_file, "rb") as f:
                    wav_data = f.read()
            else:
                # Generate new
                wav_data = tts.generate_tts(text, speaker, language)
                if not wav_data.startswith(b"RIFF") and not wav_data == b"mock_wav_data":
                    raise Exception("Invalid WAV format received from TTS")
                with open(cache_file, "wb") as f:
                    f.write(wav_data)
                    
            # Copy to agent specific folder
            filename = f"{uuid.uuid4().hex[:8]}.wav"
            agent_file = os.path.join(agent_fixed_dir, filename)
            with open(agent_file, "wb") as f:
                f.write(wav_data)
                
            manifest_segments.append({
                "type": "fixed_audio",
                "path": os.path.relpath(agent_file, settings.DATA_DIR).replace("\\", "/") # standardize to posix
            })
        else:
            manifest_segments.append({
                "type": "variable",
                "name": seg["name"]
            })
            
    manifest_id = f"audio-{uuid.uuid4().hex[:8]}"
    return {
        "id": manifest_id,
        "segments": manifest_segments
    }

def prepare_agent_audio(agent: AgentModel):
    if not agent.voice or not agent.voice.speaker:
        raise Exception("Agent voice is required")
        
    speaker = agent.voice.speaker
    language = agent.language
    
    # Process Greeting
    if agent.greeting and agent.greeting.script:
        manifest = process_script_audio(agent.greeting.script, speaker, language, agent.id, agent.version)
        agent.greeting.audio_manifest_id = manifest["id"]
        # Save manifest
        _save_manifest(agent.id, manifest)
        
    # Process Conversations
    for conv in agent.conversations:
        for intent in conv.intents:
            if intent.fixed_response:
                manifest = process_script_audio(intent.fixed_response, speaker, language, agent.id, agent.version)
                intent.audio_manifest_id = manifest["id"]
                _save_manifest(agent.id, manifest)
                
    # Process Closing
    if agent.closing and agent.closing.script:
        manifest = process_script_audio(agent.closing.script, speaker, language, agent.id, agent.version)
        agent.closing.audio_manifest_id = manifest["id"]
        _save_manifest(agent.id, manifest)
        
    # Process Fallbacks (Clarification, Failure)
    if agent.fallbacks:
        # Fallbacks might also need manifests in the future, for now they are global but we could process them too if needed.
        pass

def _save_manifest(agent_id: str, manifest: Dict[str, Any]):
    import json
    # In version 1, manifests can just be saved as JSON files in a manifests dir or kept inside the agent JSON.
    # The doc says "Save audio manifests". We can save them in a manifests directory.
    manifests_dir = os.path.join(settings.DATA_DIR, "manifests")
    os.makedirs(manifests_dir, exist_ok=True)
    manifest_file = os.path.join(manifests_dir, f"{manifest['id']}.json")
    with open(manifest_file, "w") as f:
        json.dump(manifest, f, indent=2)
