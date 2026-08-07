import os
import sys
import pytest

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def test_update_agent(client):
    payload = {
        "name": "Agent Update",
        "language": "Tamil",
        "voice": {"speaker": "priya"},
        "greeting": {"script": "Hello"},
        "closing": {"script": "Bye"},
        "conversations": [{"heading": "Conv1", "intents": [{
            "name": "Intent1",
            "example_phrases": [{"text": "Hi"}],
            "fixed_response": "Hello"
        }]}],
        "dynamic_variables": {},
        "fallbacks": {}
    }
    create_res = client.post("/api/agents", json=payload)
    agent_id = create_res.json()["id"]

    # Update
    payload["name"] = "Agent Updated"
    update_res = client.put(f"/api/agents/{agent_id}", json=payload)
    assert update_res.status_code == 200
    data = update_res.json()
    assert data["id"] == agent_id
    assert data["version"] == 2
    assert data["name"] == "Agent Updated"

def test_create_and_get_agent(client):
    payload = {
        "name": "Test Agent",
        "language": "English",
        "voice": {"speaker": "priya"},
        "greeting": {"script": "Hello"},
        "closing": {"script": "Bye"},
        "conversations": [{"heading": "Conv1", "intents": [{
            "name": "Intent1",
            "example_phrases": [{"text": "Hi"}],
            "fixed_response": "Hello"
        }]}],
        "dynamic_variables": {},
        "fallbacks": {}
    }
    
    # Create
    response = client.post("/api/agents", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["id"].startswith("agent-")
    assert data["version"] == 1
    assert data["name"] == "Test Agent"
    
    agent_id = data["id"]
    
    # Get
    response = client.get(f"/api/agents/{agent_id}")
    assert response.status_code == 200
    assert response.json()["id"] == agent_id

    # List
    response = client.get("/api/agents")
    assert response.status_code == 200
    assert len(response.json()) >= 1
    
    # Update
    data["name"] = "Updated Agent"
    response = client.put(f"/api/agents/{agent_id}", json=data)
    assert response.status_code == 200
    updated_data = response.json()
    assert updated_data["version"] == 2
    assert updated_data["name"] == "Updated Agent"
    
    # Delete
    response = client.delete(f"/api/agents/{agent_id}")
    assert response.status_code == 200
    
    response = client.get(f"/api/agents/{agent_id}")
    assert response.status_code == 404

def test_voice_catalog(client):
    for lang in ["Tamil", "English", "Tanglish"]:
        response = client.get(f"/api/voices?language={lang}")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 14
        
        assert data[0]["name"].startswith("Priya")
        assert data[1]["name"].startswith("Ishita")
        assert data[2]["name"] == "Neha"
        assert data[3]["name"] == "Ritu"
        
        values = [v["value"] for v in data]
        assert "ratan" not in values
        assert "rohan" not in values
        assert "priya" in values
        assert "ishita" in values
