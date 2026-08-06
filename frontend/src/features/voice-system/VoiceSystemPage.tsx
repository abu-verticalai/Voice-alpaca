import React, { useState, useEffect } from 'react';
import type { Agent, Conversation } from './types';
import CreateAgentForm from './CreateAgentForm';
import AgentControls from './AgentControls';
import GreetingSection from './GreetingSection';
import ConversationSection from './ConversationSection';
import ClosingSection from './ClosingSection';
import EndCallSection from './EndCallSection';
import DynamicVariablesSection from './DynamicVariablesSection';
import WebCallDialog from './WebCallDialog';
import { extractVariables, hasMalformedVariables } from './util';
import '../../styles/voice-system.css';

const API_BASE = 'http://localhost:8000/api/agents';

const VoiceSystemPage: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [currentDraft, setCurrentDraft] = useState<Agent | null>(null);
  const [isSaved, setIsSaved] = useState<boolean>(true);
  const [saveStatus, setSaveStatus] = useState<string>('');
  const [isWebCallOpen, setIsWebCallOpen] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  const isTestEnabled = isSaved && currentDraft !== null && saveStatus === 'Ready';

  useEffect(() => {
    fetch(API_BASE)
      .then(res => res.json())
      .then(data => {
        setAgents(data);
        if (data.length > 0) {
          setCurrentDraft(data[0]);
          setSelectedAgentId(data[0].id);
          setIsSaved(true);
          setSaveStatus('Ready');
        }
      })
      .catch(err => console.error('Failed to load agents', err))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (currentDraft && !isSaved && saveStatus !== 'Save Failed') {
      setSaveStatus('Unsaved Changes');
    }
  }, [currentDraft, isSaved, saveStatus]);

  const handleCreateAgent = (name: string, language: string) => {
    const newAgent: Agent = {
      id: `tmp-agent-${Date.now()}`,
      name,
      language,
      greeting: { script: '' },
      conversations: [{
        id: `tmp-conv-${Date.now()}`,
        heading: '',
        intents: [{
          id: `tmp-intent-${Date.now()}`,
          name: '',
          example_phrases: [{ id: `tmp-phrase-${Date.now()}`, text: '' }],
          fixed_response: ''
        }]
      }],
      closing: { script: '' },
      dynamic_variables: {}
    };
    setCurrentDraft(newAgent);
    setIsSaved(false);
    setSaveStatus('Unsaved Changes');
  };

  const handleSelectAgent = async (id: string) => {
    if (!isSaved && !window.confirm('You have unsaved changes.\n\n[ Continue Editing ] [ Discard Changes ]')) {
      return;
    }
    
    try {
      const res = await fetch(`${API_BASE}/${id}`);
      if (!res.ok) throw new Error('Failed to load agent');
      const agent = await res.json();
      setCurrentDraft(agent);
      setSelectedAgentId(id);
      setIsSaved(true);
      setSaveStatus('Ready');
      setErrors({});
    } catch (err) {
      console.error(err);
      alert('Failed to load agent');
    }
  };

  const handleNewAgent = () => {
    if (!isSaved && !window.confirm('You have unsaved changes.\n\n[ Continue Editing ] [ Discard Changes ]')) {
      return;
    }
    setCurrentDraft(null);
    setSelectedAgentId('');
    setSaveStatus('');
    setErrors({});
  };

  const updateDraft = (updater: (draft: Agent) => Agent) => {
    if (!currentDraft) return;
    setCurrentDraft(updater(currentDraft));
    setIsSaved(false);
    setErrors({});
    if (saveStatus === 'Save Failed') {
      setSaveStatus('Unsaved Changes');
    }
  };

  const handleSave = async () => {
    if (!currentDraft) return;
    setSaveStatus('Saving');

    // Validation
    const newErrors: any = {};
    const greetingScript = currentDraft.greeting?.script || '';
    if (!greetingScript.trim()) newErrors.greeting = 'Script required';
    if (hasMalformedVariables(greetingScript)) newErrors.greeting = 'Malformed variable syntax';

    currentDraft.conversations.forEach(conv => {
      newErrors[conv.id] = {};
      if (!conv.heading.trim()) newErrors[conv.id].heading = 'Heading required';
      if (conv.intents.length === 0) newErrors[conv.id].intents = 'At least one Intent required';

      newErrors[conv.id].intentErrors = {};
      conv.intents.forEach(intent => {
        const iErr: any = {};
        if (!intent.name.trim()) iErr.name = 'Name required';
        const validPhrases = intent.example_phrases.filter(p => p.text.trim() !== '');
        if (validPhrases.length === 0) iErr.phrases = 'At least one non-empty Example Phrase required';
        if (!intent.fixed_response.trim()) iErr.response = 'Fixed Agent Response required';
        if (hasMalformedVariables(intent.fixed_response)) iErr.response = 'Malformed variable syntax';
        
        if (Object.keys(iErr).length > 0) {
          newErrors[conv.id].intentErrors[intent.id] = iErr;
        }
      });
    });

    const closingScript = currentDraft.closing?.script || '';
    if (!closingScript.trim()) newErrors.closing = 'Script required';
    if (hasMalformedVariables(closingScript)) newErrors.closing = 'Malformed variable syntax';

    let hasErrors = false;
    if (newErrors.greeting || newErrors.closing) hasErrors = true;
    currentDraft.conversations.forEach(c => {
      if (newErrors[c.id].heading || newErrors[c.id].intents || Object.keys(newErrors[c.id].intentErrors).length > 0) {
        hasErrors = true;
      }
    });

    if (hasErrors) {
      setErrors(newErrors);
      setSaveStatus('Save Failed');
      return;
    }

    try {
      const isExisting = currentDraft.id && !currentDraft.id.startsWith('tmp-');
      const url = isExisting ? `${API_BASE}/${currentDraft.id}` : API_BASE;
      const method = isExisting ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentDraft)
      });
      
      if (!res.ok) {
        throw new Error('Save failed on backend');
      }
      
      const savedAgent = await res.json();
      setCurrentDraft(savedAgent);
      setIsSaved(true);
      setSaveStatus('Ready');
      setErrors({});
      
      // Update local list
      if (isExisting) {
        setAgents(agents.map(a => a.id === savedAgent.id ? savedAgent : a));
      } else {
        setAgents([...agents, savedAgent]);
        setSelectedAgentId(savedAgent.id);
      }
    } catch (err) {
      console.error(err);
      setSaveStatus('Save Failed');
    }
  };

  const handleDeleteAgent = async () => {
    if (!currentDraft || !currentDraft.id || currentDraft.id.startsWith('tmp-')) {
      handleNewAgent(); // If not persisted, just clear
      return;
    }
    
    try {
      const res = await fetch(`${API_BASE}/${currentDraft.id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Delete failed');
      
      const newAgents = agents.filter(a => a.id !== currentDraft.id);
      setAgents(newAgents);
      
      if (newAgents.length > 0) {
        setCurrentDraft(newAgents[0]);
        setSelectedAgentId(newAgents[0].id);
        setIsSaved(true);
        setSaveStatus('Ready');
      } else {
        setCurrentDraft(null);
        setSelectedAgentId('');
        setSaveStatus('');
      }
      setErrors({});
    } catch (err) {
      console.error(err);
      alert('Failed to delete agent');
    }
  };

  const allScripts = () => {
    if (!currentDraft) return '';
    let text = (currentDraft.greeting?.script || '') + '\n';
    currentDraft.conversations.forEach(c => {
      c.intents.forEach(i => {
        text += i.fixed_response + '\n';
      });
    });
    text += (currentDraft.closing?.script || '');
    return text;
  };

  const variables = extractVariables(allScripts());

  if (isLoading) {
    return (
      <div className="voice-system-page">
        <div className="container" style={{ color: 'var(--text-secondary)' }}>
          Loading...
        </div>
      </div>
    );
  }

  if (!currentDraft) {
    return (
      <div className="voice-system-page">
        <div className="container">
          <CreateAgentForm onAgentCreate={handleCreateAgent} />
        </div>
      </div>
    );
  }

  const getBadgeClass = () => {
    if (saveStatus === 'Ready') return 'badge-success';
    if (saveStatus.includes('Failed')) return 'badge-danger';
    return 'badge-warning';
  };

  return (
    <div className="voice-system-page">
      <div className="container">
        <AgentControls
          agents={agents}
          selectedAgentId={selectedAgentId}
          onSelectAgent={handleSelectAgent}
          onNewAgent={handleNewAgent}
          language={currentDraft.language}
          onLanguageChange={lang => updateDraft(d => ({ ...d, language: lang }))}
          onSave={handleSave}
          onTestCall={() => setIsWebCallOpen(true)}
          isTestEnabled={isTestEnabled}
          saveStatus={saveStatus}
          onDeleteAgent={handleDeleteAgent}
        />

        <div className="agent-header">
          <div className="agent-title">
            {currentDraft.name}
            {saveStatus && <span className={`badge ${getBadgeClass()}`}>{saveStatus}</span>}
          </div>
          <div className="agent-subtitle">{currentDraft.language} Voice Agent {currentDraft.version ? `v${currentDraft.version}` : ''}</div>
        </div>

        <GreetingSection
          script={currentDraft.greeting?.script || ''}
          onChange={val => updateDraft(d => ({ ...d, greeting: { script: val } }))}
          error={errors.greeting}
        />

        {currentDraft.conversations.map((conv, idx) => (
          <ConversationSection
            key={conv.id}
            index={idx}
            conversation={conv}
            onChange={updated => {
              updateDraft(d => ({
                ...d,
                conversations: d.conversations.map(c => c.id === updated.id ? updated : c)
              }));
            }}
            onDelete={() => {
              updateDraft(d => ({
                ...d,
                conversations: d.conversations.filter(c => c.id !== conv.id)
              }));
            }}
            errors={errors[conv.id] || {}}
            intentErrors={errors[conv.id]?.intentErrors || {}}
          />
        ))}

        <div className="workflow-action">
          <button 
            className="button button-outline"
            style={{ width: 'auto', backgroundColor: 'var(--bg-color)', zIndex: 2, position: 'relative' }}
            onClick={() => {
              const newConv: Conversation = {
                id: `tmp-conv-${Date.now()}`,
                heading: '',
                intents: [{
                  id: `tmp-intent-${Date.now()}`,
                  name: '',
                  example_phrases: [{ id: `tmp-phrase-${Date.now()}`, text: '' }],
                  fixed_response: ''
                }]
              };
              updateDraft(d => ({ ...d, conversations: [...d.conversations, newConv] }));
            }}
          >
            + Add Next Conversation
          </button>
        </div>

        <ClosingSection
          script={currentDraft.closing?.script || ''}
          onChange={val => updateDraft(d => ({ ...d, closing: { script: val } }))}
          error={errors.closing}
        />

        <EndCallSection />

        <DynamicVariablesSection
          variables={variables}
          testValues={currentDraft.dynamic_variables || {}}
          onChange={(name, val) => updateDraft(d => ({
            ...d,
            dynamic_variables: { ...(d.dynamic_variables || {}), [name]: val }
          }))}
        />

      </div>
      {isWebCallOpen && <WebCallDialog onClose={() => setIsWebCallOpen(false)} />}
    </div>
  );
};

export default VoiceSystemPage;
