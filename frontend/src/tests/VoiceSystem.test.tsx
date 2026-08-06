import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import VoiceSystemPage from '../features/voice-system/VoiceSystemPage';

describe('Voice System Phase 1', () => {
  it('shows initial empty state and creates an agent', async () => {
    render(<VoiceSystemPage />);
    
    // Initial State
    expect(screen.getAllByText('Create Agent')[0]).toBeInTheDocument();
    expect(screen.queryByText('Existing Agents')).not.toBeInTheDocument();
    
    // Create Agent
    const nameInput = screen.getByPlaceholderText('[ Enter agent name ]');
    fireEvent.change(nameInput, { target: { value: 'Test Agent' } });
    
    const createBtn = screen.getAllByText('Create Agent').find(el => el.tagName === 'BUTTON');
    fireEvent.click(createBtn!);
    
    // Agent Controls shown
    expect(screen.getByText('Save Agent')).toBeInTheDocument();
    expect(screen.getByText('Test Web Call')).toBeInTheDocument();
    expect(screen.getAllByText('Unsaved Changes')[0]).toBeInTheDocument();
  });

  it('can edit scripts, extract variables, save, and test web call', async () => {
    vi.useFakeTimers();
    render(<VoiceSystemPage />);
    
    // Create Agent
    fireEvent.change(screen.getByPlaceholderText('[ Enter agent name ]'), { target: { value: 'Agent 1' } });
    fireEvent.click(screen.getAllByText('Create Agent').find(el => el.tagName === 'BUTTON')!);
    
    // Fill required fields
    // In our UI, greeting is the first textarea.
    // Wait, let's use placeholder or specific labels.
    // We can rely on specific element hierarchy or just find elements by role/value.
    
    // In our UI, greeting is the first textarea.
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
    
    // Closing is the last textarea
    const closingTextArea = screen.getAllByRole('textbox').filter(el => el.tagName === 'TEXTAREA')[2]; // 0: greeting, 1: intent response, 2: closing
    fireEvent.change(closingTextArea, { target: { value: 'Bye' } });
    
    // Variables extracted
    expect(screen.getByText('callee_name')).toBeInTheDocument();
    expect(screen.getByText('amount')).toBeInTheDocument();
    
    // Save
    fireEvent.click(screen.getByText('Save Agent'));
    
    await act(async () => {
      vi.runAllTimers(); // fast forward through setTimeouts
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
    
    vi.useRealTimers();
  });

  it('can add and delete intents and conversations', async () => {
    render(<VoiceSystemPage />);
    
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
    vi.useFakeTimers();
    render(<VoiceSystemPage />);
    
    // Create Agent 1
    fireEvent.change(screen.getByPlaceholderText('[ Enter agent name ]'), { target: { value: 'Agent 1' } });
    fireEvent.click(screen.getAllByText('Create Agent').find(el => el.tagName === 'BUTTON')!);
    
    // Save Agent 1 (need to fill fields first to bypass validation)
    const textareas = screen.getAllByRole('textbox').filter(el => el.tagName === 'TEXTAREA');
    fireEvent.change(textareas[0], { target: { value: 'Hello' } });
    fireEvent.change(screen.getByPlaceholderText('Conversation Heading'), { target: { value: 'C1' } });
    fireEvent.change(screen.getByPlaceholderText('Intent Name'), { target: { value: 'I1' } });
    fireEvent.change(screen.getByPlaceholderText('Example Phrase'), { target: { value: 'yes' } });
    fireEvent.change(screen.getByPlaceholderText('Fixed Agent Response'), { target: { value: 'ok' } });
    fireEvent.change(screen.getAllByRole('textbox').filter(el => el.tagName === 'TEXTAREA')[2], { target: { value: 'bye' } });
    
    fireEvent.click(screen.getByText('Save Agent'));
    await act(async () => { vi.runAllTimers(); });
    
    // Create New Agent
    fireEvent.click(screen.getByText('+ New Agent'));
    
    expect(screen.getAllByText('Create Agent')[0]).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('[ Enter agent name ]'), { target: { value: 'Agent 2' } });
    fireEvent.click(screen.getAllByText('Create Agent').find(el => el.tagName === 'BUTTON')!);
    
    expect(screen.getAllByText('Unsaved Changes')[0]).toBeInTheDocument();
    
    // Check if dropdown has both (Wait, Agent 2 is not saved yet, so it won't be in the dropdown, but we are viewing it)
    // Select Agent 1 from dropdown
    window.confirm = vi.fn().mockReturnValue(true);
    const select = screen.getAllByRole('combobox')[0] as HTMLSelectElement;
    // The first select is the existing agents select, second is language.
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: select.options[0].value } }); // Agent 1's ID
    
    expect(screen.getAllByText('Ready')[0]).toBeInTheDocument();
    vi.useRealTimers();
  });
});
