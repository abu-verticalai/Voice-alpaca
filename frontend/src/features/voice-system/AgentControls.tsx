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
