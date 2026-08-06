import os
import hashlib
import numpy as np
from typing import List

_model = None

def get_model():
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        device = os.getenv("EMBEDDING_DEVICE", "cpu")
        _model = SentenceTransformer("BAAI/bge-m3", device=device)
    return _model

def get_phrase_hash(normalized_text: str) -> str:
    # Model revision is implicit for BAAI/bge-m3 default, we bake it into the hash
    return hashlib.sha256(f"bge-m3-v1:{normalized_text}".encode("utf-8")).hexdigest()

def get_embeddings(texts: List[str]) -> np.ndarray:
    if not texts:
        return np.array([])
    model = get_model()
    # Generate dense normalized embeddings for cosine similarity
    return model.encode(texts, normalize_embeddings=True, show_progress_bar=False)

def compute_similarity(emb1: np.ndarray, emb2: np.ndarray) -> float:
    if emb1.size == 0 or emb2.size == 0:
        return 0.0
    return float(np.dot(emb1, emb2))
