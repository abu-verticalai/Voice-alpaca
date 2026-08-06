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

const VoiceSystemPage: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [currentDraft, setCurrentDraft] = useState<Agent | null>(null);
  const [isSaved, setIsSaved] = useState<boolean>(true);
  const [saveStatus, setSaveStatus] = useState<string>('');
  const [isWebCallOpen, setIsWebCallOpen] = useState(false);
  const [errors, setErrors] = useState<any>({});

  const isTestEnabled = isSaved && currentDraft !== null && saveStatus === 'Ready';

  useEffect(() => {
    if (currentDraft && !isSaved) {
      setSaveStatus('Unsaved Changes');
    }
  }, [currentDraft, isSaved]);

  const handleCreateAgent = (name: string, language: string) => {
    const newAgent: Agent = {
      id: `agent-${Date.now()}`,
      name,
      language,
      greeting: '',
      conversations: [{
        id: `conv-${Date.now()}`,
        heading: '',
        intents: [{
          id: `intent-${Date.now()}`,
          name: '',
          examplePhrases: [{ id: `phrase-${Date.now()}`, text: '' }],
          fixedResponse: ''
        }]
      }],
      closing: '',
      dynamicVariables: {}
    };
    setCurrentDraft(newAgent);
    setIsSaved(false);
    setSaveStatus('Unsaved Changes');
  };

  const handleSelectAgent = (id: string) => {
    if (!isSaved && !window.confirm('You have unsaved changes.\n\n[ Continue Editing ] [ Discard Changes ]')) {
      return;
    }
    const agent = agents.find(a => a.id === id);
    if (agent) {
      setCurrentDraft(JSON.parse(JSON.stringify(agent)));
      setSelectedAgentId(id);
      setIsSaved(true);
      setSaveStatus('Ready');
      setErrors({});
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
  };

  const handleSave = () => {
    if (!currentDraft) return;
    setSaveStatus('Saving');

    // Validation
    const newErrors: any = {};
    if (!currentDraft.greeting.trim()) newErrors.greeting = 'Script required';
    if (hasMalformedVariables(currentDraft.greeting)) newErrors.greeting = 'Malformed variable syntax';

    currentDraft.conversations.forEach(conv => {
      newErrors[conv.id] = {};
      if (!conv.heading.trim()) newErrors[conv.id].heading = 'Heading required';
      if (conv.intents.length === 0) newErrors[conv.id].intents = 'At least one Intent required';

      newErrors[conv.id].intentErrors = {};
      conv.intents.forEach(intent => {
        const iErr: any = {};
        if (!intent.name.trim()) iErr.name = 'Name required';
        const validPhrases = intent.examplePhrases.filter(p => p.text.trim() !== '');
        if (validPhrases.length === 0) iErr.phrases = 'At least one non-empty Example Phrase required';
        if (!intent.fixedResponse.trim()) iErr.response = 'Fixed Agent Response required';
        if (hasMalformedVariables(intent.fixedResponse)) iErr.response = 'Malformed variable syntax';
        
        if (Object.keys(iErr).length > 0) {
          newErrors[conv.id].intentErrors[intent.id] = iErr;
        }
      });
    });

    if (!currentDraft.closing.trim()) newErrors.closing = 'Script required';
    if (hasMalformedVariables(currentDraft.closing)) newErrors.closing = 'Malformed variable syntax';

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

    setTimeout(() => {
      setSaveStatus('Preparing Matching');
      setTimeout(() => {
        setSaveStatus('Preparing Voice');
        setTimeout(() => {
          setSaveStatus('Ready');
          setIsSaved(true);
          setErrors({});
          const existingIndex = agents.findIndex(a => a.id === currentDraft.id);
          const newAgents = [...agents];
          if (existingIndex >= 0) {
            newAgents[existingIndex] = currentDraft;
          } else {
            newAgents.push(currentDraft);
            setSelectedAgentId(currentDraft.id);
          }
          setAgents(newAgents);
        }, 300);
      }, 300);
    }, 300);
  };

  const allScripts = () => {
    if (!currentDraft) return '';
    let text = currentDraft.greeting + '\n';
    currentDraft.conversations.forEach(c => {
      c.intents.forEach(i => {
        text += i.fixedResponse + '\n';
      });
    });
    text += currentDraft.closing;
    return text;
  };

  const variables = extractVariables(allScripts());

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
        />

        <div className="agent-header">
          <div className="agent-title">
            {currentDraft.name}
            {saveStatus && <span className={`badge ${getBadgeClass()}`}>{saveStatus}</span>}
          </div>
          <div className="agent-subtitle">{currentDraft.language} Voice Agent</div>
        </div>

        <GreetingSection
          script={currentDraft.greeting}
          onChange={val => updateDraft(d => ({ ...d, greeting: val }))}
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
                id: `conv-${Date.now()}`,
                heading: '',
                intents: [{
                  id: `intent-${Date.now()}`,
                  name: '',
                  examplePhrases: [{ id: `phrase-${Date.now()}`, text: '' }],
                  fixedResponse: ''
                }]
              };
              updateDraft(d => ({ ...d, conversations: [...d.conversations, newConv] }));
            }}
          >
            + Add Next Conversation
          </button>
        </div>

        <ClosingSection
          script={currentDraft.closing}
          onChange={val => updateDraft(d => ({ ...d, closing: val }))}
          error={errors.closing}
        />

        <EndCallSection />

        <DynamicVariablesSection
          variables={variables}
          testValues={currentDraft.dynamicVariables}
          onChange={(name, val) => updateDraft(d => ({
            ...d,
            dynamicVariables: { ...d.dynamicVariables, [name]: val }
          }))}
        />

      </div>
      {isWebCallOpen && <WebCallDialog onClose={() => setIsWebCallOpen(false)} />}
    </div>
  );
};

export default VoiceSystemPage;
