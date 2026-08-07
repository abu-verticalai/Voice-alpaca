import pytest
import os
from unittest import mock

@pytest.fixture(autouse=True)
def isolated_storage(tmp_path):
    data_dir = tmp_path / "data"
    agents_dir = data_dir / "agents"
    active_dir = data_dir / "active"
    embeddings_dir = data_dir / "embeddings"
    
    agents_dir.mkdir(parents=True)
    active_dir.mkdir(parents=True)
    embeddings_dir.mkdir(parents=True)
    
    with mock.patch("app.settings.DATA_DIR", str(data_dir)), \
         mock.patch("app.settings.AGENTS_DIR", str(agents_dir)), \
         mock.patch("app.settings.ACTIVE_DIR", str(active_dir)), \
         mock.patch("app.settings.EMBEDDINGS_DIR", str(embeddings_dir)), \
         mock.patch("app.settings.SARVAM_API_KEY", None):
        yield

@pytest.fixture
def client(isolated_storage):
    # Import app after patching so TestClient uses the mocked settings
    from app.main import app
    from fastapi.testclient import TestClient
    return TestClient(app)
