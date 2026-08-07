from pydantic import BaseModel, Field
from typing import List, Dict, Optional

class VoiceModel(BaseModel):
    speaker: str

class ExamplePhraseModel(BaseModel):
    id: str = ""
    text: str

class IntentModel(BaseModel):
    id: str = ""
    name: str
    example_phrases: List[ExamplePhraseModel] = Field(default_factory=list)
    fixed_response: str
    audio_manifest_id: Optional[str] = None

class ConversationModel(BaseModel):
    id: str = ""
    position: int = 1
    heading: str
    intents: List[IntentModel] = Field(default_factory=list)

class GreetingModel(BaseModel):
    id: str = ""
    script: str
    audio_manifest_id: Optional[str] = None

class ClosingModel(BaseModel):
    id: str = ""
    script: str
    audio_manifest_id: Optional[str] = None

class FallbacksModel(BaseModel):
    clarify_script: str = "Sorry, I could not understand that. Could you please repeat?"
    failure_script: str = "I am unable to understand the response. I will end the call for now."
    max_failed_attempts: int = 2

class AgentModel(BaseModel):
    id: str = ""
    version: int = 1
    name: str
    language: str
    voice: Optional[VoiceModel] = None
    status: str = "draft"
    greeting: Optional[GreetingModel] = None
    conversations: List[ConversationModel] = Field(default_factory=list)
    closing: Optional[ClosingModel] = None
    dynamic_variables: Dict[str, str] = Field(default_factory=dict)
    fallbacks: FallbacksModel = Field(default_factory=FallbacksModel)

class MatchRequest(BaseModel):
    conversation_id: str
    text: str
    failed_attempts: int = 0
