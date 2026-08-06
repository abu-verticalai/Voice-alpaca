# Voice System — Backend Architecture

Version: 1.0  
Status: Frozen architecture baseline  
Backend framework: FastAPI  
Language: Python

---

## 1. Backend Objective

The backend stores complete Voice Agents, prepares semantic matching data and audio after Save, and runs deterministic Web Calls.

The backend must remain small and readable.

Version 1 must not use:

- Microservices
- Event bus
- Kafka
- Celery
- CQRS
- DDD layers
- Vector database
- Document RAG
- Runtime LLM

---

## 2. Technology Stack

```text
Frontend:
React + Vite + TypeScript + custom CSS

Backend:
FastAPI + Python

Storage:
One versioned JSON document per Agent

STT:
Sarvam AI Saaras v3

TTS:
Sarvam AI Bulbul v3

Embeddings:
BAAI/bge-m3 dense embeddings

Similarity:
Cosine similarity

Runtime:
Half-duplex Web Call

Runtime LLM:
None

Document RAG:
None
```

---

## 3. What Each Technology Does

### FastAPI

Purpose:

- Expose Agent APIs
- Expose call APIs
- Validate requests
- Run WebSocket call sessions

### JSON Storage

Purpose:

- Store one complete Agent document
- Keep the project simple for Version 1
- Support local development without a database

### Sarvam STT

Purpose:

```text
Customer Audio
→ Sarvam STT
→ Transcript
```

STT does not select the Intent.

It only returns text.

Initial model:

```text
saaras:v3
```

STT mode must be selected through testing:

- Tamil: begin with `transcribe`
- English: `transcribe`
- Tanglish: compare `codemix` and `translit`

### BGE-M3

Purpose:

```text
Customer Transcript
→ BGE-M3 embedding
→ Compare with Example Phrase embeddings
→ Similarity score
→ Matched Intent
```

Model:

```text
BAAI/bge-m3
```

Version 1 uses only:

- Dense embeddings
- Normalized vectors
- Cosine similarity

### Sarvam TTS

Purpose:

```text
Saved Fixed Agent Response
→ Sarvam TTS
→ WAV audio
```

Initial model:

```text
bulbul:v3
```

TTS is also used for dynamic variable values during call startup or first use.

---

## 4. Important Terminology

This product does not use document RAG.

It uses:

```text
Current-Conversation Semantic Intent Retrieval
```

Search data:

- Intent Example Phrases

Search scope:

- Current Conversation only

The backend must not create:

- Document loaders
- Text chunking
- Knowledge Base
- Vector database
- Reranking pipeline

---

## 5. Simple Backend Structure

```text
backend/
├── app/
│   ├── main.py
│   ├── api.py
│   ├── models.py
│   ├── settings.py
│   ├── storage.py
│   ├── service.py
│   ├── validation.py
│   ├── variables.py
│   ├── normalizer.py
│   ├── embeddings.py
│   ├── matcher.py
│   ├── stt.py
│   ├── tts.py
│   ├── audio.py
│   └── runtime.py
├── data/
│   ├── agents/
│   └── active/
├── audio/
│   ├── fixed/
│   ├── dynamic_cache/
│   └── temp/
├── tests/
└── requirements.txt
```

Responsibilities:

- `main.py` — create FastAPI app and register routes
- `api.py` — HTTP and WebSocket endpoints
- `models.py` — Pydantic models
- `settings.py` — environment configuration
- `storage.py` — JSON read/write and atomic activation
- `service.py` — Agent Save and load orchestration
- `validation.py` — business validation
- `variables.py` — parse and resolve `{{variables}}`
- `normalizer.py` — normalize matching text
- `embeddings.py` — BGE-M3 adapter and cache
- `matcher.py` — exact and semantic Intent matching
- `stt.py` — Sarvam STT adapter
- `tts.py` — Sarvam TTS adapter
- `audio.py` — segmentation, WAV validation, and manifests
- `runtime.py` — call state and progression

Do not split these into more modules until real repetition requires it.

---

## 6. Configuration

Backend-only environment variables:

```text
SARVAM_API_KEY
SARVAM_STT_MODEL=saaras:v3
SARVAM_TTS_MODEL=bulbul:v3
SARVAM_TTS_SPEAKER
SARVAM_TTS_PACE=1.0
SARVAM_TTS_TEMPERATURE=0.3
SARVAM_PRONUNCIATION_DICT_ID
EMBEDDING_MODEL=BAAI/bge-m3
EMBEDDING_DEVICE=cpu
MATCH_ACCEPTANCE_THRESHOLD=0.80
MATCH_CLARIFICATION_THRESHOLD=0.60
MATCH_MINIMUM_MARGIN=0.08
MAX_FAILED_ATTEMPTS=2
```

Rules:

- Never expose the Sarvam API key to the browser.
- Never commit `.env`.
- Provide `.env.example` with placeholders only.
- Validate an integration setting only when that integration is used.

In Version 1, all Sarvam STT settings, Sarvam TTS settings, speaker selection, model selection, and matching thresholds are global backend environment settings. They are not stored per-Agent in the Agent JSON. All Agents use the same provider configuration.

---

## 7. Agent Data Model

Store one complete versioned Agent document.

```json
{
  "id": "agent-001",
  "version": 1,
  "name": "DFL Collection",
  "language": "Tamil",
  "status": "ready",
  "greeting": {
    "id": "greeting-001",
    "script": "Hello {{callee_name}}, this is Mira calling from DFL.",
    "audio_manifest_id": "audio-greeting-001"
  },
  "conversations": [
    {
      "id": "conversation-001",
      "position": 1,
      "heading": "Disbursement Pitch",
      "intents": [
        {
          "id": "intent-001",
          "name": "Interested",
          "example_phrases": [
            {
              "id": "phrase-001",
              "text": "Yes, tell me more"
            },
            {
              "id": "phrase-002",
              "text": "I am interested"
            }
          ],
          "fixed_response": "Great {{callee_name}}, your eligible amount is {{loan_amount}}.",
          "audio_manifest_id": "audio-response-001"
        }
      ]
    }
  ],
  "closing": {
    "id": "closing-001",
    "script": "Thank you {{callee_name}}. Have a wonderful day.",
    "audio_manifest_id": "audio-closing-001"
  },
  "dynamic_variables": {
    "callee_name": "Abu",
    "loan_amount": "500000"
  },
  "fallbacks": {
    "clarify_script": "Sorry, I could not understand that. Could you please repeat?",
    "failure_script": "I am unable to understand the response. I will end the call for now.",
    "max_failed_attempts": 2
  }
}
```

Stable IDs are required for:

- Agent
- Greeting
- Conversation
- Intent
- Example Phrase
- Closing
- Audio Manifest

---

## 8. Storage Model

Recommended paths:

```text
backend/data/agents/{agent_id}/v1.json
backend/data/agents/{agent_id}/v2.json
backend/data/active/{agent_id}.json
```

`active/{agent_id}.json` stores the active version number.

Example:

```json
{
  "active_version": 2
}
```

Version 1 assumes a single local user.

Concurrent multi-user editing is out of scope.

Use a per-Agent process lock during Save to prevent two saves from writing the same Agent simultaneously.

---

## 9. Atomic Save Rule

Never overwrite the active Agent before preparation succeeds.

Save creates a candidate version.

Candidate becomes active only after:

- Validation succeeds
- Candidate JSON is written
- Embeddings are ready
- Fixed audio is ready
- WAV files are valid
- Audio manifests are complete

If anything fails:

- Keep previous active version
- Preserve the user's frontend draft
- Return a structured error
- Keep Test Web Call disabled for the candidate
- Clean or quarantine temporary candidate files

---

## 10. Validation Rules

Validate before preparation:

### Agent

- Name required
- Language required

### Greeting

- Script required
- Variable syntax valid

### Conversation

- Heading required
- At least one Intent

### Intent

- Name required
- At least one non-empty Example Phrase
- Fixed Agent Response required
- Variable syntax valid

### Closing

- Script required
- Variable syntax valid

### Dynamic Variables

- Every required variable has a Test Value before Test Web Call
- Variable name is valid

---

## 11. Dynamic Variable Parser

Application syntax:

```text
{{variable_name}}
```

The parser converts a script into typed segments.

Example:

```text
Hello {{callee_name}}, your amount is {{loan_amount}}.
```

Result:

```json
[
  {
    "type": "fixed",
    "text": "Hello "
  },
  {
    "type": "variable",
    "name": "callee_name"
  },
  {
    "type": "fixed",
    "text": ", your amount is "
  },
  {
    "type": "variable",
    "name": "loan_amount"
  },
  {
    "type": "fixed",
    "text": "."
  }
]
```

Rules:

- Do not pass `{{variable}}` tags directly to TTS.
- Do not support SSML in Version 1.
- Resolve variables before dynamic TTS.
- Missing required values block call startup.

---

## 12. Pronunciation Management

Use Sarvam pronunciation dictionaries for:

- Business names
- Product names
- EMI
- NBFC
- KYC
- Place names
- Branch names
- Industry acronyms

TTS configuration must include:

- Language code
- Speaker
- Pace
- Temperature
- Pronunciation dictionary ID

Speaker selection is performed in the audio phase after listening tests.

---

## 13. Text Normalization

Normalization is used only for matching.

Do not alter displayed text.

Matching normalization:

1. Unicode normalize.
2. Trim.
3. Collapse repeated whitespace.
4. Lowercase English characters.
5. Preserve Tamil characters.
6. Preserve Tanglish spellings.
7. Remove a narrow set of outer punctuation.
8. Do not translate.

Store original Example Phrase text.

The normalized form may be computed and cached separately.

---

## 14. Embedding Preparation

Embedding model:

```text
BAAI/bge-m3
```

Version 1 rules:

- Dense embeddings only
- Local model
- Normalized vectors
- Cosine similarity
- No vector database

On Save:

1. Collect all Example Phrases.
2. Normalize each phrase.
3. Compute a content hash.
4. Reuse unchanged embeddings.
5. Generate embeddings for new or changed phrases.
6. Group embeddings by Conversation.
7. Keep embedding metadata outside the Agent JSON.

Embedding cache key:

```text
model_revision + normalized_phrase_hash
```

---

## 15. Embedding Evaluation

BGE-M3 is the initial model, not an untested permanent decision.

Before production matching thresholds are frozen, build an evaluation dataset containing:

- Tamil
- English
- Tanglish
- Transliteration variants
- Spelling differences
- Short responses
- Negative responses
- Callback phrases
- Ambiguous phrases
- Sarvam STT errors
- Background-noise errors

Measure:

- Intent accuracy
- Recall at rank 1
- False accept rate
- No-match rate
- Ambiguity rate
- CPU latency

Development can begin before this dataset is complete.

Production threshold tuning cannot.

---

## 16. Exact and Semantic Matching

Search scope:

```text
Current Conversation only
```

Matching order:

1. Normalize customer transcript.
2. Compare exact normalized phrases.
3. If one exact match exists, accept it.
4. If exact matches point to multiple Intents, return ambiguous.
5. If no exact match, create transcript embedding.
6. Compare with all Example Phrase embeddings in current Conversation.
7. Keep the highest phrase score for each Intent.
8. Rank Intents.
9. Apply acceptance threshold.
10. Apply top-two margin.
11. Return a decision.

Output:

```json
{
  "decision": "accept",
  "intent_id": "intent-001",
  "top_score": 0.91,
  "second_score": 0.42,
  "margin": 0.49
}
```

Normal UI must not show these scores.

---

## 17. Threshold Policy

Development starting values:

```text
Acceptance threshold: 0.80
Clarification threshold: 0.60
Minimum top-two margin: 0.08
```

Decision logic:

### Accept

```text
Top score >= acceptance threshold
AND
margin >= minimum margin
```

### Clarify

```text
Top score >= clarification threshold
AND
top score < acceptance threshold
```

### Ambiguous

```text
Top score >= acceptance threshold
AND
margin < minimum margin
```

### No Match

```text
Top score < clarification threshold
```

These are configuration values.

Tune them using the evaluation dataset.

---

## 18. Fallback Behavior

The system must never guess.

All non-accepted matching outcomes use the same user-facing behavior:

- Clarify, Ambiguous, and No Match all play the clarification script.
- Remain in the current Conversation.
- Increment failed_attempts.

After `MAX_FAILED_ATTEMPTS`, play the failure script and move to Closing.

Version 1 fallback scripts are backend defaults and are not editable through the UI:

- Clarification: "Sorry, I could not understand that. Could you please repeat?"
- Failure: "I am unable to understand the response. I will end the call for now."

---

## 19. TTS and Audio Preparation

Model:

```text
Sarvam Bulbul v3
```

After Save:

- Generate Greeting fixed audio
- Generate every Fixed Agent Response's fixed segments
- Generate Closing fixed audio
- Generate fallback fixed audio
- Validate all generated WAV files
- Save audio manifests

No manual Generate, Preview, Approve, or Regenerate UI.

---

## 20. Fixed and Dynamic Audio

### Script without variables

```text
Thank you for your time.
```

Generate one complete cached WAV after Save.

### Script with variables

```text
Hello {{callee_name}}, your amount is {{loan_amount}}.
```

Split into:

```text
"Hello "                      → cached fixed WAV
{{callee_name}}               → dynamic TTS
", your amount is "           → cached fixed WAV
{{loan_amount}}               → dynamic TTS
"."                           → cached fixed WAV
```

Dynamic values are generated:

- At call startup when values are known, or
- On first use

Dynamic value audio may be cached.

---

## 21. Audio Cache Key

Use:

```text
provider
+ model
+ language
+ speaker
+ pace
+ temperature
+ pronunciation_dictionary
+ normalized_text
```

This prevents the same audio from being regenerated unnecessarily.

---

## 22. Audio Manifest

Every speakable script owns a manifest.

Example:

```json
{
  "id": "audio-response-001",
  "segments": [
    {
      "type": "fixed_audio",
      "path": "audio/fixed/agent-001/v2/a.wav"
    },
    {
      "type": "variable",
      "name": "callee_name"
    },
    {
      "type": "fixed_audio",
      "path": "audio/fixed/agent-001/v2/b.wav"
    }
  ]
}
```

Runtime follows this segment order.

---

## 23. Audio Format

Choose one internal playback format.

Recommended initial format:

```text
WAV
Mono
16-bit PCM
Single configured sample rate
```

Do not concatenate raw WAV files by appending bytes.

Either:

- Play segments sequentially through the browser audio queue, or
- Decode PCM, align sample rates, and create a new correct WAV header

For Version 1, sequential segment playback is simpler.

---

## 24. Sarvam STT

Initial model:

```text
saaras:v3
```

Provider interface must return a provider-neutral result.

Example:

```json
{
  "transcript": "call me tomorrow",
  "language_code": "en-IN",
  "is_final": true
}
```

STT mode selection:

- Tamil: start with `transcribe`
- English: `transcribe`
- Tanglish: test `codemix` and `translit`

Do not freeze one Tanglish mode before testing real audio.

---

## 25. Web Call Mode

Version 1 begins as half-duplex.

States:

```text
Connecting
Speaking
Listening
Processing
Speaking
Closing
Ended
Error
```

Half-duplex rule:

- While Agent audio is playing, customer capture is paused or ignored.
- After playback finishes, state changes to Listening.

Barge-in and full-duplex are later enhancements.

---

## 26. Call Session State

Each active call contains:

```json
{
  "call_id": "call-001",
  "agent_id": "agent-001",
  "agent_version": 2,
  "current_conversation_position": 1,
  "failed_attempts": 0,
  "status": "listening",
  "dynamic_values": {
    "callee_name": "Abu",
    "loan_amount": "500000"
  }
}
```

The Agent version is pinned for the complete call.

Saving a new Agent version must not change an active call.

---

## 27. Web Call Runtime

```text
Start Web Call
→ Load active Agent version
→ Validate Dynamic Variable values
→ Create Call Session
→ Prepare dynamic audio values
→ Play Greeting
→ Switch to Listening
→ Send customer audio to Sarvam STT
→ Receive final transcript
→ Normalize transcript
→ Load current Conversation
→ Exact or BGE-M3 matching
→ Threshold and margin decision
→ Select Intent or fallback
→ Resolve Fixed Agent Response variables
→ Play cached fixed audio and dynamic audio
→ Advance by Conversation position after accepted match
→ Stay in current Conversation after clarification
→ Repeat
→ Play Closing
→ End Call
```

No runtime LLM.

---

## 28. API Contracts

### Create Agent

```text
POST /api/agents
```

Request:

```json
{
  "name": "Agent Name",
  "language": "Tamil"
}
```

Response:

A minimal Agent skeleton containing:

- Generated Agent ID
- Name and language
- Version 1
- Empty Greeting with generated ID
- One blank Conversation with one blank Intent
- Empty Closing with generated ID
- Empty dynamic_variables
- Default fallback scripts
- Status draft

The full Save pipeline runs only on `PUT /api/agents/{agent_id}`.

### List Agents

```text
GET /api/agents
```

### Get Agent

```text
GET /api/agents/{agent_id}
```

### Save Complete Agent

```text
PUT /api/agents/{agent_id}
```

### Delete Agent

```text
DELETE /api/agents/{agent_id}
```

### Start Call

```text
POST /api/agents/{agent_id}/calls
```

### Web Call Stream

```text
WebSocket /api/calls/{call_id}/stream
```

### End Call

```text
DELETE /api/calls/{call_id}
```

No separate CRUD endpoints for Intent or Conversation in Version 1.

Frontend saves the complete Agent document.

---

## 29. Save Pipeline

```text
Receive complete Agent draft
→ Schema validation
→ Business validation
→ Dynamic variable validation
→ Assign stable IDs
→ Create candidate version
→ Write temporary candidate JSON
→ Generate or reuse Example Phrase embeddings
→ Parse all speakable scripts
→ Generate or reuse fixed WAV segments
→ Validate WAV files
→ Write audio manifests
→ Atomically save candidate JSON
→ Atomically activate candidate version
→ Return Ready
```

If anything fails:

```text
Do not activate candidate
Keep previous version active
Preserve frontend draft
Return exact error
Keep Test Web Call disabled
```

---

## 30. Structured Errors

Example:

```json
{
  "error": {
    "code": "AUDIO_PREPARATION_FAILED",
    "message": "The Agent could not be prepared for testing.",
    "field": null,
    "retryable": true
  }
}
```

Required error categories:

- Validation error
- Malformed variable
- Embedding preparation failed
- Audio preparation failed
- Sarvam authentication failed
- Sarvam rate limited
- STT unavailable
- TTS unavailable
- Missing dynamic value
- Call session failed

---

## 31. Logging

Log:

- Request ID
- Call ID
- Agent ID
- Agent version
- Conversation ID
- Matched Intent ID
- STT latency
- Matching latency
- TTS latency
- Playback duration
- Error code

Do not log:

- API keys
- Raw audio by default
- Sensitive variable values
- Full unrestricted customer transcripts

---

## 32. Testing Strategy

### Unit tests

- Agent validation
- Variable parser
- Text normalization
- Exact matching
- Cosine ranking
- Threshold boundaries
- Margin boundaries
- Audio segment parser
- Audio cache key
- Version activation

### Integration tests

- Agent JSON save/load
- Candidate rollback
- Mocked Sarvam STT
- Mocked Sarvam TTS
- Mocked BGE-M3 adapter
- Matching pipeline
- Call progression

### Evaluation tests

- Tamil
- English
- Tanglish
- Transliteration
- Spelling errors
- Short answers
- Ambiguous phrases
- STT errors
- Background noise errors

### End-to-end test

```text
Create Agent
→ Save
→ Prepare embeddings and audio
→ Start Web Call
→ Greeting
→ Customer response
→ Matched Intent
→ Fixed response
→ Next Conversation
→ Closing
→ End Call
```

---

## 33. Backend Completion Rule

Do not implement the complete backend in one prompt.

Build in this order:

```text
Agent JSON persistence
→ Validation and variables
→ Exact matching
→ BGE-M3 matching
→ Sarvam TTS audio preparation
→ Sarvam STT
→ Web Call runtime
```

Each stage must pass tests before the next stage starts.

---

# End of Document
