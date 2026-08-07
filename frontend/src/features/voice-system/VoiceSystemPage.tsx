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
import { extractVariables } from './util';
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
  const [voiceCatalog, setVoiceCatalog] = useState<Array<{name: string, value: string}>>([]);
  const [previewState, setPreviewState] = useState<'idle' | 'previewing' | 'ready' | 'failed'>('idle');
  const [voiceCatalogStatus, setVoiceCatalogStatus] = useState<'loading' | 'error' | 'success'>('success');

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
  const missingTestValues = variables.some(v => !(currentDraft?.dynamic_variables?.[v]?.trim()));
  const hasVoice = !!(currentDraft?.voice?.speaker);

  const isTestEnabled = isSaved && currentDraft !== null && saveStatus === 'Ready' && !missingTestValues && hasVoice;

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

  const fetchVoices = () => {
    if (currentDraft?.language) {
      setVoiceCatalogStatus('loading');
      fetch(`http://localhost:8000/api/voices?language=${currentDraft.language}`)
        .then(res => {
          if (!res.ok) throw new Error('Failed');
          return res.json();
        })
        .then(data => {
          setVoiceCatalog(Array.isArray(data) ? data : []);
          setVoiceCatalogStatus('success');
        })
        .catch(err => {
          console.error('Failed to load voice catalog', err);
          setVoiceCatalogStatus('error');
        });
    }
  };

  useEffect(() => {
    fetchVoices();
  }, [currentDraft?.language]);

  const handlePreviewVoice = async () => {
    if (!currentDraft?.voice?.speaker || !currentDraft?.language) return;
    setPreviewState('previewing');
    
    // Choose text to preview: Greeting or a fallback
    let text = currentDraft.greeting?.script?.trim();
    if (!text) text = "This is a preview of the voice agent.";
    
    // Replace variables temporarily for preview
    text = text.replace(/\{\{.*?\}\}/g, "value");

    try {
      const res = await fetch(`http://localhost:8000/api/voices/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          speaker: currentDraft.voice.speaker,
          language: currentDraft.language,
          text: text
        })
      });
      if (!res.ok) throw new Error('Preview failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => setPreviewState('idle');
      audio.play();
      setPreviewState('ready');
    } catch (err) {
      console.error(err);
      setPreviewState('failed');
    }
  };

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
        if (res.status === 400) {
          const errorData = await res.json();
          if (errorData.detail && typeof errorData.detail === 'object') {
            setErrors(errorData.detail);
            setSaveStatus('Save Failed');
            return;
          }
        }
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
          onLanguageChange={lang => updateDraft(d => ({ ...d, language: lang, voice: undefined }))}
          onSave={handleSave}
          onTestCall={() => setIsWebCallOpen(true)}
          isTestEnabled={isTestEnabled}
          saveStatus={saveStatus}
          onDeleteAgent={handleDeleteAgent}
          voiceCatalog={voiceCatalog}
          selectedSpeaker={currentDraft.voice?.speaker}
          onSpeakerChange={speaker => updateDraft(d => ({ ...d, voice: { speaker } }))}
          onPreviewVoice={handlePreviewVoice}
          previewState={previewState}
          voiceCatalogStatus={voiceCatalogStatus}
          onRetryVoiceLoad={fetchVoices}
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
