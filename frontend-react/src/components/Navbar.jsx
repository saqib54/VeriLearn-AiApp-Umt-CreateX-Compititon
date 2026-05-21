import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Navbar() {
  const { theme, toggle } = useTheme();
  const { lang, toggle: toggleLang, t } = useLanguage();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <nav className="navbar">
      <Link to={user?.role === 'teacher' ? '/teacher' : '/student'} className="nav-logo">
        <span style={{ fontSize: 24 }}>🛡️</span>
        <h1 className="gradient-text" style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22 }}>
          VeriLearn
        </h1>
        {user && (
          <span className={`badge ${user.role === 'teacher' ? 'badge-purple' : 'badge-teal'}`} style={{ marginLeft: 8 }}>
            {user.role === 'teacher' ? '👩‍🏫 Teacher' : '🎓 Student'}
          </span>
        )}
      </Link>

      <div className="nav-actions">
        {/* Language toggle */}
        <button
          onClick={toggleLang}
          title="Toggle language / زبان بدلیں"
          style={{
            height: 38, padding: '0 14px', borderRadius: 8, fontSize: 13, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid var(--border)', background: 'var(--bg-raised)',
            cursor: 'pointer', color: 'var(--teal)', letterSpacing: '0.3px',
            fontFamily: lang === 'ur' ? "'Space Grotesk', sans-serif" : "'Noto Nastaliq Urdu', sans-serif",
            transition: 'all 0.2s',
          }}
        >
          {t('langToggle')}
        </button>

        {/* Theme toggle */}
        <button
          className="btn-icon btn-outline"
          onClick={toggle}
          title="Toggle theme"
          style={{
            width: 38, height: 38, borderRadius: 8, fontSize: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid var(--border)', background: 'var(--bg-raised)',
            cursor: 'pointer', color: 'var(--text-muted)'
          }}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        {user && (
          <>
            <div className="avatar" title={user.name}>
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <button className="btn btn-outline btn-sm" onClick={handleLogout}>
              {t('signOut')}
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
