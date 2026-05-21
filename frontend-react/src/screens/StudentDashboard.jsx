import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Navbar from '../components/Navbar';
import { API_BASE } from '../config';

const MOCK_RESULTS = [
  { subject: 'Data Structures', score: 82, grade: 'B', verdict: 'Highly Authentic', date: '2026-05-20' },
  { subject: 'Operating Systems', score: 91, grade: 'A', verdict: 'Highly Authentic', date: '2026-05-18' },
  { subject: 'Computer Networks', score: 64, grade: 'C', verdict: 'Uncertain', date: '2026-05-15' },
];

export default function StudentDashboard() {
  const { user } = useAuth();
  const { t, isUrdu } = useLanguage();
  const navigate = useNavigate();
  const [active, setActive] = useState('dashboard');
  const [location, setLocation] = useState(null);
  const [locLoading, setLocLoading] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [results, setResults] = useState([]);

  // Fetch active coursework and test results dynamically from the live backend
  useEffect(() => {
    fetch(`${API_BASE}/api/assignments`)
      .then(res => res.json())
      .then(data => setAssignments(data))
      .catch(err => console.error("Error fetching assignments:", err));

    fetch(`${API_BASE}/api/results`)
      .then(res => res.json())
      .then(data => {
        // Filter results specifically for the current logged-in student
        const filtered = data.filter(r => r.studentName?.toLowerCase() === user?.name?.toLowerCase());
        setResults(filtered.length > 0 ? filtered : data);
      })
      .catch(err => console.error("Error fetching results:", err));
  }, [user]);

  const SIDEBAR = [
    { icon: '🏠', label: isUrdu ? 'ڈیش بورڈ' : 'Dashboard', key: 'dashboard' },
    { icon: '📝', label: isUrdu ? 'وائیوا شروع کریں' : 'Start Viva', key: 'viva' },
    { icon: '🖥️', label: isUrdu ? 'سکرین شیئر' : 'Screen Share', key: 'screenshare' },
    { icon: '📊', label: isUrdu ? 'میرے نتائج' : 'My Results', key: 'results' },
    { icon: '🏆', label: isUrdu ? 'لیڈر بورڈ' : 'Leaderboard', key: 'leaderboard' },
    { icon: '📍', label: isUrdu ? 'میری لوکیشن' : 'My Location', key: 'location' },
    { icon: '⚙️', label: t('settings'), key: 'settings' },
  ];

  const getLocation = () => {
    setLocLoading(true);
    navigator.geolocation?.getCurrentPosition(
      pos => { setLocation({ lat: pos.coords.latitude.toFixed(4), lng: pos.coords.longitude.toFixed(4) }); setLocLoading(false); },
      () => { setLocation({ error: t('permDenied') }); setLocLoading(false); }
    );
  };

  const currentResults = results.length > 0 ? results : MOCK_RESULTS;
  const avg = Math.round(currentResults.reduce((a, r) => a + (r.final_score || r.score || 0), 0) / currentResults.length);

  const verdictBadge = (v) => {
    if (!v) return 'badge-amber';
    if (v === 'Highly Authentic' || v.includes('Authentic') || v.includes('Original')) return 'badge-green';
    if (v === 'Uncertain' || v.includes('Assisted')) return 'badge-amber';
    return 'badge-red';
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }} dir={isUrdu ? 'rtl' : 'ltr'}>
      <Navbar />
      <div className="dashboard-layout">
        <aside className="sidebar">
          <div style={{ padding: '0 24px 16px', borderBottom: '1px solid var(--border)', marginBottom: 8 }}>
            <div className="avatar" style={{ width: 48, height: 48, fontSize: 20, marginBottom: 8 }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <p style={{ fontWeight: 600, fontSize: 14 }}>{user?.name}</p>
            <p className="text-muted text-sm">{user?.email}</p>
          </div>
          {SIDEBAR.map(item => (
            <div key={item.key} className={`sidebar-item ${active === item.key ? 'active' : ''}`}
              onClick={() => {
                if (item.key === 'viva') navigate('/viva');
                else if (item.key === 'screenshare') navigate('/screen-share');
                else setActive(item.key);
              }}>
              <span className="sidebar-icon">{item.icon}</span>
              {item.label}
            </div>
          ))}
        </aside>

        <main className="main-content">
          {/* ── Dashboard ── */}
          {active === 'dashboard' && (
            <div className="fade-up">
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, marginBottom: 4 }}>
                {t('welcomeBack')}, {user?.name?.split(' ')[0]} 👋
              </h2>
              <p className="text-muted" style={{ marginBottom: 28 }}>{t('readyViva')}</p>

              <div className="grid-4 section">
                {[
                  { num: currentResults.length, label: t('totalVivas'), icon: '📝' },
                  { num: avg + '%', label: t('avgScore'), icon: '📊' },
                  { num: currentResults.filter(r => r.grade === 'A').length, label: t('aGrades'), icon: '🏆' },
                  { num: '3', label: t('dayStreak'), icon: '🔥' },
                ].map((s, i) => (
                  <div className="card stat-card fade-up" key={i} style={{ animationDelay: `${i * 0.1}s` }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
                    <div className="stat-num">{s.num}</div>
                    <div className="stat-label">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Quick actions */}
              <div className="grid-2 section">
                <div className="card card-hover" onClick={() => navigate('/viva')}
                  style={{ border: '1px dashed var(--teal)', textAlign: 'center', padding: 32 }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📝</div>
                  <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, marginBottom: 6 }}>
                    {t('startNewViva')}
                  </h3>
                  <p className="text-muted text-sm">{t('startVivaDesc')}</p>
                </div>
                <div className="card card-hover" onClick={() => navigate('/screen-share')}
                  style={{ border: '1px dashed var(--purple)', textAlign: 'center', padding: 32 }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🖥️</div>
                  <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, marginBottom: 6 }}>
                    {isUrdu ? 'سکرین شیئر کریں' : 'Screen Share'}
                  </h3>
                  <p className="text-muted text-sm">
                    {isUrdu ? 'استاد کو اپنی سکرین لائیو دکھائیں' : 'Let your teacher view your screen live'}
                  </p>
                </div>
              </div>

              {/* AI Authenticity info */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(0,212,170,0.08), rgba(124,111,237,0.08))',
                border: '1px solid rgba(0,212,170,0.2)', borderRadius: 12, padding: '20px 24px',
                marginBottom: 28, display: 'flex', gap: 16, alignItems: 'center'
              }}>
                <div style={{ fontSize: 40 }}>🤖</div>
                <div>
                  <p style={{ fontWeight: 700, marginBottom: 4 }}>
                    {isUrdu ? 'اے آئی سے اصالت کی تصدیق' : 'AI-Powered Authenticity Verification'}
                  </p>
                  <p className="text-muted text-sm" style={{ lineHeight: 1.7 }}>
                    {isUrdu
                      ? 'ہمارا سسٹم صرف متن میچ نہیں کرتا بلکہ آپ کے جوابات کا تجزیہ کرکے اصلی سمجھ اور کاپی شدہ مواد میں فرق کرتا ہے۔'
                      : 'Our system analyzes how you explain concepts to distinguish genuine understanding from copied or AI-generated content.'}
                  </p>
                </div>
              </div>

              {/* Dynamic Published Coursework from Teacher */}
              <div className="section">
                <div className="section-title">👩‍🏫 {isUrdu ? 'استاد کے شائع کردہ اسائنمنٹس' : 'Active Published Coursework & Assignments'}</div>
                {assignments.length === 0 ? (
                  <div className="card" style={{ padding: 24, textAlign: 'center' }}>
                    <p className="text-muted text-sm">
                      {isUrdu ? 'ابھی تک استاد نے کوئی نیا اسائنمنٹ شائع نہیں کیا۔' : 'No active coursework published by the teacher yet.'}
                    </p>
                  </div>
                ) : (
                  <div className="grid-2" style={{ gap: 16, marginBottom: 24 }}>
                    {assignments.map((asm) => (
                      <div className="card card-hover fade-up" key={asm.id} style={{
                        border: '1px solid rgba(124,111,237,0.3)',
                        display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                      }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <span className="badge badge-purple" style={{ fontSize: 10 }}>📚 {asm.subject}</span>
                            <span className="badge badge-teal" style={{ fontSize: 10 }}>⚡ {asm.difficulty}</span>
                          </div>
                          <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{asm.title}</h4>
                          <p className="text-muted text-xs" style={{
                            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                            overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.6, marginBottom: 12
                          }}>
                            {asm.content}
                          </p>
                        </div>
                        <button
                          className="btn btn-sm btn-outline btn-full animate-pulse"
                          style={{ borderColor: 'var(--teal)', color: 'var(--teal)', fontWeight: 600 }}
                          onClick={() => {
                            // Save selected coursework context into localstorage and navigate to start viva instantly!
                            localStorage.setItem('vl-prepopulated-text', asm.content);
                            localStorage.setItem('vl-prepopulated-difficulty', asm.difficulty?.toLowerCase());
                            navigate('/viva');
                          }}
                        >
                          🚀 {isUrdu ? 'وائیوا ٹیسٹ شروع کریں' : 'Start Viva Exam'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent results table */}
              <div className="section">
                <div className="section-title">{t('recentEvals')}</div>
                <div className="card">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>{t('subject')}</th><th>{t('score')}</th><th>{t('grade')}</th>
                        <th>{t('verdict')}</th><th>{t('date')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentResults.map((r, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 500 }}>{r.subject}</td>
                          <td><span className="mono" style={{ color: 'var(--teal)' }}>{r.final_score || r.score || 0}/100</span></td>
                          <td><span className="badge badge-teal">{r.grade}</span></td>
                          <td><span className={`badge ${verdictBadge(r.authenticity_verdict || r.verdict)}`}>{r.authenticity_verdict || r.verdict}</span></td>
                          <td className="text-muted text-sm">{r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : r.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── My Results ── */}
          {active === 'results' && (
            <div className="fade-up">
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, marginBottom: 24 }}>
                {t('myResults')}
              </h2>
              {currentResults.map((r, i) => (
                <div className="card card-hover" key={i} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <p style={{ fontWeight: 600, marginBottom: 2 }}>{r.subject}</p>
                      <p className="text-muted text-sm">{r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : r.date}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <span className="mono text-teal" style={{ fontSize: 24, fontWeight: 700 }}>{r.final_score || r.score || 0}</span>
                      <span className="badge badge-teal">{r.grade}</span>
                      <span className={`badge ${verdictBadge(r.authenticity_verdict || r.verdict)}`}>{r.authenticity_verdict || r.verdict}</span>
                    </div>
                  </div>
                  <div className="metric-track" style={{ marginTop: 12 }}>
                    <div className="metric-fill" style={{ width: `${r.final_score || r.score}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Leaderboard ── */}
          {active === 'leaderboard' && (
            <div className="fade-up">
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, marginBottom: 24 }}>
                {t('leaderboard')}
              </h2>
              <div className="card">
                {[
                  { rank: 1, name: 'Ali Hassan', score: 95, badge: '🥇' },
                  { rank: 2, name: user?.name || 'You', score: avg, badge: '🥈', isYou: true },
                  { rank: 3, name: 'Sara Khan', score: 78, badge: '🥉' },
                  { rank: 4, name: 'Ahmed Raza', score: 71, badge: '' },
                  { rank: 5, name: 'Fatima Malik', score: 68, badge: '' },
                ].map((s, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 16, padding: '14px 0',
                    borderBottom: i < 4 ? '1px solid var(--border)' : 'none',
                    background: s.isYou ? 'rgba(0,212,170,0.06)' : '',
                    borderRadius: s.isYou ? 8 : 0, paddingLeft: s.isYou ? 12 : 0
                  }}>
                    <span className="mono" style={{ width: 32, textAlign: 'center', fontSize: 20 }}>
                      {s.badge || s.rank}
                    </span>
                    <span style={{ flex: 1, fontWeight: s.isYou ? 700 : 400 }}>
                      {s.name} {s.isYou && <span className="badge badge-teal" style={{ marginLeft: 6 }}>You</span>}
                    </span>
                    <span className="mono text-teal" style={{ fontWeight: 700, fontSize: 18 }}>{s.score}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Location ── */}
          {active === 'location' && (
            <div className="fade-up">
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, marginBottom: 24 }}>
                {t('myLocation')}
              </h2>
              <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>📍</div>
                {!location && <p className="text-muted" style={{ marginBottom: 20 }}>{t('allowLocation')}</p>}
                {location?.error && <div className="alert alert-red" style={{ marginBottom: 16 }}>{location.error}</div>}
                {location && !location.error && (
                  <div className="alert alert-green" style={{ marginBottom: 16 }}>
                    📍 Latitude: <strong>{location.lat}</strong> | Longitude: <strong>{location.lng}</strong>
                  </div>
                )}
                <button className="btn" onClick={getLocation} disabled={locLoading}>
                  {locLoading ? t('gettingLocation') : t('getLocation')}
                </button>
              </div>
            </div>
          )}

          {/* ── Settings ── */}
          {active === 'settings' && (
            <div className="fade-up">
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, marginBottom: 24 }}>
                {t('settings')}
              </h2>
              <div className="card">
                {[
                  ['Name', user?.name],
                  ['Email', user?.email],
                  ['Role', user?.role === 'student' ? '🎓 Student' : '👩‍🏫 Teacher'],
                ].map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
                    <p style={{ fontWeight: 500 }}>{label}</p>
                    <p className="text-muted">{val}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Dynamic Bottom Navigation Bar */}
      <div className="mobile-bottom-nav">
        {SIDEBAR.map(item => (
          <div
            key={item.key}
            className={`mobile-nav-item ${active === item.key ? 'active' : ''}`}
            onClick={() => {
              if (item.key === 'viva') navigate('/viva');
              else if (item.key === 'screenshare') navigate('/screen-share');
              else setActive(item.key);
            }}
          >
            <span className="mobile-nav-icon">{item.icon}</span>
            <span className="mobile-nav-label">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
