import React from 'react';
import type { Agent } from './types';

interface Props {
  agents: Agent[];
  selectedAgentId: string;
  onSelectAgent: (id: string) => void;
  onNewAgent: () => void;
  language: string;
  onLanguageChange: (lang: string) => void;
  onSave: () => void;
  onTestCall: () => void;
  isTestEnabled: boolean;
  saveStatus: string;
  onDeleteAgent?: () => void;
  voiceCatalog?: Array<{name: string, value: string}>;
  selectedSpeaker?: string;
  onSpeakerChange?: (speaker: string) => void;
  onPreviewVoice?: () => void;
  previewState?: 'idle' | 'previewing' | 'ready' | 'failed';
  voiceCatalogStatus?: 'loading' | 'error' | 'success';
  onRetryVoiceLoad?: () => void;
}

const AgentControls: React.FC<Props> = ({
  agents,
  selectedAgentId,
  onSelectAgent,
  onNewAgent,
  language,
  onLanguageChange,
  onSave,
  onTestCall,
  isTestEnabled,
  saveStatus,
  onDeleteAgent,
  voiceCatalog = [],
  selectedSpeaker = '',
  onSpeakerChange,
  onPreviewVoice,
  previewState = 'idle',
  voiceCatalogStatus = 'success',
  onRetryVoiceLoad
}) => {
  return (
    <div className="status-bar">
      <div className="controls-left">
        <div className="form-group">
          <label className="label">Existing Agents</label>
          <select 
            className="select" 
            value={selectedAgentId} 
            onChange={(e) => onSelectAgent(e.target.value)}
          >
            {agents.length === 0 && <option value="" disabled>No agents saved</option>}
            {agents.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <button className="button button-secondary" onClick={onNewAgent}>
            + New Agent
          </button>
        </div>
        <div className="form-group">
          <label className="label">Language</label>
          <select className="select" value={language} onChange={(e) => onLanguageChange(e.target.value)}>
            <option value="Tamil">Tamil</option>
            <option value="English">English</option>
            <option value="Tanglish">Tanglish</option>
          </select>
        </div>
        <div className="form-group">
          <label className="label">Voice</label>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {voiceCatalogStatus === 'error' ? (
              <>
                <span style={{color:'red', fontSize:'0.8rem'}}>Unable to load voices. Please retry.</span>
                <button className="button button-secondary" onClick={onRetryVoiceLoad}>Retry</button>
              </>
            ) : (
              <>
                <select 
                  className="select" 
                  value={selectedSpeaker} 
                  onChange={(e) => onSpeakerChange && onSpeakerChange(e.target.value)}
                  disabled={voiceCatalogStatus === 'loading'}
                >
                  <option value="" disabled>
                    {voiceCatalogStatus === 'loading' ? 'Loading...' : 'Select Voice'}
                  </option>
                  {voiceCatalog.map(voice => (
                    <option key={voice.value} value={voice.value}>{voice.name}</option>
                  ))}
                </select>
                <button 
                  className="button button-secondary" 
                  onClick={onPreviewVoice}
                  disabled={!selectedSpeaker || previewState === 'previewing'}
                >
                  {previewState === 'previewing' ? 'Previewing...' : 'Preview Voice'}
                </button>
                {previewState === 'failed' && <span style={{color:'red', fontSize:'0.8rem'}}>Failed</span>}
              </>
            )}
          </div>
        </div>
      </div>
      <div className="controls-right">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', height: '100%' }}>
          <span className="label" style={{ fontWeight: '600' }}>{saveStatus}</span>
          {onDeleteAgent && (
            <button 
              className="button button-danger-muted" 
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
              onClick={() => {
                if (window.confirm('Delete this Agent permanently?')) {
                  onDeleteAgent();
                }
              }}
            >
              Delete Agent
            </button>
          )}
          <button className="button button-primary" onClick={onSave}>
            Save Agent
          </button>
          <button 
            className="button button-success" 
            onClick={onTestCall} 
            disabled={!isTestEnabled}
          >
            Test Web Call
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgentControls;
