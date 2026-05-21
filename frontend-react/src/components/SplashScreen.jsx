import { useEffect, useState } from 'react';

export default function SplashScreen({ onDone }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 600);
    }, 2600);
    return () => clearTimeout(t);
  }, [onDone]);

  if (!visible) return null;

  return (
    <div className="splash">
      <div className="splash-logo">🛡️</div>
      <h1 className="splash-title gradient-text">VeriLearn</h1>
      <p className="splash-sub">AI Learning Authenticity Evaluator</p>
      <div className="splash-bar">
        <div className="splash-bar-fill" />
      </div>
    </div>
  );
}
