import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) { setError('Please fill all fields'); return; }
    setLoading(true);
    setError('');
    await new Promise(r => setTimeout(r, 800)); // simulate auth
    login({ name: name.trim(), email: email.trim(), role });
    navigate(role === 'teacher' ? '/teacher' : '/student');
  };

  return (
    <div className="login-page">
      <div className="login-card fade-up">
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>🛡️</div>
          <h1 className="gradient-text" style={{ fontFamily: "'DM Serif Display', serif", fontSize: 36 }}>VeriLearn</h1>
          <p className="text-muted" style={{ marginTop: 6 }}>AI Learning Authenticity Evaluator</p>
        </div>

        {/* Role Selector */}
        <div className="card" style={{ marginBottom: 20 }}>
          <p className="label" style={{ marginBottom: 12 }}>I am a...</p>
          <div className="pills">
            <button className={`pill ${role === 'student' ? 'active' : ''}`} onClick={() => setRole('student')}>🎓 Student</button>
            <button className={`pill ${role === 'teacher' ? 'active' : ''}`} onClick={() => setRole('teacher')}>👩‍🏫 Teacher</button>
          </div>
        </div>

        {/* Manual Form */}
        <form onSubmit={handleLogin} className="card fade-up" style={{ padding: '24px 20px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border)' }}>
          <div className="field">
            <label className="label" style={{ fontWeight: 600, color: 'var(--text)' }}>Full Name</label>
            <input className="input" type="text" placeholder="Enter your name" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="field">
            <label className="label" style={{ fontWeight: 600, color: 'var(--text)' }}>Email</label>
            <input className="input" type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          {error && <div className="alert alert-red" style={{ marginBottom: 12 }}>{error}</div>}
          <button className="btn btn-full btn-lg" type="submit" disabled={loading} style={{ background: 'linear-gradient(135deg, var(--teal), var(--purple))', fontWeight: 600 }}>
            {loading ? '⏳ Signing in...' : `Sign in as ${role === 'teacher' ? 'Teacher' : 'Student'} →`}
          </button>
        </form>

        <p className="text-muted text-sm" style={{ textAlign: 'center', marginTop: 24, fontSize: 12 }}>
          🔒 Secured by VeriLearn Academic Authenticity & Plagiarism Guard.
        </p>
      </div>
    </div>
  );
}
