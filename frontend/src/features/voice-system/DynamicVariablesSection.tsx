import React from 'react';

interface Props {
  variables: string[];
  testValues: Record<string, string>;
  onChange: (name: string, value: string) => void;
}

const DynamicVariablesSection: React.FC<Props> = ({ variables, testValues, onChange }) => {
  if (variables.length === 0) {
    return (
      <div className="card">
        <div className="step-label">Configuration</div>
        <h2>Dynamic Variables</h2>
        <p style={{ color: 'var(--text-secondary)' }}>No variables found. Use {'{{variable_name}}'} syntax in scripts.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="step-label">Configuration</div>
      <h2>Dynamic Variables</h2>
      <table className="variables-table">
        <thead>
          <tr>
            <th style={{ width: '40%' }}>Variable Name</th>
            <th style={{ width: '60%' }}>Test Value</th>
          </tr>
        </thead>
        <tbody>
          {variables.map((v) => (
            <tr key={v}>
              <td style={{ fontFamily: 'monospace', color: 'var(--primary-color)' }}>{v}</td>
              <td>
                <input
                  className="input"
                  type="text"
                  value={testValues[v] || ''}
                  onChange={(e) => onChange(v, e.target.value)}
                  placeholder="Enter test value"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DynamicVariablesSection;
