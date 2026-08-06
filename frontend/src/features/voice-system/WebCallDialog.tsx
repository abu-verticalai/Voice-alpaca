import React from 'react';

interface Props {
  onClose: () => void;
}

const WebCallDialog: React.FC<Props> = ({ onClose }) => {
  const [state, setState] = React.useState('Connecting...');

  React.useEffect(() => {
    let timer1: ReturnType<typeof setTimeout>;
    let timer2: ReturnType<typeof setTimeout>;
    let timer3: ReturnType<typeof setTimeout>;
    let timer4: ReturnType<typeof setTimeout>;

    timer1 = setTimeout(() => setState('Listening'), 1500);
    timer2 = setTimeout(() => setState('Speaking'), 3000);
    timer3 = setTimeout(() => setState('Listening'), 4500);
    timer4 = setTimeout(() => setState('Ended'), 6000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, []);

  return (
    <div className="dialog-overlay">
      <div className="dialog-content">
        <h2>Web Call Simulation</h2>
        <div style={{ margin: '2rem 0', fontSize: '1.2rem', fontWeight: 'bold' }}>
          State: {state}
        </div>
        <button className="button button-danger" onClick={onClose}>End Web Call / Close</button>
      </div>
    </div>
  );
};

export default WebCallDialog;
