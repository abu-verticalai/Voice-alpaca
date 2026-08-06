import os

DATA_DIR = os.getenv("DATA_DIR", "data")
AGENTS_DIR = os.path.join(DATA_DIR, "agents")
ACTIVE_DIR = os.path.join(DATA_DIR, "active")
EMBEDDINGS_DIR = os.path.join(DATA_DIR, "embeddings")

os.makedirs(AGENTS_DIR, exist_ok=True)
os.makedirs(ACTIVE_DIR, exist_ok=True)
os.makedirs(EMBEDDINGS_DIR, exist_ok=True)
