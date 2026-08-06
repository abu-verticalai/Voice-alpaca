import React from 'react';

interface Props {
  onAgentCreate: (name: string, language: string) => void;
}

const CreateAgentForm: React.FC<Props> = ({ onAgentCreate }) => {
  const [name, setName] = React.useState('');
  const [language, setLanguage] = React.useState('Tamil');

  const handleCreate = () => {
    if (name.trim()) {
      onAgentCreate(name, language);
    }
  };

  return (
    <div className="card">
      <h2>Create Agent</h2>
      <div className="row">
        <div className="form-group">
          <label className="label">Agent Name</label>
          <input
            className="input"
            type="text"
            placeholder="[ Enter agent name ]"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="label">Language</label>
          <select className="select" value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="Tamil">Tamil</option>
            <option value="English">English</option>
            <option value="Tanglish">Tanglish</option>
          </select>
        </div>
        <div className="form-group">
          <label className="label">&nbsp;</label>
          <button className="button button-primary" onClick={handleCreate} disabled={!name.trim()}>
            Create Agent
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateAgentForm;
