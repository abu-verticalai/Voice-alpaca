import pytest
from app.variables import has_malformed_variables, extract_variables, validate_agent, sync_dynamic_variables
from app.models import AgentModel, ConversationModel, IntentModel, ExamplePhraseModel, GreetingModel, ClosingModel

def test_has_malformed_variables():
    assert not has_malformed_variables("Hello {{name}}")
    assert not has_malformed_variables("Hello {{first_name}} and {{last_name_123}}")
    
    assert has_malformed_variables("Hello {{name}")
    assert has_malformed_variables("Hello {name}}")
    assert has_malformed_variables("Hello {{ }}")
    assert has_malformed_variables("Hello {{123name}}")
    assert has_malformed_variables("Hello {{name_!}}")

def test_extract_variables():
    assert extract_variables("Hello {{name}}") == {"name"}
    assert extract_variables("Hello {{first_name}} and {{last_name}}") == {"first_name", "last_name"}
    assert extract_variables("Duplicate {{name}} and {{name}}") == {"name"}
    assert extract_variables("No variables here") == set()

def test_validate_agent_success():
    agent = AgentModel(
        name="Test",
        language="English",
        greeting=GreetingModel(script="Hello {{name}}"),
        conversations=[
            ConversationModel(
                heading="Conv",
                intents=[
                    IntentModel(
                        name="Intent",
                        example_phrases=[ExamplePhraseModel(text="hi")],
                        fixed_response="Hi {{name}}"
                    )
                ]
            )
        ],
        closing=ClosingModel(script="Bye {{name}}")
    )
    errors, extracted = validate_agent(agent)
    assert not errors
    assert extracted == {"name"}

def test_validate_agent_errors():
    agent = AgentModel(
        name="",
        language="",
        greeting=GreetingModel(script="{{name}"),
        conversations=[
            ConversationModel(
                heading="",
                intents=[
                    IntentModel(
                        name="",
                        example_phrases=[ExamplePhraseModel(text="")],
                        fixed_response="{{123invalid}}"
                    )
                ]
            )
        ],
        closing=ClosingModel(script="Bye") # No errors in closing
    )
    errors, extracted = validate_agent(agent)
    
    assert "name" in errors
    assert "language" in errors
    assert errors["greeting"] == "Malformed variable syntax"
    
    conv_id = agent.conversations[0].id
    assert errors[conv_id]["heading"] == "Heading required"
    
    intent_id = agent.conversations[0].intents[0].id
    intent_errs = errors[conv_id]["intentErrors"][intent_id]
    assert intent_errs["name"] == "Name required"
    assert intent_errs["phrases"] == "At least one non-empty Example Phrase required"
    assert intent_errs["response"] == "Malformed variable syntax"

def test_sync_dynamic_variables():
    agent = AgentModel(
        name="Test",
        language="English",
        dynamic_variables={"old_var": "val1", "keep_var": "val2"}
    )
    sync_dynamic_variables(agent, {"keep_var", "new_var"})
    
    assert "old_var" not in agent.dynamic_variables
    assert agent.dynamic_variables["keep_var"] == "val2"
    assert agent.dynamic_variables["new_var"] == ""
