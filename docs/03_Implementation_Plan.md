# Voice System — Implementation Plan

Version: 1.0  
Status: Approved implementation order

---

## 1. Implementation Rule

Build one phase at a time.

Every phase follows:

```text
Implement
→ Run focused tests
→ Run full relevant tests
→ Open browser or run real local use case
→ Review manually
→ Fix only that phase
→ Approve
→ Commit
→ Start next phase
```

Do not ask a coding CLI to build the complete product in one prompt.

Do not allow frontend and backend coding tools to edit the same files simultaneously.

---

## 2. Project Structure

```text
Voice-System/
├── docs/
│   ├── 01_Product_UI_UX.md
│   ├── 02_Backend_Architecture.md
│   └── 03_Implementation_Plan.md
├── frontend/
└── backend/
```

---

## 3. Tool Responsibility

Recommended:

```text
Frontend:
Claude Code, Cursor with Claude, or Agy

Backend:
Codex CLI or GPT coding CLI
```

Rules:

- Use one tool at a time.
- The tool must read all three documents first.
- The tool must implement only the requested phase.
- The tool must not commit without approval.
- The tool must report changed files and test results.

---

## 4. Phase 1 — Static Approved Frontend

### Goal

Build the complete approved single-page UI using local React state only.

### Build

- Initial Create Agent state
- Existing Agents dropdown
- + New Agent
- Language selector
- Save Agent
- Test Web Call
- Greeting
- Conversation sections
- Intent rows
- Mandatory Example Phrases
- Fixed Agent Responses
- Add Intent
- Delete Intent
- Add Next Conversation
- Delete Conversation
- Closing
- End Call
- Dynamic Variables
- Unsaved status
- Save status
- Test Web Call dialog

### Do not build

- Backend
- API calls
- JSON files
- Embeddings
- STT
- TTS
- Audio generation
- Real Web Call
- Authentication
- Dashboard

### State

Use React state only.

No Redux, Zustand, or other state library.

Phase 1 Save validates the draft locally and marks the Agent as saved in React state. It does not call a backend API. Agents are not persisted to disk and are lost on page refresh. Backend persistence begins in Phase 2.

Use temporary local keys (such as incrementing numbers) for Agents, Conversations, Intents, and Example Phrases in Phase 1. The backend assigns stable IDs when persistence begins in Phase 2.

### Required tests

- Initial empty state
- Create Agent
- Existing Agent dropdown
- Create another Agent
- Switch Agent
- Add/Delete Intent
- Add/Delete Conversation
- Dynamic variable extraction
- Save enables Test Web Call
- Editing disables Test Web Call
- No Next Step dropdown
- No preview panel
- No audio controls

### Completion gate

Browser journey:

```text
Create Agent
→ Builder opens
→ Edit Greeting
→ Edit Intents
→ Add Intent
→ Add Conversation
→ Detect variable
→ Save
→ Test Web Call enabled
→ Create second Agent
→ Switch Agents
```

---

## 5. Phase 2 — Backend Foundation and Persistence

### Goal

Save and load complete Agents through FastAPI and JSON storage.

### Create backend

```text
backend/
├── app/
│   ├── main.py
│   ├── api.py
│   ├── models.py
│   ├── settings.py
│   ├── storage.py
│   ├── service.py
│   └── validation.py
├── data/
│   ├── agents/
│   └── active/
├── tests/
└── requirements.txt
```

### Build

- FastAPI app
- CORS for local frontend
- Pydantic Agent models
- Stable ID generation
- Agent create
- Agent list
- Agent get
- Agent complete save
- Agent delete
- Version number
- Candidate JSON
- Active version pointer
- Per-Agent save lock
- Structured errors

### Frontend integration

Replace local Agent persistence with backend APIs.

The frontend still keeps an editable draft.

### Do not build

- Embeddings
- TTS
- STT
- Real Web Call

### Required tests

- Create Agent
- List Agents
- Get Agent
- Save complete Agent
- Delete Agent
- Version increment
- Candidate rollback
- Invalid Agent rejected
- Reload after backend restart

### Completion gate

```text
Create Agent
→ Save
→ Refresh browser
→ Agent still exists
→ Select Agent
→ Complete flow loads
→ Edit and Save
→ Restart backend
→ Agent still loads
```

---

## 6. Phase 3 — Validation and Dynamic Variables

### Goal

Implement final validation and template-variable behavior.

### Build

- `variables.py`
- Script parser
- Unique variable extraction
- Malformed variable detection
- Missing dynamic value detection
- Field-specific error responses
- Frontend field errors
- Dynamic Variable Test Values saved in Agent JSON

### Required tests

- Valid variables
- Invalid variables
- Duplicate variable removal
- Variable appears once
- Missing value blocks Test Web Call
- User text preserved after failure

### Completion gate

```text
Enter scripts with variables
→ Save
→ variables extracted
→ malformed syntax rejected
→ correct fields highlighted
→ valid Agent saved
```

---

## 7. Phase 4 — Semantic Intent Matching

### Goal

Match customer text to an Intent in the current Conversation.

### Build

- `normalizer.py`
- Exact phrase matching
- `embeddings.py`
- Local BGE-M3 loading
- Dense embeddings
- Embedding cache
- Cosine similarity
- Per-Conversation search
- Threshold
- Top-two margin
- Clarify
- Ambiguous
- No-match
- Fallback counter

### First implementation step

Build exact text matching before loading BGE-M3.

### Evaluation dataset

Prepare Tamil, English, and Tanglish examples while developing this phase.

### Required tests

- Exact match
- Current-Conversation isolation
- Correct semantic Intent
- Threshold boundary
- Margin boundary
- Ambiguous result
- No match
- Clarification
- Repeated failure
- CPU latency measurement

### Completion gate

Text test:

```text
Customer text
→ Correct Intent
→ Correct Fixed Agent Response
→ Correct next Conversation position
```

---

## 8. Phase 5 — Automatic Audio Preparation

### Goal

After Save Agent, prepare all fixed response audio automatically.

### Build

- `tts.py`
- Sarvam Bulbul v3 adapter
- Backend-only API key
- TTS settings
- Pronunciation dictionary configuration
- Script segmentation
- Fixed WAV generation
- Dynamic slot manifest
- WAV validation
- Fixed audio cache
- Dynamic audio cache key
- Audio manifest storage
- Save candidate activation only after audio succeeds

### Speaker decision

During this phase:

- Generate sample audio from available Sarvam voices.
- Listen to Tamil, English, and Tanglish scripts.
- Select approved speaker per language.

### Do not build

- Manual Generate button
- Manual Preview button
- Manual Approve button

### Required tests

- Fixed script audio
- Variable script segmentation
- Cache reuse
- Failed TTS rollback
- Invalid WAV rejection
- Manifest order
- Pronunciation configuration

### Completion gate

```text
Edit Agent
→ Save
→ Matching prepared
→ Fixed audio prepared
→ Agent Ready
→ Previous version remains active if audio fails
```

---

## 9. Phase 6 — Sarvam STT and Web Call

### Goal

Run a complete half-duplex browser Voice Call.

### Build

- `stt.py`
- Sarvam Saaras v3 adapter
- WebSocket call endpoint
- Call Session state
- Half-duplex state machine
- Microphone capture
- Greeting playback
- Listening state
- Final transcript handling
- Current-Conversation matching
- Fixed and dynamic audio playback
- Conversation progression
- Clarification retry
- Closing
- End Call
- Connection and provider errors

### STT mode decision

Test real audio:

- Tamil `transcribe`
- Tanglish `codemix`
- Tanglish `translit`
- English `transcribe`

Select mode based on matching accuracy, not preference.

### Required tests

- Call start
- Missing dynamic variable
- Greeting playback
- STT final transcript
- Correct matching
- Response playback
- Conversation progression
- Clarification stays in same Conversation
- Repeated failure moves to Closing
- End Call
- Provider disconnect
- Browser microphone denied

### Completion gate

```text
Start Web Call
→ Greeting
→ Customer speaks
→ Correct Intent matched
→ Correct response played
→ Next Conversation
→ Closing
→ End Call
```

---

## 10. Phase 7 — Hardening

### Goal

Make Version 1 reliable for repeated use.

### Build

- Retry policy
- Timeouts
- Provider rate-limit handling
- Structured logs
- Sensitive-data protection
- Performance measurements
- Cache cleanup
- Browser compatibility
- Accessibility fixes
- End-to-end regression tests

### Metrics

Measure:

- Save time
- Embedding preparation time
- Audio preparation time
- STT latency
- Matching latency
- Dynamic TTS latency
- End-to-end turn latency
- Intent accuracy
- False accept rate
- No-match rate

### Completion gate

- Full automated suite passes
- Manual browser journey passes
- Backend restart persistence passes
- No secret is tracked
- No failed candidate activates
- Voice Call completes repeatedly

---

## 11. Git Strategy

At the beginning:

```text
git init
```

For each phase:

1. Review `git status`.
2. Review `git diff`.
3. Run tests.
4. Run build.
5. Commit only after approval.

Recommended commits:

```text
feat(frontend): build static voice system UI
feat(backend): add agent persistence
feat(backend): add variable validation
feat(matching): add semantic intent retrieval
feat(audio): add automatic audio preparation
feat(runtime): add web call flow
test: add end-to-end regression coverage
```

---

## 12. Immediate Next Action

Start Phase 1 only.

The frontend coding tool must read:

```text
docs/01_Product_UI_UX.md
docs/02_Backend_Architecture.md
docs/03_Implementation_Plan.md
```

Then implement only:

```text
Phase 1 — Static Approved Frontend
```

Do not create backend code during Phase 1.

---

# End of Document
