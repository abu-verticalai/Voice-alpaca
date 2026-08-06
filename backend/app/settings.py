import os

DATA_DIR = os.getenv("DATA_DIR", "data")
AGENTS_DIR = os.path.join(DATA_DIR, "agents")
ACTIVE_DIR = os.path.join(DATA_DIR, "active")

os.makedirs(AGENTS_DIR, exist_ok=True)
os.makedirs(ACTIVE_DIR, exist_ok=True)
