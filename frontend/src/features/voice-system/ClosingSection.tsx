import React from 'react';

interface Props {
  script: string;
  onChange: (val: string) => void;
  error?: string;
}

const ClosingSection: React.FC<Props> = ({ script, onChange, error }) => {
  return (
    <div className="card">
      <div className="step-label">Final Step</div>
      <h2>Closing</h2>
      <div className="form-group">
        <textarea 
          className="textarea" 
          value={script} 
          onChange={(e) => onChange(e.target.value)}
          placeholder="Fixed Script..."
        />
        {error && <span className="error-text">{error}</span>}
      </div>
    </div>
  );
};

export default ClosingSection;
