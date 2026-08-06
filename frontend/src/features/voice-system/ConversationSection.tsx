import React from 'react';
import type { Conversation, Intent } from './types';
import IntentRow from './IntentRow';

interface Props {
  conversation: Conversation;
  index: number;
  onChange: (conversation: Conversation) => void;
  onDelete: () => void;
  errors: Record<string, string>;
  intentErrors: Record<string, Record<string, string>>;
}

const ConversationSection: React.FC<Props> = ({ conversation, index, onChange, onDelete, errors, intentErrors }) => {
  const handleHeadingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...conversation, heading: e.target.value });
  };

  const handleIntentChange = (updatedIntent: Intent) => {
    const newIntents = conversation.intents.map(i => i.id === updatedIntent.id ? updatedIntent : i);
    onChange({ ...conversation, intents: newIntents });
  };

  const addIntent = () => {
    const newIntent: Intent = {
      id: `intent-${Date.now()}-${Math.random()}`,
      name: '',
      example_phrases: [{ id: `phrase-${Date.now()}-${Math.random()}`, text: '' }],
      fixed_response: ''
    };
    onChange({ ...conversation, intents: [...conversation.intents, newIntent] });
  };

  const deleteIntent = (id: string) => {
    const newIntents = conversation.intents.filter(i => i.id !== id);
    onChange({ ...conversation, intents: newIntents });
  };

  const handleDeleteClick = () => {
    if (window.confirm('Delete this Conversation and all its Intents?')) {
      onDelete();
    }
  };

  return (
    <div className="card">
      <div className="conversation-header">
        <div style={{ flex: 1, marginRight: '1rem' }}>
          <div className="step-label">Stage {index + 1}</div>
          <h2>Conversation {index + 1}</h2>
          <div className="form-group">
            <input 
              className="input" 
              value={conversation.heading} 
              onChange={handleHeadingChange}
              placeholder="Conversation Heading"
            />
            {errors.heading && <span className="error-text">{errors.heading}</span>}
          </div>
        </div>
        <button className="button button-danger-muted button-small" onClick={handleDeleteClick}>Delete Conversation</button>
      </div>

      <table className="intent-table">
        <thead>
          <tr>
            <th style={{ width: '25%' }}>Intent Name</th>
            <th style={{ width: '35%' }}>Example Phrases</th>
            <th style={{ width: '35%' }}>Fixed Agent Response</th>
            <th style={{ width: '5%' }}></th>
          </tr>
        </thead>
        <tbody>
          {conversation.intents.map(intent => (
            <IntentRow 
              key={intent.id} 
              intent={intent} 
              onChange={handleIntentChange}
              onDelete={() => deleteIntent(intent.id)}
              errors={intentErrors[intent.id] || {}}
            />
          ))}
        </tbody>
      </table>
      {errors.intents && <div className="error-text" style={{ marginTop: '0.5rem' }}>{errors.intents}</div>}
      <div style={{ marginTop: '1rem' }}>
        <button className="button button-secondary button-small" onClick={addIntent}>+ Add Intent</button>
      </div>
    </div>
  );
};

export default ConversationSection;
