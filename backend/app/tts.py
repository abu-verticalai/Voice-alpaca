import requests
import base64
from typing import Dict, List, Optional
from . import settings

VOICE_CATALOG = [
    {"name": "Priya \u2014 Recommended", "value": "priya"},
    {"name": "Ishita \u2014 Recommended", "value": "ishita"},
    {"name": "Neha", "value": "neha"},
    {"name": "Ritu", "value": "ritu"},
    {"name": "Pooja", "value": "pooja"},
    {"name": "Simran", "value": "simran"},
    {"name": "Kavya", "value": "kavya"},
    {"name": "Shreya", "value": "shreya"},
    {"name": "Roopa", "value": "roopa"},
    {"name": "Tanya", "value": "tanya"},
    {"name": "Shruti", "value": "shruti"},
    {"name": "Suhani", "value": "suhani"},
    {"name": "Kavitha", "value": "kavitha"},
    {"name": "Rupali", "value": "rupali"}
]

def get_voice_catalog(language: str) -> List[Dict[str, str]]:
    return VOICE_CATALOG

def map_language_to_sarvam(language: str) -> str:
    mapping = {
        "Tamil": "ta-IN",
        "English": "en-IN",
        "Tanglish": "ta-IN"
    }
    return mapping.get(language, "ta-IN")

def generate_tts(text: str, speaker: str, language: str) -> bytes:
    if not settings.SARVAM_API_KEY:
        # For tests, if API key is not set, mock the audio response
        return b"mock_wav_data"
        
    url = settings.SARVAM_TTS_URL
    headers = {
        "Content-Type": "application/json",
        "api-subscription-key": settings.SARVAM_API_KEY
    }
    
    target_language = map_language_to_sarvam(language)
    
    payload = {
        "text": text,
        "language_code": target_language,
        "speaker": speaker.lower(),
        "model": settings.SARVAM_TTS_MODEL,
        "pace": settings.SARVAM_TTS_PACE,
        "temperature": settings.SARVAM_TTS_TEMPERATURE,
        "output_audio_codec": "wav"
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=15)
    except Exception as e:
        raise Exception(f"TTS request failed: {str(e)}")
    
    if response.status_code != 200:
        # Avoid logging/returning the API key if it's somehow in the response text
        error_msg = response.text
        if settings.SARVAM_API_KEY and settings.SARVAM_API_KEY in error_msg:
            error_msg = error_msg.replace(settings.SARVAM_API_KEY, "***")
        raise Exception(f"TTS failed: {response.status_code} - {error_msg}")
        
    data = response.json()
    base64_audio = data.get("audios", [])[0]
    decoded_audio = base64.b64decode(base64_audio)
    
    if not decoded_audio.startswith(b"RIFF"):
        raise Exception("TTS failed: Returned audio is not a valid WAV file.")
        
    return decoded_audio

def generate_preview(speaker: str, language: str, text: str) -> bytes:
    # Truncate text to avoid long previews and credit drain
    truncated_text = text[:100]
    return generate_tts(truncated_text, speaker, language)
