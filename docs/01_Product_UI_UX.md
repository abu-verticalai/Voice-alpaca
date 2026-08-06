# Voice System — Product and UI/UX Specification

Version: 1.0  
Status: Frozen for Version 1 implementation  
Project: Voice System  
Product type: Deterministic Voice Agent Builder

---

## 1. Product Objective

Voice System allows a user to create, edit, save, and test a deterministic Voice Agent from one simple page.

The user defines:

- Agent name
- Agent language
- Greeting script
- Conversation headings
- Intents
- Example Phrases
- Fixed Agent Responses
- Closing script
- Dynamic Variables

During a Web Call, Voice System does not generate free-form responses using an LLM.

The runtime performs only this job:

1. Listen to the customer.
2. Convert speech to text.
3. Compare the transcript with Example Phrases in the current Conversation.
4. Select the best matching Intent.
5. Speak the saved Fixed Agent Response.
6. Continue to the next Conversation in the visible order.

---

## 2. Version 1 Scope

Version 1 includes:

- Create Agent
- Select existing Agent
- Create another Agent
- Edit Agent language
- Greeting
- Multiple linear Conversation sections
- Multiple Intents inside every normal Conversation
- Mandatory Example Phrases for every Intent
- Fixed Agent Response for every Intent
- Add Intent
- Edit Intent
- Delete Intent
- Add Next Conversation
- Edit Conversation
- Delete Conversation
- Closing
- End Call
- Dynamic Variables
- Save complete Agent
- Load saved Agent
- Test Web Call
- Sarvam STT integration
- BGE-M3 semantic intent matching
- Sarvam TTS integration
- Automatic audio preparation after Save

Version 1 does not include:

- Dashboard
- Analytics
- Campaign management
- CRM
- User roles
- Knowledge Base
- Document RAG
- Prompt playground
- Separate Script page
- Separate Intent page
- Separate Flow page
- Vector database
- Runtime LLM
- Manual audio approval
- Full-duplex interruption handling

---

## 3. Core Product Rule

The complete conversation is authored before the call.

The runtime never invents a response.

The runtime chooses only from saved Intents and saved Fixed Agent Responses.

```text
Customer Speech
→ Speech-to-Text
→ Current Conversation
→ Example Phrase Matching
→ Similarity Threshold
→ Matched Intent
→ Fixed Agent Response
→ Dynamic Variable Resolution
→ Audio Playback
→ Next Conversation
```

---

## 4. Complete User Journey

### First-time journey

```text
Open Voice System
→ Enter Agent Name
→ Select Language
→ Click Create Agent
→ Builder opens on the same page
→ Enter Greeting
→ Edit the first Conversation
→ Add Intents
→ Add Example Phrases
→ Add Fixed Agent Responses
→ Add more Conversations
→ Enter Closing
→ Enter Dynamic Variable values
→ Click Save Agent
→ Agent becomes Ready
→ Click Test Web Call
```

### Returning-user journey

```text
Open Voice System
→ Select a saved Agent from Existing Agents
→ Complete Agent loads on the same page
→ Edit
→ Save again
→ Test Web Call
```

### Create another Agent

```text
Click + New Agent
→ Enter Agent Name
→ Select Language
→ Create Agent
→ New Agent opens on the same page
→ New Agent appears in Existing Agents after Save
```

---

## 5. Single-Page Layout

Everything must remain on one page.

No sidebar.

No dashboard.

No separate builder screen.

Page order:

```text
Agent Controls
Greeting
Conversation 1
Conversation 2
Conversation 3
...
+ Add Next Conversation
Closing
End Call
Dynamic Variables
```

---

## 6. Initial Empty State

When no Agent exists, show only:

```text
Agent Name
[ Enter agent name ]

Language
[ Tamil ▼ ]

[ Create Agent ]
```

Rules:

- Do not show the complete builder before Agent creation.
- Do not show Existing Agents if there are no saved Agents.
- Do not show Save Agent.
- Do not show Test Web Call.

---

## 7. Created-Agent Top Row

After an Agent is created, show:

```text
Existing Agents
[ DFL Collection ▼ ]

[ + New Agent ]

Language
[ Tamil ▼ ]

[ Save Agent ] [ Test Web Call ]
```

Rules:

- Existing Agents contains only saved Agents.
- An unsaved Agent does not appear in the dropdown. It appears after Save succeeds.
- Create Agent must never appear inside the dropdown.
- + New Agent is a separate button.
- Selecting another Agent loads it on the same page.
- Test Web Call remains disabled until Save Agent succeeds.
- Any edit after Save disables Test Web Call again.

---

## 8. Greeting Section

Greeting is always the first spoken section.

It contains:

- Heading: Greeting
- Fixed Script textarea
- Edit action

Example:

```text
Greeting

Fixed Script
Hello {{callee_name}}, this is Mira calling regarding your loan.
```

Greeting does not contain:

- Intent
- Example Phrases
- Similarity matching
- Delete action
- Next Step dropdown

Greeting cannot be deleted.

---

## 9. Conversation Section

Every normal Conversation contains:

- Conversation number
- Editable Conversation Heading
- Delete Conversation
- One or more Intent rows
- + Add Intent

Example:

```text
Conversation 1

Heading
Disbursement Pitch
```

A Conversation represents one stage of the call.

The order shown on the page is the runtime order.

---

## 10. Intent Row

Every Intent row must contain:

- Intent Name
- Example Phrases
- Fixed Agent Response
- Edit
- Delete

Example:

```text
Intent Name
Interested

Example Phrases
Yes
Tell me more
I am interested
Please continue

Fixed Agent Response
Great {{callee_name}}, your eligible amount is {{loan_amount}}.
```

Example Phrases are mandatory.

They are the data used for exact and semantic matching.

The UI must not show:

- Embedding vectors
- Similarity scores
- Thresholds
- Audio file paths
- Provider names
- Runtime debug values

---

## 11. Row-Wise Desktop Layout

On desktop, each Intent should be displayed in one aligned business row.

Recommended columns:

```text
Intent Name | Example Phrases | Fixed Agent Response | Actions
```

Requirements:

- Compact spacing
- Clear borders
- No giant cards
- No full-page horizontal scroll
- On narrow screens, fields may stack vertically
- The page itself must never require horizontal scrolling

---

## 12. Add Intent

Clicking:

```text
+ Add Intent
```

must:

- Add one blank Intent inside the same Conversation
- Not open another page
- Focus Intent Name
- Include empty Example Phrases
- Include empty Fixed Agent Response

A normal Conversation must contain at least one Intent before Save.

---

## 13. Delete Intent

Clicking Delete on an Intent must show:

```text
Delete this Intent?
```

If confirmed:

- Remove only the selected Intent
- Keep the remaining Conversation
- Mark the Agent as unsaved
- Disable Test Web Call

---

## 14. Add Next Conversation

Show exactly one:

```text
+ Add Next Conversation
```

Location:

- After the final normal Conversation
- Before Closing

Click behavior:

- Immediately create a new blank Conversation
- Do not open a dialog
- Do not ask for a heading first
- Focus the blank Conversation Heading input
- Add one blank Intent automatically
- Insert the new Conversation above Closing

---

## 15. Delete Conversation

Every normal Conversation can be deleted.

Before deletion, show:

```text
Delete this Conversation and all its Intents?
```

If confirmed:

- Remove the selected Conversation
- Remove all Intents inside it
- Recalculate visible Conversation numbers
- Mark Agent unsaved
- Disable Test Web Call

Greeting, Closing, and End Call cannot be deleted.

---

## 16. Linear Conversation Rule

There is no Next Step dropdown in Version 1.

Conversation execution follows the visual order.

```text
Greeting
→ Conversation 1
→ Conversation 2
→ Conversation 3
→ Closing
→ End Call
```

After a successful Intent match, runtime advances to the next Conversation by position.

Clarification keeps the call in the same Conversation.

---

## 17. Closing Section

Closing is always the final spoken section.

It contains:

- Heading: Closing
- Fixed Script textarea
- Edit action

Example:

```text
Closing

Fixed Script
Thank you {{callee_name}}. Have a wonderful day.
```

Closing cannot be deleted.

After Closing, the runtime moves to End Call.

---

## 18. End Call

End Call is a fixed terminal row.

It contains no:

- Script
- Intent
- Example Phrases
- Inputs
- Edit action

It only communicates that the call ends after Closing.

Fallback scripts (clarification and failure responses) are not displayed or editable in the Version 1 UI. They use backend default values.

---

## 19. Dynamic Variables

Scripts support variables in this syntax:

```text
{{callee_name}}
{{loan_amount}}
{{due_date}}
{{payment_link}}
```

The frontend scans:

- Greeting script
- Every Fixed Agent Response
- Closing script

It extracts all unique variable names.

Each unique variable appears only once in Dynamic Variables.

Example:

```text
Dynamic Variables

Variable Name      Test Value

callee_name        [ Abu ]
loan_amount        [ 500000 ]
due_date           [ 10 August 2026 ]
```

Rules:

- Do not show variable inputs under every script.
- Do not show an Insert Variable dropdown.
- Do not show a rendered preview in Version 1.
- Test Values are used during Test Web Call.
- Real production values will later come from the call payload.

---

## 20. Dynamic Variable Validation

Valid:

```text
{{callee_name}}
{{loan_amount}}
{{due_date_1}}
```

Invalid:

```text
{{callee_name}
{loan_amount}}
{{ }}
{{123name}}
```

Rules:

- Variable names use lowercase letters, numbers, and underscores.
- Variable names cannot start with a number.
- Malformed variables block Save.
- Show the error near the affected script.
- Never clear the user's text after validation failure.

---

## 21. Script Authoring Rules

Version 1 uses plain text plus `{{variable_name}}`.

Do not expose SSML or technical tags.

Punctuation and sentence structure control natural pauses.

Pronunciation corrections are handled by backend TTS configuration and Sarvam pronunciation dictionaries.

---

## 22. Save Agent

There is one Save Agent button for the complete Agent.

There are no Save buttons inside individual Intent rows or Conversation sections.

Save UI states:

```text
Unsaved Changes
Saving
Preparing Matching
Preparing Voice
Ready
Save Failed
```

When Save Agent is clicked:

1. Validate Agent Name.
2. Validate Language.
3. Validate Greeting.
4. Validate every Conversation Heading.
5. Validate every Intent Name.
6. Require Example Phrases for every Intent.
7. Validate every Fixed Agent Response.
8. Validate Dynamic Variable syntax.
9. Send the complete Agent to backend.
10. Wait for persistence, embeddings, and audio preparation.
11. Show Ready.
12. Enable Test Web Call.

If Save fails:

- Keep all entered values
- Show the exact failure
- Keep Test Web Call disabled
- Do not refresh the page

Phase 1 note:

In Phase 1, Save Agent validates the draft locally and marks the Agent as saved in React state. It does not call a backend API. Agents are not persisted to disk and are lost on page refresh. Real backend persistence begins in Phase 2.

---

## 23. Unsaved Changes

After a successful Save, any edit must:

- Mark Agent as unsaved
- Disable Test Web Call
- Change status to Unsaved Changes

When switching Agents with unsaved changes, ask:

```text
You have unsaved changes.

[ Continue Editing ] [ Discard Changes ]
```

Do not silently lose edits.

---

## 24. Test Web Call

Before Save:

- Test Web Call is disabled.

After successful Save:

- Test Web Call becomes enabled.

Clicking Test Web Call opens a small call dialog.

The normal user sees only:

- Start Web Call
- End Web Call / Close
- State: Connecting, Listening, Speaking, Ended

Do not show:

- Similarity scores
- Thresholds
- Embedding vectors
- JSON
- Provider names
- Audio paths
- Internal IDs
- Transcript by default
- Technical runtime logs

---

## 25. Loading, Empty, and Error States

Required UI states:

- Loading Agents
- No Agents created
- Saving Agent
- Preparing Matching
- Preparing Voice
- Agent Ready
- Agent Save Failed
- Web Call connection failed
- Microphone permission denied
- STT unavailable
- TTS unavailable

Errors must:

- Be human-readable
- Preserve all user edits
- Explain whether retry is possible

---

## 26. Accessibility

Requirements:

- Every field has a visible label.
- Keyboard navigation works.
- Focus moves to newly added Intent.
- Focus moves to newly added Conversation.
- Confirmation dialogs return focus correctly.
- Save and call states use an accessible live region.
- Icon-only actions have accessible labels.
- Error messages are connected to the affected field.

---

## 27. Visual Style

Approved style:

- Single page
- Light grey page background
- White content sections
- Compact spacing
- Clear borders
- Restrained corner radius
- Blue Save Agent button
- Green Test Web Call button
- Readable business typography
- Aligned Intent columns
- No gradients
- No glow
- No giant cards
- No sidebar
- No dashboard
- No unnecessary empty space
- No horizontal page scrolling

---

## 28. Frontend Component Structure

Keep the component structure simple.

```text
frontend/src/
├── App.tsx
├── features/
│   └── voice-system/
│       ├── VoiceSystemPage.tsx
│       ├── AgentControls.tsx
│       ├── CreateAgentForm.tsx
│       ├── GreetingSection.tsx
│       ├── ConversationSection.tsx
│       ├── IntentRow.tsx
│       ├── ClosingSection.tsx
│       ├── EndCallSection.tsx
│       ├── DynamicVariablesSection.tsx
│       └── WebCallDialog.tsx
├── styles/
│   └── voice-system.css
└── tests/
```

Do not add a global state library in Phase 1.

Use React state and small helper functions.

---

## 29. Phase 1 Browser Approval Checklist

Phase 1 UI is approved only when this complete journey works:

```text
Create Agent
→ Builder opens on same page
→ Enter Greeting
→ Edit Intent Name
→ Enter Example Phrases
→ Enter Fixed Agent Response
→ Add Intent
→ Delete Intent
→ Add Next Conversation
→ Blank Conversation appears immediately
→ Delete Conversation
→ Enter {{callee_name}}
→ callee_name appears once at bottom
→ Save Agent
→ Test Web Call becomes enabled
→ Edit Agent
→ Test Web Call becomes disabled
→ Create another Agent
→ Switch between saved Agents
```

---

# End of Document
