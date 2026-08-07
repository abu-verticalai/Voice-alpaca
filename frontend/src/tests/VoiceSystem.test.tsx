import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import VoiceSystemPage from '../features/voice-system/VoiceSystemPage';

describe('VoiceSystemPage', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn().mockImplementation((url, options) => {
      if (url.includes('/api/agents') && (!options || options.method === 'GET')) {
        if (url !== 'http://localhost:8000/api/agents') {
          // It's a GET /api/agents/{id}
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              id: 'agent-123',
              name: 'Test Agent',
              language: 'English',
              voice: { speaker: 'priya' },
              greeting: { script: '' },
              conversations: [],
              closing: { script: '' },
              dynamic_variables: {}
            })
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        });
      }
      if (options && (options.method === 'POST' || options.method === 'PUT')) {
        const body = JSON.parse(options.body);
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ...body, id: 'agent-123', version: 1 })
        });
      }
      if (url.includes('/api/voices')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            {name: "Priya \u2014 Recommended", value: "priya"},
            {name: "Ishita \u2014 Recommended", value: "ishita"}
          ])
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
  });

  it('shows initial empty state and creates an agent', async () => {
    render(<VoiceSystemPage />);
    
    // Empty state (wait for fetch to finish)
    const els = await screen.findAllByText('Create Agent');
    expect(els[0]).toBeInTheDocument();
    
    // Fill form
    const nameInput = screen.getByPlaceholderText('[ Enter agent name ]');
    fireEvent.change(nameInput, { target: { value: 'Test Agent' } });
    
    const submitBtn = screen.getAllByText('Create Agent').find(el => el.tagName === 'BUTTON');
    expect(submitBtn).toBeInTheDocument();
    
    fireEvent.click(submitBtn!);
    
    // Agent Controls shown
    expect(screen.getByText('Save Agent')).toBeInTheDocument();
    expect(screen.getByText('Test Web Call')).toBeInTheDocument();
    expect(screen.getAllByText('Unsaved Changes')[0]).toBeInTheDocument();
  });

  it('can edit scripts, extract variables, save, and test web call', async () => {
    render(<VoiceSystemPage />);
    
    // Wait for empty state
    await screen.findAllByText('Create Agent');

    // Create Agent
    fireEvent.change(screen.getByPlaceholderText('[ Enter agent name ]'), { target: { value: 'Agent 1' } });
    fireEvent.click(screen.getAllByText('Create Agent').find(el => el.tagName === 'BUTTON')!);
    
    // Fill required fields
    const textareas = screen.getAllByRole('textbox').filter(el => el.tagName === 'TEXTAREA');
    fireEvent.change(textareas[0], { target: { value: 'Hello {{callee_name}}' } });
    
    const conversationHeading = screen.getByPlaceholderText('Conversation Heading');
    fireEvent.change(conversationHeading, { target: { value: 'Conv 1' } });
    
    const intentName = screen.getByPlaceholderText('Intent Name');
    fireEvent.change(intentName, { target: { value: 'Intent 1' } });
    
    const examplePhrase = screen.getByPlaceholderText('Example Phrase');
    fireEvent.change(examplePhrase, { target: { value: 'Yes' } });
    
    const intentResponse = screen.getByPlaceholderText('Fixed Agent Response');
    fireEvent.change(intentResponse, { target: { value: 'Great {{amount}}' } });
    
    const closingTextArea = screen.getAllByRole('textbox').filter(el => el.tagName === 'TEXTAREA')[2];
    fireEvent.change(closingTextArea, { target: { value: 'Bye' } });
    
    // Variables extracted
    expect(screen.getByText('callee_name')).toBeInTheDocument();
    expect(screen.getByText('amount')).toBeInTheDocument();
    
    // Fill test values so Test Web Call is enabled
    const inputs = screen.getAllByRole('textbox');
    const varInputs = inputs.filter(i => (i as HTMLInputElement).placeholder === 'Enter test value');
    fireEvent.change(varInputs[0], { target: { value: 'John' } });
    fireEvent.change(varInputs[1], { target: { value: '100' } });
    
    // Select Voice
    await screen.findAllByText(/Priya/);
    const selectsArray = screen.getAllByRole('combobox');
    fireEvent.change(selectsArray[2], { target: { value: 'priya' } });
    
    // Save (wait for async fetch)
    await act(async () => {
      fireEvent.click(screen.getByText('Save Agent'));
    });
    
    expect(screen.getAllByText('Ready')[0]).toBeInTheDocument();
    
    // Test Web Call is enabled
    const testCallBtn = screen.getByText('Test Web Call');
    expect(testCallBtn).not.toBeDisabled();
    
    // Click test call
    fireEvent.click(testCallBtn);
    expect(screen.getByText('Web Call Simulation')).toBeInTheDocument();
    
    // Edit disables test web call
    fireEvent.click(screen.getByText('End Web Call / Close'));
    fireEvent.change(intentName, { target: { value: 'Intent 1 modified' } });
    expect(screen.getAllByText('Unsaved Changes')[0]).toBeInTheDocument();
    expect(testCallBtn).toBeDisabled();
  });

  it('can add and delete intents and conversations', async () => {
    render(<VoiceSystemPage />);
    
    await screen.findAllByText('Create Agent');

    // Create Agent
    fireEvent.change(screen.getByPlaceholderText('[ Enter agent name ]'), { target: { value: 'Agent 2' } });
    fireEvent.click(screen.getAllByText('Create Agent').find(el => el.tagName === 'BUTTON')!);

    // Add intent
    fireEvent.click(screen.getByText('+ Add Intent'));
    const intentNames = screen.getAllByPlaceholderText('Intent Name');
    expect(intentNames).toHaveLength(2);

    // Delete intent
    window.confirm = vi.fn().mockReturnValue(true);
    const deleteBtns = screen.getAllByText('Delete');
    fireEvent.click(deleteBtns[0]);
    expect(screen.getAllByPlaceholderText('Intent Name')).toHaveLength(1);

    // Add conversation
    fireEvent.click(screen.getByText('+ Add Next Conversation'));
    expect(screen.getByText('Conversation 1')).toBeInTheDocument();
    expect(screen.getByText('Conversation 2')).toBeInTheDocument();

    // Delete conversation
    const deleteConvBtns = screen.getAllByText('Delete Conversation');
    fireEvent.click(deleteConvBtns[1]);
    expect(screen.queryByText('Conversation 2')).not.toBeInTheDocument();
  });

  it('can create a second agent and switch between them', async () => {
    render(<VoiceSystemPage />);
    
    await screen.findAllByText('Create Agent');

    // Create Agent 1
    fireEvent.change(screen.getByPlaceholderText('[ Enter agent name ]'), { target: { value: 'Agent 1' } });
    fireEvent.click(screen.getAllByText('Create Agent').find(el => el.tagName === 'BUTTON')!);
    
    const textareas = screen.getAllByRole('textbox').filter(el => el.tagName === 'TEXTAREA');
    fireEvent.change(textareas[0], { target: { value: 'Hello' } });
    fireEvent.change(screen.getByPlaceholderText('Conversation Heading'), { target: { value: 'C1' } });
    fireEvent.change(screen.getByPlaceholderText('Intent Name'), { target: { value: 'I1' } });
    fireEvent.change(screen.getByPlaceholderText('Example Phrase'), { target: { value: 'yes' } });
    fireEvent.change(screen.getByPlaceholderText('Fixed Agent Response'), { target: { value: 'ok' } });
    fireEvent.change(screen.getAllByRole('textbox').filter(el => el.tagName === 'TEXTAREA')[2], { target: { value: 'bye' } });
    
    await act(async () => {
      fireEvent.click(screen.getByText('Save Agent'));
    });
    
    // Create New Agent
    fireEvent.click(screen.getByText('+ New Agent'));
    
    expect(screen.getAllByText('Create Agent')[0]).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('[ Enter agent name ]'), { target: { value: 'Agent 2' } });
    fireEvent.click(screen.getAllByText('Create Agent').find(el => el.tagName === 'BUTTON')!);
    
    expect(screen.getAllByText('Unsaved Changes')[0]).toBeInTheDocument();
    
    // Select Agent 1 from dropdown
    window.confirm = vi.fn().mockReturnValue(true);
    const selects = screen.getAllByRole('combobox');
    
    const select = selects[0] as HTMLSelectElement;
    await act(async () => {
      fireEvent.change(select, { target: { value: 'agent-123' } });
    });
    
    expect(screen.getAllByText('Ready')[0]).toBeInTheDocument();
  });

  it('loads existing agents on mount (refresh behavior)', async () => {
    // Override fetch mock to simulate saved agents existing on load
    globalThis.fetch = vi.fn().mockImplementation((url, options) => {
      if (url.includes('/api/agents') && (!options || options.method === 'GET')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{
            id: 'agent-999',
            name: 'Persisted Agent',
            language: 'English',
            voice: { speaker: 'priya' },
            greeting: { script: 'Hi there' },
            conversations: [],
            closing: { script: 'Bye there' },
            dynamic_variables: {}
          }])
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(<VoiceSystemPage />);

    // Should immediately show the agent title from the loaded data instead of Create Agent
    const els = await screen.findAllByText('Persisted Agent');
    expect(els[0]).toBeInTheDocument();
    // Expect "Ready" instead of "Unsaved Changes"
    const readyEls = await screen.findAllByText('Ready');
    expect(readyEls[0]).toBeInTheDocument();
    
    // Create Agent form should NOT be present
    expect(screen.queryByPlaceholderText('[ Enter agent name ]')).not.toBeInTheDocument();
  });

  it('can delete an agent and load the next one or empty state', async () => {
    globalThis.fetch = vi.fn().mockImplementation((url, options) => {
      if (url.includes('/api/agents') && (!options || options.method === 'GET')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{
            id: 'agent-111',
            name: 'Agent A',
            language: 'English',
            voice: { speaker: 'priya' },
            greeting: { script: 'Hi' },
            conversations: [],
            closing: { script: 'Bye' },
            dynamic_variables: {}
          }])
        });
      }
      if (options && options.method === 'DELETE') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(<VoiceSystemPage />);
    
    const els = await screen.findAllByText('Agent A');
    expect(els[0]).toBeInTheDocument();
    
    // Delete agent
    window.confirm = vi.fn().mockReturnValue(true);
    const deleteBtn = screen.getByText('Delete Agent');
    await act(async () => {
      fireEvent.click(deleteBtn);
    });
    
    // Since only 1 agent existed, deleting it should return us to the empty state
    const createEls = await screen.findAllByText('Create Agent');
    expect(createEls[0]).toBeInTheDocument();
  });

  it('handles backend validation errors', async () => {
    globalThis.fetch = vi.fn().mockImplementation((url, options) => {
      if (url.includes('/api/agents') && (!options || options.method === 'GET')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      if (options && (options.method === 'POST' || options.method === 'PUT')) {
        return Promise.resolve({
          ok: false,
          status: 400,
          json: () => Promise.resolve({
            detail: {
              greeting: 'Malformed variable syntax',
              name: 'Name required'
            }
          })
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(<VoiceSystemPage />);
    await screen.findAllByText('Create Agent');

    // Create Agent
    fireEvent.change(screen.getByPlaceholderText('[ Enter agent name ]'), { target: { value: 'Agent Error' } });
    fireEvent.click(screen.getAllByText('Create Agent').find(el => el.tagName === 'BUTTON')!);
    
    // Save (trigger mock error)
    await act(async () => {
      fireEvent.click(screen.getByText('Save Agent'));
    });
    
    const fails = await screen.findAllByText('Save Failed');
    expect(fails[0]).toBeInTheDocument();
    
    const errs = await screen.findAllByText('Malformed variable syntax');
    expect(errs[0]).toBeInTheDocument();
  });

  it('disables Test Web Call when test values are missing', async () => {
    globalThis.fetch = vi.fn().mockImplementation((url, options) => {
      if (url.includes('/api/agents') && (!options || options.method === 'GET')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      if (options && (options.method === 'POST' || options.method === 'PUT')) {
        const body = JSON.parse(options.body);
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ...body, id: 'agent-123', version: 1 })
        });
      }
      if (url.includes('/api/voices')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            {name: "Priya \u2014 Recommended", value: "priya"},
            {name: "Ishita \u2014 Recommended", value: "ishita"}
          ])
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(<VoiceSystemPage />);
    await screen.findAllByText('Create Agent');

    fireEvent.change(screen.getByPlaceholderText('[ Enter agent name ]'), { target: { value: 'Agent Vars' } });
    fireEvent.click(screen.getAllByText('Create Agent').find(el => el.tagName === 'BUTTON')!);
    
    // Fill required fields
    const textareas = screen.getAllByRole('textbox').filter(el => el.tagName === 'TEXTAREA');
    fireEvent.change(textareas[0], { target: { value: 'Hello {{user}}' } });
    
    const conversationHeading = screen.getByPlaceholderText('Conversation Heading');
    fireEvent.change(conversationHeading, { target: { value: 'Conv 1' } });
    
    const intentName = screen.getByPlaceholderText('Intent Name');
    fireEvent.change(intentName, { target: { value: 'Intent 1' } });
    
    const examplePhrase = screen.getByPlaceholderText('Example Phrase');
    fireEvent.change(examplePhrase, { target: { value: 'Yes' } });
    
    const intentResponse = screen.getByPlaceholderText('Fixed Agent Response');
    fireEvent.change(intentResponse, { target: { value: 'Great' } });
    
    const closingTextArea = screen.getAllByRole('textbox').filter(el => el.tagName === 'TEXTAREA')[2];
    fireEvent.change(closingTextArea, { target: { value: 'Bye' } });
    
    // Select Voice
    await screen.findAllByText(/Priya/);
    const selectsForVoice = screen.getAllByRole('combobox');
    fireEvent.change(selectsForVoice[2], { target: { value: 'priya' } });
    
    await act(async () => {
      fireEvent.click(screen.getByText('Save Agent'));
    });
    
    expect(screen.getAllByText('Ready')[0]).toBeInTheDocument();
    
    // Web call disabled because {{user}} test value is missing
    const testCallBtn = screen.getByText('Test Web Call');
    expect(testCallBtn).toBeDisabled();

    // Fill test value
    const inputs = screen.getAllByRole('textbox');
    // Find the dynamic variable input for 'user'
    const varInput = inputs.find(i => (i as HTMLInputElement).placeholder === 'Enter test value');
    fireEvent.change(varInput!, { target: { value: 'John' } });

    // It should become enabled (after saving, since testEnabled checks isSaved)
    await act(async () => {
      fireEvent.click(screen.getByText('Save Agent'));
    });
    expect(testCallBtn).not.toBeDisabled();
  });
});
