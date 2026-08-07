import os
from app import settings

def test_storage_isolation(client):
    # Verify that the test-created Agents exist only in temporary storage
    # and production storage remains unchanged.
    
    # Check that settings points to a temp dir
    assert "pytest" in settings.DATA_DIR or "tmp" in settings.DATA_DIR.lower() or "temp" in settings.DATA_DIR.lower()
    
    # GET /api/agents should start empty inside isolated tests
    response = client.get("/api/agents")
    assert response.status_code == 200
    assert response.json() == []
    
    # Create an agent
    payload = {
        "name": "Isolation Test Agent",
        "language": "English",
        "voice": {"speaker": "priya"},
        "greeting": {"script": "Hello"},
        "conversations": [{"heading": "Conv1", "intents": [{
            "name": "Intent1",
            "example_phrases": [{"text": "Hi"}],
            "fixed_response": "Hello"
        }]}],
        "closing": {"script": "Bye"}
    }
    create_res = client.post("/api/agents", json=payload)
    assert create_res.status_code == 200
    agent_id = create_res.json()["id"]
    
    # Ensure it's in the temporary directory
    temp_agent_dir = os.path.join(settings.AGENTS_DIR, agent_id)
    assert os.path.exists(temp_agent_dir)
    
    # Ensure production directory is completely untouched (the test framework doesn't write to real data/agents)
    real_data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
    if os.path.exists(real_data_dir):
        real_agents_dir = os.path.join(real_data_dir, "agents")
        if os.path.exists(real_agents_dir):
            assert not os.path.exists(os.path.join(real_agents_dir, agent_id))
