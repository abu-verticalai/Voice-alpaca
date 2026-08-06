import React from 'react';
import type { Intent } from './types';

interface Props {
  intent: Intent;
  onChange: (intent: Intent) => void;
  onDelete: () => void;
  errors: Record<string, string>;
}

const IntentRow: React.FC<Props> = ({ intent, onChange, onDelete, errors }) => {
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...intent, name: e.target.value });
  };

  const handlePhraseChange = (id: string, text: string) => {
    const newPhrases = intent.example_phrases.map(p => p.id === id ? { ...p, text } : p);
    onChange({ ...intent, example_phrases: newPhrases });
  };

  const addPhrase = () => {
    const newPhrases = [...intent.example_phrases, { id: `phrase-${Date.now()}-${Math.random()}`, text: '' }];
    onChange({ ...intent, example_phrases: newPhrases });
  };

  const removePhrase = (id: string) => {
    const newPhrases = intent.example_phrases.filter(p => p.id !== id);
    onChange({ ...intent, example_phrases: newPhrases });
  };

  const handleDeleteClick = () => {
    if (window.confirm('Delete this Intent?')) {
      onDelete();
    }
  };

  return (
    <tr>
      <td data-label="Intent Name">
        <input 
          className="input" 
          value={intent.name} 
          onChange={handleNameChange} 
          placeholder="Intent Name" 
          style={{ width: '100%', boxSizing: 'border-box' }}
        />
        {errors.name && <div className="error-text">{errors.name}</div>}
      </td>
      <td data-label="Example Phrases">
        <div className="phrase-input-list">
          {intent.example_phrases.map(p => (
            <div key={p.id} className="phrase-row">
              <input 
                className="input" 
                value={p.text} 
                onChange={e => handlePhraseChange(p.id, e.target.value)}
                placeholder="Example Phrase"
                style={{ flex: 1, minWidth: 0 }}
              />
              <button className="button button-danger-muted button-small" style={{ padding: '0.4rem 0.6rem' }} onClick={() => removePhrase(p.id)}>X</button>
            </div>
          ))}
          <div>
            <button className="button button-secondary button-small" onClick={addPhrase}>+ Add Phrase</button>
          </div>
        </div>
        {errors.phrases && <div className="error-text">{errors.phrases}</div>}
      </td>
      <td data-label="Fixed Agent Response">
        <textarea 
          className="textarea" 
          value={intent.fixed_response} 
          onChange={e => onChange({ ...intent, fixed_response: e.target.value })}
          placeholder="Fixed Agent Response"
          style={{ width: '100%', minHeight: '60px', boxSizing: 'border-box' }}
        />
        {errors.response && <div className="error-text">{errors.response}</div>}
      </td>
      <td style={{ textAlign: 'right', verticalAlign: 'middle' }}>
        <button className="button button-danger-muted button-small" onClick={handleDeleteClick}>Delete</button>
      </td>
    </tr>
  );
};

export default IntentRow;
