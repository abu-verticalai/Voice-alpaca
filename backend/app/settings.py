import os
from dotenv import load_dotenv

load_dotenv(override=False)

DATA_DIR = os.getenv("DATA_DIR", "data")
AGENTS_DIR = os.path.join(DATA_DIR, "agents")
ACTIVE_DIR = os.path.join(DATA_DIR, "active")
EMBEDDINGS_DIR = os.path.join(DATA_DIR, "embeddings")

AUDIO_DIR = os.getenv("AUDIO_DIR", "audio")
FIXED_AUDIO_DIR = os.path.join(AUDIO_DIR, "fixed")
TEMP_AUDIO_DIR = os.path.join(AUDIO_DIR, "temp")
DYNAMIC_CACHE_DIR = os.path.join(AUDIO_DIR, "dynamic_cache")

os.makedirs(AGENTS_DIR, exist_ok=True)
os.makedirs(ACTIVE_DIR, exist_ok=True)
os.makedirs(EMBEDDINGS_DIR, exist_ok=True)
os.makedirs(FIXED_AUDIO_DIR, exist_ok=True)
os.makedirs(TEMP_AUDIO_DIR, exist_ok=True)
os.makedirs(DYNAMIC_CACHE_DIR, exist_ok=True)

SARVAM_API_KEY = os.getenv("SARVAM_API_KEY")
SARVAM_TTS_URL = os.getenv("SARVAM_TTS_URL", "https://api.sarvam.ai/text-to-speech")
SARVAM_TTS_MODEL = os.getenv("SARVAM_TTS_MODEL", "bulbul:v3")
SARVAM_TTS_PACE = float(os.getenv("SARVAM_TTS_PACE", "1.0"))
SARVAM_TTS_TEMPERATURE = float(os.getenv("SARVAM_TTS_TEMPERATURE", "0.4"))
SARVAM_PRONUNCIATION_DICT_ID = os.getenv("SARVAM_PRONUNCIATION_DICT_ID")
