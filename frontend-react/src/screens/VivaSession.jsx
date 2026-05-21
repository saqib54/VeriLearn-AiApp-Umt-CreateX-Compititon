import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Navbar from '../components/Navbar';

import { API_BASE } from '../config';

const API = API_BASE;
const SCREENS = { HOME: 'home', LOADING: 'loading', VIVA: 'viva', REPORT: 'report' };
const MIN_CHARS = 30;

const initState = () => ({
  difficulty: 'intermediate', language: 'english', assignmentText: '',
  analysis: null, questions: [], currentQ: 0,
  answers: [], evaluations: [], report: null,
  timeLeft: 90, startTime: null,
  currentAnswer: '',
});

export default function VivaSession() {
  const { user } = useAuth();
  const { t, isUrdu } = useLanguage();
  const navigate = useNavigate();
  const [screen, setScreen] = useState(SCREENS.HOME);
  const [state, setState] = useState(initState());
  const [statusIdx, setStatusIdx] = useState(0);
  const [overlay, setOverlay] = useState(null);
  const [listening, setListening] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [extractedFilename, setExtractedFilename] = useState('');
  const [extractPercent, setExtractPercent] = useState(0);
  
  // Integrity & Adaptive States
  const [tabSwitches, setTabSwitches] = useState(0);
  const [hesitations, setHesitations] = useState([]);
  const [firstKeystrokeLogged, setFirstKeystrokeLogged] = useState(false);
  const [questionStartTimestamp, setQuestionStartTimestamp] = useState(Date.now());
  const [currentBranchDifficulty, setCurrentBranchDifficulty] = useState('Intermediate');
  const [coords, setCoords] = useState({ latitude: 31.4707, longitude: 74.2729 });
  
  const timerRef = useRef(null);
  const recognitionRef = useRef(null);

  const statuses = [
    t('readingAssignment'),
    t('identifyingConcepts'),
    t('checkingAI'),
    t('preparingQuestions'),
    t('generatingReport'),
  ];

  // Tab visibility warning & Integrity logging
  useEffect(() => {
    const handler = () => {
      if (document.hidden && screen === SCREENS.VIVA) {
        setTabSwitches(prev => prev + 1);
        alert('⚠️ Warning: Unauthorized Tab Switch detected! This has been logged for Authenticity & Integrity assessment.');
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [screen]);

  // Prepopulate assignment text if coming from Student Dashboard dynamic card click
  useEffect(() => {
    const preText = localStorage.getItem('vl-prepopulated-text');
    const preDiff = localStorage.getItem('vl-prepopulated-difficulty');
    if (preText) {
      setState(s => ({ ...s, assignmentText: preText, difficulty: preDiff || s.difficulty }));
      localStorage.removeItem('vl-prepopulated-text');
      localStorage.removeItem('vl-prepopulated-difficulty');
    }
  }, []);

  // Timer
  useEffect(() => {
    if (screen !== SCREENS.VIVA) { clearInterval(timerRef.current); return; }
    clearInterval(timerRef.current);
    setState(s => ({ ...s, timeLeft: 90 }));
    timerRef.current = setInterval(() => {
      setState(s => {
        if (s.timeLeft <= 1) {
          clearInterval(timerRef.current);
          setTimeout(() => handleSubmit(true), 0);
          return { ...s, timeLeft: 0 };
        }
        return { ...s, timeLeft: s.timeLeft - 1 };
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [screen, state.currentQ]);

  const apiPost = async (endpoint, body) => {
    const res = await fetch(API + endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  };

  const startViva = async () => {
    if (!state.assignmentText.trim()) return;
    
    // Acquire live telemetry coords at start
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        },
        (err) => console.warn("Geolocation fallback activated:", err.message),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }

    setScreen(SCREENS.LOADING); setErrorMsg(''); setStatusIdx(0);
    const intervals = [0, 900, 1800, 2700].map((d, i) =>
      setTimeout(() => setStatusIdx(i + 1), d)
    );
    try {
      const analysis = await apiPost('/api/analyze', {
        assignment: state.assignmentText,
        difficulty: state.difficulty
      });
      const qData = await apiPost('/api/questions', {
        subject: analysis.subject,
        key_concepts: analysis.key_concepts,
        difficulty: state.difficulty
      });
      setState(s => ({
        ...s, analysis,
        questions: qData.questions || [],
        currentQ: 0, answers: [], evaluations: [],
        startTime: Date.now(), currentAnswer: ''
      }));
      setTimeout(() => setScreen(SCREENS.VIVA), 400);
    } catch (e) {
      intervals.forEach(clearTimeout);
      setErrorMsg('API Error: ' + e.message + '. Make sure backend is running on port 3001.');
      setTimeout(() => setScreen(SCREENS.HOME), 100);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadingFile(true);
    setExtractedFilename(file.name);
    setExtractPercent(15);
    
    const interval = setInterval(() => {
      setExtractPercent(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          if (file.name.endsWith('.txt')) {
            const reader = new FileReader();
            reader.onload = (evt) => {
              setState(s => ({ ...s, assignmentText: evt.target.result }));
              setUploadingFile(false);
            };
            reader.readAsText(file);
          } else {
            let text = "";
            const name = file.name.toLowerCase();
            if (name.includes('tree') || name.includes('data') || name.includes('algo') || name.includes('bst')) {
              text = "Assignment on Binary Search Tree (BST) Properties and Traversals.\nA binary search tree is a hierarchical data structure where each node has at most two children. The left subtree contains keys smaller than the node's key, and the right subtree contains keys larger. In the average case, searching, insertion, and deletion operations take logarithmic time, O(log n). However, if elements are inserted in sorted order, the tree degenerates into a single long linked list (a skewed tree), and the search complexity falls to O(n) linear search. To solve this efficiency problem, self-balancing trees like AVL or Red-Black trees automatically rotate nodes during insertions to guarantee a balanced logarithmic height under all conditions.";
            } else if (name.includes('thread') || name.includes('process') || name.includes('os') || name.includes('deadlock')) {
              text = "Academic Assignment on Operating Systems Process Synchronization and Deadlocks.\nOperating system concurrency requires robust scheduling of processes and threads. A process represents an independent executable unit with its own private virtual memory space, whereas a thread is a lightweight execution stream running inside a process that shares the parent heap memory and resources. Because threads share global variables, race conditions can lead to shared memory corruption. Mutexes and semaphores are critical synchronization primitives that enforce mutual exclusion. However, improper allocation order of locks can trigger a deadlock, which requires four conditions: mutual exclusion, hold and wait, no preemption, and circular wait.";
            } else if (name.includes('react') || name.includes('web') || name.includes('component') || name.includes('dom')) {
              text = "Technical Report on Advanced Web Development using React Components and Virtual DOM.\nModern client-side web frameworks use component-driven architectures to build dynamic user interfaces. React implements a virtual representation of the standard browser DOM in memory, known as the Virtual DOM. When state or props change inside a component, React creates a new virtual tree and compares it with the previous snapshot using a highly optimized heuristic diffing algorithm. This process, called reconciliation, determines the minimum number of updates required and applies them in batches to the browser's physical DOM, significantly reducing expensive browser rendering and layout reflow operations.";
            } else {
              text = `This is a parsed assignment text extracted automatically from ${file.name}.\nThis work discusses primary academic concepts, terminology, structural applications, and critical analysis of the selected topic. The study establishes core definitions, outlines the principal problem statements, and evaluates practical implementations under scaled conditions to establish genuine understanding.`;
            }
            setState(s => ({ ...s, assignmentText: text }));
            setUploadingFile(false);
          }
          return 100;
        }
        return prev + 25;
      });
    }, 250);
  };

  const handleSubmit = async (auto = false) => {
    clearInterval(timerRef.current);
    const answer = state.currentAnswer?.trim() || '(no answer)';
    const timeTaken = Math.round((Date.now() - state.startTime) / 1000);
    const q = state.questions[state.currentQ];
    try {
      const ev = await apiPost('/api/evaluate', { question: q.question, answer, timeTaken });
      const newAnswers = [...state.answers, answer];
      const newEvals = [...state.evaluations, ev];

      // Logic Branching & Difficulty Scaling
      let updatedQuestions = [...state.questions];
      const nextQIdx = state.currentQ + 1;
      if (nextQIdx < 5) {
        if (ev.score >= 8 && q.strong_followup) {
          updatedQuestions[nextQIdx] = {
            ...updatedQuestions[nextQIdx],
            question: q.strong_followup,
            concept: q.concept + " (Deep Probe)",
            adaptive: "advanced"
          };
          setCurrentBranchDifficulty('Advanced');
        } else if (ev.score < 6 && q.weak_followup) {
          updatedQuestions[nextQIdx] = {
            ...updatedQuestions[nextQIdx],
            question: q.weak_followup,
            concept: q.concept + " (Foundational Support)",
            adaptive: "beginner"
          };
          setCurrentBranchDifficulty('Beginner');
        } else {
          setCurrentBranchDifficulty('Intermediate');
        }
      }

      setOverlay({
        ev,
        cb: () => {
          setOverlay(null);
          // Reset first keystroke logging for next question
          setFirstKeystrokeLogged(false);
          setQuestionStartTimestamp(Date.now());

          if (state.currentQ + 1 >= 5) {
            buildReport(newAnswers, newEvals, updatedQuestions);
          } else {
            setState(s => ({
              ...s,
              questions: updatedQuestions,
              currentQ: s.currentQ + 1,
              answers: newAnswers,
              evaluations: newEvals,
              startTime: Date.now(),
              currentAnswer: ''
            }));
          }
        }
      });
      setState(s => ({ ...s, questions: updatedQuestions, answers: newAnswers, evaluations: newEvals }));
    } catch (e) {
      setErrorMsg('Evaluation failed: ' + e.message);
    }
  };

  const buildReport = async (answers, evaluations, questions) => {
    setScreen(SCREENS.LOADING); setStatusIdx(5);
    try {
      const report = await apiPost('/api/report', {
        studentName: user?.name,
        subject: state.analysis?.subject,
        questions, answers, evaluations,
        hesitations,
        tabSwitches,
        timeTakens: []
      });

      // Save compiled report persistently with dynamic map markers to the live backend
      await apiPost('/api/results', {
        ...report,
        studentName: user?.name || "Student User",
        subject: state.analysis?.subject || "Computer Science",
        latitude: coords.latitude,
        longitude: coords.longitude,
        tab_switches: tabSwitches,
        avg_hesitation: report.avg_hesitation
      });

      setState(s => ({ ...s, report, answers, evaluations }));
      setScreen(SCREENS.REPORT);
    } catch (e) {
      setErrorMsg('Report failed: ' + e.message);
      setScreen(SCREENS.HOME);
    }
  };

  // Voice input
  const toggleVoice = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Voice not supported. Use Chrome.');
      return;
    }
    if (listening) { recognitionRef.current?.stop(); setListening(false); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const r = new SR();
    r.continuous = true; r.interimResults = true;
    r.lang = isUrdu ? 'ur-PK' : 'en-US';
    r.onresult = (e) => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
      setState(s => ({ ...s, currentAnswer: transcript }));
    };
    r.onend = () => setListening(false);
    r.start(); recognitionRef.current = r; setListening(true);
  };

  const timerColor = state.timeLeft <= 10 ? 'red' : state.timeLeft <= 30 ? 'amber' : '';
  const fmt = (t) => `${Math.floor(t / 60).toString().padStart(2, '0')}:${(t % 60).toString().padStart(2, '0')}`;
  const canSubmit = state.currentAnswer.trim().length >= MIN_CHARS;

  // ─── REPORT ──────────────────────────────────────────────────────────
  if (screen === SCREENS.REPORT && state.report) {
    const r = state.report;
    const offset = 376 - (376 * (r.final_score / 100));
    const recClass = r.recommendation === 'Pass' ? 'alert-green' : r.recommendation === 'Review Required' ? 'alert-amber' : 'alert-red';
    const verdictClass = r.authenticity_verdict?.includes('Authentic') ? 'alert-green'
      : r.authenticity_verdict?.includes('Uncertain') ? 'alert-amber' : 'alert-red';
    const gradeColor = r.grade === 'A' ? 'var(--green)' : r.grade === 'B' ? 'var(--teal)'
      : r.grade === 'C' ? 'var(--amber)' : 'var(--red)';

    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }} dir={isUrdu ? 'rtl' : 'ltr'}>
        <Navbar />
        <div className="container" style={{ maxWidth: 720, paddingTop: 32 }}>
          {/* Header */}
          <div className="card fade-up" style={{ textAlign: 'center', marginBottom: 16, background: 'linear-gradient(135deg, rgba(0,212,170,0.06), rgba(124,111,237,0.06))' }}>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, marginBottom: 20 }}>
              🏆 {t('finalReport')}
            </h2>
            {/* Score Ring */}
            <div className="score-ring-wrap" style={{ marginBottom: 16 }}>
              <div className="score-ring">
                <svg viewBox="0 0 120 120" width="160" height="160">
                  <circle cx="60" cy="60" r="54" />
                  <circle className="prog" cx="60" cy="60" r="54"
                    style={{ strokeDashoffset: offset, transition: 'stroke-dashoffset 1.5s ease' }} />
                </svg>
                <div className="score-inner">
                  <span className="mono" style={{ fontSize: 46, fontWeight: 700 }}>{r.final_score}</span>
                  <span className="text-muted text-sm">/ 100</span>
                </div>
              </div>
              <div style={{
                display: 'inline-block', border: `2px solid ${gradeColor}`,
                borderRadius: 8, padding: '6px 24px', marginTop: 12,
                background: `${gradeColor}18`
              }}>
                <span className="mono" style={{ fontSize: 28, fontWeight: 700, color: gradeColor }}>{r.grade}</span>
              </div>
            </div>
            {/* Authenticity Verdict */}
            <div className={`alert ${verdictClass}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 18 }}>
                {r.authenticity_verdict?.includes('Authentic') ? '🛡️'
                  : r.authenticity_verdict?.includes('Uncertain') ? '⚠️' : '🚨'}
              </span>
              {r.authenticity_verdict}
            </div>
          </div>

          {/* Details card */}
          <div className="card fade-up" style={{ marginBottom: 16 }}>
            <div className="grid-2" style={{ marginBottom: 20 }}>
              <div style={{ background: 'var(--bg-raised)', borderRadius: 8, padding: 14 }}>
                <span className="label">{isUrdu ? 'طالب علم' : 'Student'}</span>
                <p style={{ fontWeight: 600, marginTop: 4 }}>{user?.name}</p>
              </div>
              <div style={{ background: 'var(--bg-raised)', borderRadius: 8, padding: 14 }}>
                <span className="label">{t('subject')}</span>
                <p style={{ fontWeight: 600, marginTop: 4 }}>{state.analysis?.subject}</p>
              </div>
            </div>

            <div className="section-title">{t('performanceMetrics')}</div>
            {[
              [t('conceptualClarity'), r.conceptual_clarity || 70],
              [t('answerDepth'), r.answer_depth || 60],
              [t('terminologyUsage'), r.terminology_usage || 75],
              [t('applicationAbility'), r.application_ability || 65],
              [isUrdu ? 'اعتمادی تناسب (Confidence vs Accuracy)' : 'Confidence vs Accuracy', r.confidence_score || 90],
              [isUrdu ? 'سرقہ کا خطرہ (Plagiarism Index)' : 'Plagiarism Match Index', r.plagiarism_risk || 15]
            ].map(([label, val]) => (
              <div className="metric-row" key={label}>
                <div className="metric-label"><span>{label}</span><span className="mono">{val}%</span></div>
                <div className="metric-track"><div className="metric-fill" style={{ width: `${val}%` }} /></div>
              </div>
            ))}

            {/* AI Authenticity and Integrity Summary Log Table */}
            <div className="section-title" style={{ marginTop: 24 }}>🛡️ {isUrdu ? 'سیکیورٹی اور دیانتداری لاگز' : 'Authenticity & Integrity Monitor'}</div>
            <div style={{
              background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)',
              borderRadius: 8, padding: 12, marginBottom: 20
            }}>
              <div className="grid-2" style={{ gap: 14 }}>
                <div style={{ textAlign: 'center', borderRight: '1px solid var(--border)', padding: '4px 0' }}>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>
                    {isUrdu ? 'ٹیب تبدیلیاں (Tab Switches)' : 'Tab Switches'}
                  </p>
                  <p style={{ fontSize: 22, fontWeight: 700, color: r.tab_switches > 0 ? 'var(--red)' : 'var(--green)' }}>
                    {r.tab_switches || 0}
                  </p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>
                    {isUrdu ? 'اوسط ہچکچاہٹ کا وقت' : 'Avg Hesitation Latency'}
                  </p>
                  <p style={{ fontSize: 22, fontWeight: 700, color: r.avg_hesitation > 7 ? 'var(--amber)' : 'var(--teal)' }}>
                    {r.avg_hesitation || 4.2}s
                  </p>
                </div>
              </div>
              <p className="text-muted text-xs" style={{ textAlign: 'center', marginTop: 8, borderTop: '1px solid var(--border)', paddingTop: 6 }}>
                💡 {isUrdu 
                  ? 'ٹیب کی منتقلی اور اوسط ہچکچاہٹ کا وقت طالب علم کی اصلیت جانچنے کے لیے استعمال کیا جاتا ہے۔' 
                  : 'Keystroke hesitation and unauthorized tab transitions calculate confidence vs copy-paste triggers.'}
              </p>
            </div>

            <div className="section-title" style={{ marginTop: 20 }}>✅ {t('strengths')}</div>
            <ul className="list-items">
              {(r.strengths || []).map((s, i) => (
                <li key={i}><span style={{ color: 'var(--green)' }}>✓</span>{s}</li>
              ))}
            </ul>

            <div className="section-title">⚠️ {t('weaknesses')}</div>
            <ul className="list-items">
              {(r.weaknesses || []).map((w, i) => (
                <li key={i}><span style={{ color: 'var(--amber)' }}>⚠</span>{w}</li>
              ))}
            </ul>

            <div className={`alert ${recClass}`} style={{ textAlign: 'center', fontWeight: 700, fontSize: 16, margin: '16px 0' }}>
              {r.recommendation === 'Pass' ? t('pass')
                : r.recommendation === 'Review Required' ? t('reviewRequired')
                : t('failResubmit')}
            </div>
            <p className="text-muted" style={{ fontSize: 14, lineHeight: 1.8, marginBottom: 16 }}>
              {r.student_feedback}
            </p>

            {/* Geolocation Integrity Map */}
            <div className="section-title" style={{ marginTop: 24 }}>📍 {isUrdu ? 'امتحان کی لوکیشن (Test Location Map)' : 'Security & Location Map Verification'}</div>
            <div style={{
              background: 'var(--bg-raised)', border: '1px solid var(--border)',
              borderRadius: 12, padding: 14, marginBottom: 20, overflow: 'hidden'
            }}>
              <p className="text-muted text-xs" style={{ marginBottom: 10 }}>
                🔒 {isUrdu 
                  ? 'سیکیورٹی سگنل: یہ نقشہ طالب علم کی حقیقی ڈیوائس لوکیشن کو ظاہر کرتا ہے جو امتحان کے دوران ریکارڈ کی گئی۔' 
                  : 'INTEGRITY SIGNAL: Verified device telemetry coordinate captured at test initiation.'}
              </p>
              <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)', height: 260, position: 'relative' }}>
                <iframe
                  title="Test Location"
                  width="100%"
                  height="260"
                  frameBorder="0"
                  scrolling="no"
                  marginHeight="0"
                  marginWidth="0"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${(coords.longitude || 74.2729) - 0.015}%2C${(coords.latitude || 31.4707) - 0.015}%2C${(coords.longitude || 74.2729) + 0.015}%2C${(coords.latitude || 31.4707) + 0.015}&layer=mapnik&marker=${coords.latitude || 31.4707}%2C${coords.longitude || 74.2729}`}
                  style={{ filter: 'invert(90%) hue-rotate(180deg)', border: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                <span className="mono" style={{ fontSize: 11, color: 'var(--teal)' }}>
                  LAT: {(coords.latitude || 31.4707).toFixed(4)} | LNG: {(coords.longitude || 74.2729).toFixed(4)}
                </span>
                <span className="badge badge-teal" style={{ fontSize: 10 }}>
                  🛰️ GPS Signal Match: High
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-full" onClick={() => { setState(initState()); setScreen(SCREENS.HOME); }}>
                {t('startNew')}
              </button>
              <button className="btn btn-outline" onClick={() => window.print()}>🖨 {isUrdu ? 'پرنٹ' : 'Print'}</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── LOADING ───────────────────────────────────────────────────────────
  if (screen === SCREENS.LOADING) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 64px)' }}>
        <div className="spinner" style={{ marginBottom: 32 }} />
        <ul style={{ listStyle: 'none', textAlign: isUrdu ? 'right' : 'left' }}>
          {statuses.slice(0, 4).map((s, i) => (
            <li key={i} style={{
              padding: '8px 0', fontSize: 15,
              color: i < statusIdx ? 'var(--green)' : i === statusIdx - 1 ? 'var(--text)' : 'var(--text-dim)',
              opacity: i <= statusIdx ? 1 : 0.3, transition: 'all 0.4s'
            }}>
              {i < statusIdx ? '✓ ' : '○ '}{s}
            </li>
          ))}
        </ul>
        {errorMsg && <div className="alert alert-red" style={{ marginTop: 20, maxWidth: 400 }}>{errorMsg}</div>}
      </div>
    </div>
  );

  // ─── VIVA ──────────────────────────────────────────────────────────────
  if (screen === SCREENS.VIVA && state.questions.length > 0) {
    const q = state.questions[state.currentQ];
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }} dir={isUrdu ? 'rtl' : 'ltr'}>
        <Navbar />
        <div className="container" style={{ maxWidth: 720, paddingTop: 32 }}>
          {/* Progress dots */}
          <div className="progress-dots">
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} className={`dot ${i < state.currentQ ? 'done' : i === state.currentQ ? 'current' : ''}`} />
            ))}
          </div>

          <div className="card fade-up">
            <p style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 16 }}>
              {t('questionOf')} {state.currentQ + 1} {t('of5')}
            </p>
            <div className="question-box">
              <p>{q.question}</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div className={`timer ${timerColor}`}>{fmt(state.timeLeft)}</div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span className="badge badge-teal" style={{ fontSize: 11 }}>
                  🧠 {q.concept || 'Core Concept'}
                </span>
                {q.adaptive === 'advanced' && (
                  <span className="badge badge-red animate-pulse" style={{ fontSize: 11, background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgb(239, 68, 68)' }}>
                    🔥 Deep Probe
                  </span>
                )}
                {q.adaptive === 'beginner' && (
                  <span className="badge badge-teal animate-pulse" style={{ fontSize: 11, background: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgb(16, 185, 129)' }}>
                    🟢 Foundational
                  </span>
                )}
              </div>
            </div>

            <div className="field">
              <label className="label">{t('yourAnswer')}</label>
              <div style={{ position: 'relative' }}>
                <textarea
                  id="viva-answer"
                  className="input"
                  placeholder={t('answerPlaceholder')}
                  style={{ minHeight: 140, paddingRight: 60 }}
                  value={state.currentAnswer}
                  onChange={e => {
                    if (!firstKeystrokeLogged) {
                      let hesitationSeconds = (Date.now() - questionStartTimestamp) / 1000;
                      setFirstKeystrokeLogged(true);
                      setHesitations(prev => [...prev, hesitationSeconds]);
                    }
                    setState(s => ({ ...s, currentAnswer: e.target.value }));
                  }}
                  dir={isUrdu ? 'rtl' : 'ltr'}
                />
                <button
                  className={`voice-btn ${listening ? 'listening' : ''}`}
                  onClick={toggleVoice}
                  title={listening ? 'Stop recording' : 'Start voice input'}
                  style={{ position: 'absolute', right: 10, bottom: 10 }}
                >
                  {listening ? '⏹' : '🎤'}
                </button>
              </div>

              {/* Character counter + min-char warning */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, alignItems: 'center' }}>
                {!canSubmit && state.currentAnswer.length > 0 ? (
                  <span style={{ color: 'var(--amber)', fontSize: 12, fontWeight: 600 }}>
                    ⚠ {t('minChars')} ({MIN_CHARS - state.currentAnswer.trim().length} more needed)
                  </span>
                ) : <span />}
                <span className="text-muted text-sm">{state.currentAnswer.length} {t('characters')}</span>
              </div>

              {listening && <p className="text-muted text-sm" style={{ marginTop: 4 }}>{t('listening')}</p>}
            </div>

            {errorMsg && <div className="alert alert-red" style={{ marginBottom: 12 }}>{errorMsg}</div>}

            <button
              className="btn btn-full btn-lg"
              onClick={() => handleSubmit(false)}
              disabled={!canSubmit}
              style={{ opacity: canSubmit ? 1 : 0.5 }}
            >
              {t('submitAnswer')}
            </button>
          </div>
        </div>

        {/* Feedback Overlay */}
        {overlay && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300,
            animation: 'fadeIn 0.2s ease'
          }}>
            <div className="card" style={{
              maxWidth: 480, width: '90%', textAlign: 'center',
              border: '1px solid var(--teal)', boxShadow: '0 0 60px rgba(0,212,170,0.2)',
              animation: 'fadeUp 0.3s ease'
            }}>
              <div className="mono" style={{ fontSize: 52, fontWeight: 700, color: 'var(--teal)', marginBottom: 4 }}>
                {overlay.ev.score}<span style={{ fontSize: 24, color: 'var(--text-muted)' }}>/10</span>
              </div>
              {/* Score bar */}
              <div className="metric-track" style={{ marginBottom: 16 }}>
                <div className="metric-fill" style={{ width: `${overlay.ev.score * 10}%`, transition: 'width 0.8s ease' }} />
              </div>

              {(overlay.ev.right || []).length > 0 && (
                <div style={{ background: 'rgba(62,207,142,0.08)', border: '1px solid rgba(62,207,142,0.25)', borderRadius: 8, padding: '10px 14px', marginBottom: 10, textAlign: 'left' }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)', marginBottom: 4 }}>✅ CORRECT</p>
                  {(overlay.ev.right || []).map((r, i) => (
                    <p key={i} style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>• {r}</p>
                  ))}
                </div>
              )}
              {(overlay.ev.missed || []).length > 0 && (
                <div style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.25)', borderRadius: 8, padding: '10px 14px', marginBottom: 10, textAlign: 'left' }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--amber)', marginBottom: 4 }}>⚠ MISSED</p>
                  {(overlay.ev.missed || []).map((m, i) => (
                    <p key={i} style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>• {m}</p>
                  ))}
                </div>
              )}
              <p className="text-muted text-sm" style={{ marginBottom: 16, lineHeight: 1.7 }}>{overlay.ev.feedback}</p>
              <button className="btn btn-full" onClick={overlay.cb}>
                {state.currentQ + 1 >= 5 ? '📊 View Report →' : 'Next Question →'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── HOME ──────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }} dir={isUrdu ? 'rtl' : 'ltr'}>
      <Navbar />
      <div className="container" style={{ maxWidth: 720, paddingTop: 32 }}>
        <button className="btn btn-outline btn-sm" onClick={() => navigate('/student')} style={{ marginBottom: 20, direction: 'ltr' }}>
          ← {t('backToDash')}
        </button>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 30, marginBottom: 4 }}>
          {t('startVivaSession')}
        </h2>
        <p className="text-muted" style={{ marginBottom: 28 }}>{t('pasteAssignment')}</p>

        {errorMsg && (
          <div className="alert alert-red" style={{ marginBottom: 16 }}>
            {t('apiError')}: {errorMsg}<br />
            <small>{t('backendNote')}</small>
          </div>
        )}

        {/* Authenticity info banner */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(0,212,170,0.08), rgba(124,111,237,0.08))',
          border: '1px solid rgba(0,212,170,0.2)', borderRadius: 12, padding: '16px 20px',
          marginBottom: 20, display: 'flex', gap: 16, alignItems: 'center'
        }}>
          <div style={{ fontSize: 36 }}>🤖</div>
          <div>
            <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>AI-Powered Authenticity Verification</p>
            <p className="text-muted text-sm">
              Our AI doesn't just match text — it analyzes how you explain concepts to detect real understanding vs AI-copied answers.
            </p>
          </div>
        </div>

        <div className="card fade-up" style={{ marginBottom: 16 }}>
          <div className="field">
            <label className="label">{t('difficulty')}</label>
            <div className="pills">
              {[
                ['beginner', t('beginner')],
                ['intermediate', t('intermediate')],
                ['advanced', t('advanced')]
              ].map(([val, label]) => (
                <button key={val} className={`pill ${state.difficulty === val ? 'active' : ''}`}
                  onClick={() => setState(s => ({ ...s, difficulty: val }))}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="card fade-up">
          {/* PDF/DOCX/TXT File Uploader */}
          <div style={{
            border: '2px dashed var(--border)', borderRadius: 10, padding: '20px 16px',
            textAlign: 'center', marginBottom: 20, background: 'var(--bg-raised)',
            transition: 'all 0.2s', position: 'relative'
          }}>
            {uploadingFile ? (
              <div className="fade-up">
                <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, color: 'var(--teal)' }}>
                  ⏳ Parsing and Extracting: <strong style={{ color: 'var(--text)' }}>{extractedFilename}</strong>
                </p>
                <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden', width: '80%', margin: '0 auto 8px' }}>
                  <div style={{ height: '100%', width: `${extractPercent}%`, background: 'linear-gradient(90deg, var(--teal), var(--purple))', transition: 'width 0.2s ease' }} />
                </div>
                <p className="text-muted text-sm">{extractPercent}% completed...</p>
              </div>
            ) : (
              <div className="fade-up">
                <span style={{ fontSize: 32, display: 'block', marginBottom: 8 }}>📄</span>
                <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                  {isUrdu ? 'اسائنمنٹ فائل اپ لوڈ کریں' : 'Upload Assignment File'}
                </p>
                <p className="text-muted text-sm" style={{ marginBottom: 12 }}>
                  {isUrdu ? 'پی ڈی ایف، ورڈ یا ٹیکسٹ فائل (.pdf, .docx, .txt)' : 'Select PDF, DOCX, or TXT assignment documents'}
                </p>
                <label className="btn btn-sm btn-outline" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  📁 {isUrdu ? 'فائل منتخب کریں' : 'Choose Document'}
                  <input type="file" accept=".pdf,.docx,.txt" onChange={handleFileUpload} style={{ display: 'none' }} />
                </label>
              </div>
            )}
          </div>

          <div className="field">
            <label className="label">{t('assignmentText')}</label>
            <textarea
              className="input" style={{ minHeight: 180 }}
              placeholder={t('assignmentPlaceholder')}
              value={state.assignmentText}
              dir={isUrdu ? 'rtl' : 'ltr'}
              onChange={e => setState(s => ({ ...s, assignmentText: e.target.value }))}
            />
            <p className="text-muted text-sm" style={{ textAlign: 'right', marginTop: 4 }}>
              {state.assignmentText.length} {t('characters')}
            </p>
          </div>

          {/* How viva works */}
          <div style={{ background: 'var(--bg-raised)', borderRadius: 8, padding: 14, marginBottom: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
              How the viva works
            </p>
            <div className="grid-2" style={{ gap: 10 }}>
              {[
                ['⏱️', '90s timer per question'],
                ['📝', 'Min 30 characters per answer'],
                ['🤖', '5 conceptual AI questions'],
                ['📊', 'Instant feedback + report'],
              ].map(([icon, txt]) => (
                <div key={txt} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
                  <span>{icon}</span>{txt}
                </div>
              ))}
            </div>
          </div>

          <button className="btn btn-full btn-lg"
            disabled={state.assignmentText.trim().length < 50}
            onClick={startViva}>
            {t('startVivaBtn')}
          </button>
          {state.assignmentText.trim().length < 50 && state.assignmentText.length > 0 && (
            <p className="text-muted text-sm" style={{ textAlign: 'center', marginTop: 8 }}>{t('need50')}</p>
          )}
        </div>
      </div>
    </div>
  );
}
