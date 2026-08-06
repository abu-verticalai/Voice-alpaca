import re
from typing import Dict, Any, Tuple, Set
from .models import AgentModel

class ValidationException(Exception):
    def __init__(self, errors: Dict[str, Any]):
        self.errors = errors

def has_malformed_variables(text: str) -> bool:
    if not text:
        return False
    # Check mismatched {{ or }}
    open_count = text.count("{{")
    close_count = text.count("}}")
    if open_count != close_count:
        return True
    
    # Also check if any single { or } exists outside of {{ }}
    # This is a bit strict, but the requirement specifically calls out {name}} and {{name}
    # which are caught by the count above. 
    # What about { } ? It has open_count=0, close_count=0, so it will pass the first check.
    # The frontend only checks the inner content if {{ }} is present.
    # We will enforce that any {{something}} must strictly match our regex.
    matches = re.findall(r'\{\{(.*?)\}\}', text)
    for match in matches:
        if not re.match(r'^[a-z_][a-z0-9_]*$', match):
            return True
            
    # Also detect `{name}` which doesn't use `{{` or `}}` but looks like a variable
    # If the user has `{name}`, it's malformed according to the example `{name}}` but that has a `}}`.
    # Let's keep it aligned with the frontend's logic for simplicity: if open != close, error. 
    # If inner of {{ }} is invalid, error.
    return False

def extract_variables(text: str) -> Set[str]:
    if not text:
        return set()
    matches = re.findall(r'\{\{([a-z_][a-z0-9_]*)\}\}', text)
    return set(matches)

def validate_agent(agent: AgentModel) -> Tuple[Dict[str, Any], Set[str]]:
    errors = {}
    extracted_vars = set()
    
    if not agent.name.strip():
        errors["name"] = "Name required"
    if not agent.language.strip():
        errors["language"] = "Language required"
        
    greeting_script = agent.greeting.script if agent.greeting else ""
    if not greeting_script.strip():
        errors["greeting"] = "Script required"
    elif has_malformed_variables(greeting_script):
        errors["greeting"] = "Malformed variable syntax"
    else:
        extracted_vars.update(extract_variables(greeting_script))
        
    closing_script = agent.closing.script if agent.closing else ""
    if not closing_script.strip():
        errors["closing"] = "Script required"
    elif has_malformed_variables(closing_script):
        errors["closing"] = "Malformed variable syntax"
    else:
        extracted_vars.update(extract_variables(closing_script))
        
    for conv in agent.conversations:
        conv_errors = {}
        if not conv.heading.strip():
            conv_errors["heading"] = "Heading required"
        if not conv.intents:
            conv_errors["intents"] = "At least one Intent required"
            
        intent_errors = {}
        for intent in conv.intents:
            i_err = {}
            if not intent.name.strip():
                i_err["name"] = "Name required"
                
            valid_phrases = [p for p in intent.example_phrases if p.text.strip()]
            if not valid_phrases:
                i_err["phrases"] = "At least one non-empty Example Phrase required"
                
            if not intent.fixed_response.strip():
                i_err["response"] = "Fixed Agent Response required"
            elif has_malformed_variables(intent.fixed_response):
                i_err["response"] = "Malformed variable syntax"
            else:
                extracted_vars.update(extract_variables(intent.fixed_response))
                
            if i_err:
                intent_errors[intent.id] = i_err
                
        if intent_errors:
            conv_errors["intentErrors"] = intent_errors
            
        if conv_errors:
            errors[conv.id] = conv_errors
            
    return errors, extracted_vars

def sync_dynamic_variables(agent: AgentModel, extracted_vars: Set[str]):
    new_dynamic_vars = {}
    for var in extracted_vars:
        # Preserve existing test values
        new_dynamic_vars[var] = agent.dynamic_variables.get(var, "")
    agent.dynamic_variables = new_dynamic_vars
