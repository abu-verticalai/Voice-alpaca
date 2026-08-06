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
    expect(screen.getAllByText('Ready')[0]).toBeInTheDocument();
    
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
});
