import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

// ─── TRANSLATIONS ───────────────────────────────────────────────────
const TRANSLATIONS = {
  en: {
    title: 'VeriLearn AI',
    tagline: 'AI Academic Authenticity Guard',
    student: 'Student',
    teacher: 'Teacher',
    login: 'Sign In',
    name: 'Full Name',
    email: 'Email Address',
    langToggle: 'اردو',
    dashboard: 'Dashboard',
    myResults: 'My Results',
    activeCoursework: 'Active Coursework',
    startViva: 'Start Socratic Viva',
    createAssignment: 'Create Assignment',
    liveMonitor: 'Live Submissions',
    reports: 'Telemetry Reports',
    settings: 'Profile',
    timeRemaining: 'Time Remaining',
    characters: 'characters',
    minChars: 'Minimum 30 characters required',
    submit: 'Submit Answer',
    signOut: 'Sign Out',
    pass: 'Pass / Authentic',
    fail: 'Fail / Copied',
    review: 'Review Required',
    correct: 'CORRECTED CONCEPTS',
    missed: 'MISSED CRITICAL LOGIC',
  },
  ur: {
    title: 'ویری لرن AI',
    tagline: 'تعلیمی سچائی اور دیانتداری گارڈ',
    student: 'طالب علم',
    teacher: 'استاد',
    login: 'لاگ ان کریں',
    name: 'پورا نام',
    email: 'ای میل پتہ',
    langToggle: 'English',
    dashboard: 'ڈیش بورڈ',
    myResults: 'میرے نتائج',
    activeCoursework: 'فعال کورس ورک',
    startViva: 'وائیوا شروع کریں',
    createAssignment: 'نیا کورس ورک بنائیں',
    liveMonitor: 'لائیو امتحانات',
    reports: 'سیکیورٹی رپورٹس',
    settings: 'پروفائل',
    timeRemaining: 'باقی وقت',
    characters: 'حروف',
    minChars: 'کم از کم 30 حروف لکھنا لازمی ہے',
    submit: 'جواب جمع کریں',
    signOut: 'لاگ آؤٹ',
    pass: 'کامیاب / مستند',
    fail: 'ناکام / کاپی شدہ',
    review: 'دوبارہ جانچ کی ضرورت',
    correct: 'درست تصورات',
    missed: 'چھوڑی ہوئی منطق',
  }
};

export default function App() {
  const [screen, setScreen] = useState('LOGIN'); // LOGIN, STUDENT, TEACHER, VIVA
  const [role, setRole] = useState('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [lang, setLang] = useState('en');
  const [ipAddress, setIpAddress] = useState('192.168.1.10'); // Default IP to bind to the host
  
  // Dashboard & Viva states
  const [assignments, setAssignments] = useState([]);
  const [results, setResults] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [vivaText, setVivaText] = useState('');
  const [vivaSubject, setVivaSubject] = useState('Computer Science');
  
  // Socratic Viva Session State
  const [vivaQuestions, setVivaQuestions] = useState([]);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [answers, setAnswers] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [timeLeft, setTimeLeft] = useState(90);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [overlay, setOverlay] = useState(null);
  const [finalReport, setFinalReport] = useState(null);
  
  // Teacher Create State
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newContent, setNewContent] = useState('');
  
  const timerRef = useRef(null);

  const t = (key) => TRANSLATIONS[lang][key] || key;
  const isUrdu = lang === 'ur';

  const getAPIUrl = () => `http://${ipAddress.trim()}:3001`;

  // Fetch coursework and results
  const refreshData = async () => {
    try {
      const url = getAPIUrl();
      const resC = await fetch(`${url}/api/assignments`);
      const dataC = await resC.json();
      setAssignments(dataC);

      const resR = await fetch(`${url}/api/results`);
      const dataR = await resR.json();
      setResults(dataR);
    } catch (e) {
      console.warn("Could not sync with backend: " + e.message);
    }
  };

  useEffect(() => {
    if (screen === 'STUDENT' || screen === 'TEACHER') {
      refreshData();
      const interval = setInterval(refreshData, 8000);
      return () => clearInterval(interval);
    }
  }, [screen, ipAddress]);

  // Handle Viva Socratic Flow
  const startViva = async (text, subject = 'Data Structures') => {
    if (!text.trim()) {
      Alert.alert("Error", "Please input assignment text first!");
      return;
    }
    setVivaText(text);
    setVivaSubject(subject);
    setLoading(true);
    setLoadingText(isUrdu ? 'اسائنمنٹ کا تجزیہ ہو رہا ہے...' : 'Analyzing assignment keywords...');
    
    try {
      const url = getAPIUrl();
      const anaRes = await fetch(`${url}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignment: text, difficulty: 'intermediate' })
      });
      const analysis = await anaRes.json();

      setLoadingText(isUrdu ? 'سوالات تیار ہو رہے ہیں...' : 'Generating 5 conceptual questions...');
      const qRes = await fetch(`${url}/api/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: analysis.subject, key_concepts: analysis.key_concepts, difficulty: 'intermediate' })
      });
      const qData = await qRes.json();

      setVivaQuestions(qData.questions || []);
      setCurrentQIdx(0);
      setAnswers([]);
      setEvaluations([]);
      setTimeLeft(90);
      setScreen('VIVA');
    } catch (err) {
      Alert.alert("Connection Error", "Ensure server is running and your PC IP is entered correctly.");
    } finally {
      setLoading(false);
    }
  };

  // Timer logic for Viva
  useEffect(() => {
    if (screen !== 'VIVA' || loading || overlay) {
      clearInterval(timerRef.current);
      return;
    }
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAnswerSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [screen, currentQIdx, loading, overlay]);

  const handleAnswerSubmit = async (auto = false) => {
    setLoading(true);
    const ansText = currentAnswer.trim() || "(No Answer)";
    const q = vivaQuestions[currentQIdx];
    
    try {
      const url = getAPIUrl();
      const evalRes = await fetch(`${url}/api/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q.question, answer: ansText, timeTaken: 90 - timeLeft })
      });
      const ev = await evalRes.json();

      const newAnswers = [...answers, ansText];
      const newEvals = [...evaluations, ev];
      setAnswers(newAnswers);
      setEvaluations(newEvals);

      // Show immediate pop-up overlay feedback
      setOverlay({
        score: ev.score,
        feedback: ev.feedback,
        right: ev.right || [],
        missed: ev.missed || [],
        onClose: () => {
          setOverlay(null);
          setCurrentAnswer('');
          setTimeLeft(90);
          if (currentQIdx + 1 >= 5) {
            compileFinalReport(newAnswers, newEvals);
          } else {
            setCurrentQIdx(prev => prev + 1);
          }
        }
      });
    } catch (err) {
      Alert.alert("Submission Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const compileFinalReport = async (finalAns, finalEvs) => {
    setLoading(true);
    try {
      const url = getAPIUrl();
      const repRes = await fetch(`${url}/api/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: name || "Student User",
          subject: vivaSubject,
          questions: vivaQuestions,
          answers: finalAns,
          evaluations: finalEvs,
          hesitations: [4, 2, 5, 3, 2],
          tabSwitches: 0,
          timeTakens: [20, 30, 45, 12, 15]
        })
      });
      const report = await repRes.json();
      setFinalReport(report);

      // Persist results live to backend database!
      await fetch(`${url}/api/results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...report,
          studentName: name || "Student User",
          subject: vivaSubject,
          latitude: 31.4707,
          longitude: 74.2729,
          tab_switches: 0,
          avg_hesitation: report.avg_hesitation
        })
      });
    } catch (err) {
      Alert.alert("Report Compilation Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  // Publish course assignments
  const publishAssignment = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      Alert.alert("Required", "Please enter title and content!");
      return;
    }
    setLoading(true);
    try {
      const url = getAPIUrl();
      const res = await fetch(`${url}/api/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          subject: newSubject || "Computer Science",
          difficulty: 'Intermediate',
          content: newContent
        })
      });
      if (res.ok) {
        Alert.alert("Success", isUrdu ? "اسائنمنٹ کامیابی سے شائع ہو گئی!" : "Assignment published successfully!");
        setNewTitle('');
        setNewSubject('');
        setNewContent('');
        setActiveTab('dashboard');
        refreshData();
      }
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── RENDER LOGIN SCREEN ──────────────────────────────────────────
  if (screen === 'LOGIN') {
    return (
      <SafeAreaView style={styles.darkBackground}>
        <ExpoStatusBar style="light" />
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.logoContainer}>
            <Text style={styles.logoIcon}>🛡️</Text>
            <Text style={styles.gradientTitle}>{t('title')}</Text>
            <Text style={styles.mutedText}>{t('tagline')}</Text>
          </View>

          <View style={styles.card}>
            {/* IP configuration box */}
            <Text style={styles.label}>1. Computer IP Address (Wi-Fi)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 192.168.1.10"
              placeholderTextColor="#4A5878"
              value={ipAddress}
              onChangeText={setIpAddress}
            />
            <Text style={styles.helpText}>Enter your laptop's Wi-Fi IP to sync with the backend database.</Text>

            {/* Role selector */}
            <Text style={styles.label}>2. Select Your Role</Text>
            <View style={styles.pillsRow}>
              <TouchableOpacity
                style={[styles.pill, role === 'student' && styles.pillActive]}
                onClick={() => setRole('student')}
                onPress={() => setRole('student')}
              >
                <Text style={[styles.pillText, role === 'student' && styles.pillTextActive]}>🎓 {t('student')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pill, role === 'teacher' && styles.pillActive]}
                onClick={() => setRole('teacher')}
                onPress={() => setRole('teacher')}
              >
                <Text style={[styles.pillText, role === 'teacher' && styles.pillTextActive]}>👩‍🏫 {t('teacher')}</Text>
              </TouchableOpacity>
            </View>

            {/* Full Name & Email */}
            <Text style={styles.label}>{t('name')}</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              placeholderTextColor="#4A5878"
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>{t('email')}</Text>
            <TextInput
              style={styles.input}
              placeholder="your@email.com"
              placeholderTextColor="#4A5878"
              value={email}
              keyboardType="email-address"
              onChangeText={setEmail}
            />

            {/* Submit */}
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => {
                if (!name.trim() || !email.trim()) {
                  Alert.alert("Required", "Please complete your profile first.");
                  return;
                }
                setScreen(role === 'teacher' ? 'TEACHER' : 'STUDENT');
              }}
            >
              <Text style={styles.primaryButtonText}>{t('login')} →</Text>
            </TouchableOpacity>
          </View>

          {/* Bilingual Toggle */}
          <TouchableOpacity style={styles.langBtn} onPress={() => setLang(lang === 'en' ? 'ur' : 'en')}>
            <Text style={styles.langBtnText}>🌐 {t('langToggle')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── RENDER STUDENT PORTAL ────────────────────────────────────────
  if (screen === 'STUDENT') {
    return (
      <SafeAreaView style={styles.darkBackground}>
        <ExpoStatusBar style="light" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🎓 {userProfileText(name)}</Text>
          <TouchableOpacity style={styles.signOutBtn} onPress={() => { setScreen('LOGIN'); setFinalReport(null); }}>
            <Text style={styles.signOutBtnText}>{t('signOut')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.subHeader}>
          <TouchableOpacity style={[styles.tab, activeTab === 'dashboard' && styles.tabActive]} onPress={() => setActiveTab('dashboard')}>
            <Text style={[styles.tabText, activeTab === 'dashboard' && styles.tabTextActive]}>📊 {t('dashboard')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'viva' && styles.tabActive]} onPress={() => setActiveTab('viva')}>
            <Text style={[styles.tabText, activeTab === 'viva' && styles.tabTextActive]}>📝 {t('startViva')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'results' && styles.tabActive]} onPress={() => setActiveTab('results')}>
            <Text style={[styles.tabText, activeTab === 'results' && styles.tabTextActive]}>🏆 {t('myResults')}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {activeTab === 'dashboard' && (
            <View>
              <Text style={styles.sectionTitle}>{t('activeCoursework')}</Text>
              {assignments.length === 0 ? (
                <View style={styles.card}>
                  <Text style={styles.mutedText}>No active coursework published by the teacher.</Text>
                </View>
              ) : (
                assignments.map((item, idx) => (
                  <View style={styles.card} key={idx}>
                    <Text style={styles.cardHeader}>{item.title}</Text>
                    <Text style={styles.cardSubHeader}>📚 {item.subject}</Text>
                    <Text style={styles.cardBody} numberOfLines={3}>{item.content}</Text>
                    <TouchableOpacity style={styles.cardActionBtn} onPress={() => startViva(item.content, item.subject)}>
                      <Text style={styles.cardActionText}>📝 {t('startViva')} →</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          )}

          {activeTab === 'viva' && (
            <View style={styles.card}>
              <Text style={styles.cardHeader}>Manual Assignment Entry</Text>
              <Text style={styles.mutedText}>Paste your coursework text below to start the evaluation:</Text>
              <TextInput
                style={[styles.input, { height: 120, textAlignVertical: 'top', marginTop: 12 }]}
                multiline
                numberOfLines={6}
                placeholder="Paste your assignment or essay here..."
                placeholderTextColor="#4A5878"
                value={vivaText}
                onChangeText={setVivaText}
              />
              <TouchableOpacity style={styles.primaryButton} onPress={() => startViva(vivaText, 'Computer Science')}>
                <Text style={styles.primaryButtonText}>🚀 Start AI Evaluation</Text>
              </TouchableOpacity>
            </View>
          )}

          {activeTab === 'results' && (
            <View>
              <Text style={styles.sectionTitle}>{t('myResults')}</Text>
              {results.filter(r => r.studentName?.toLowerCase() === name?.toLowerCase()).length === 0 ? (
                <View style={styles.card}>
                  <Text style={styles.mutedText}>No exam results found for your account yet.</Text>
                </View>
              ) : (
                results.filter(r => r.studentName?.toLowerCase() === name?.toLowerCase()).map((item, idx) => (
                  <View style={styles.card} key={idx}>
                    <View style={styles.row}>
                      <Text style={styles.cardHeader}>{item.subject}</Text>
                      <Text style={styles.badge}>{item.grade}</Text>
                    </View>
                    <Text style={styles.cardBody}>Score: {item.final_score}%</Text>
                    <Text style={[styles.verdictText, { color: item.authenticity_verdict?.includes('Authentic') ? '#3ECF8E' : '#E8455A' }]}>
                      🛡️ {item.authenticity_verdict}
                    </Text>
                  </View>
                ))
              )}
            </View>
          )}
        </ScrollView>

        {/* Global Loading Overlay */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00D4AA" />
            <Text style={styles.loadingText}>{loadingText || 'Syncing...'}</Text>
          </View>
        )}
      </SafeAreaView>
    );
  }

  // ─── RENDER TEACHER PORTAL ────────────────────────────────────────
  if (screen === 'TEACHER') {
    return (
      <SafeAreaView style={styles.darkBackground}>
        <ExpoStatusBar style="light" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>👩‍🏫 Dr. {userProfileText(name)}</Text>
          <TouchableOpacity style={styles.signOutBtn} onPress={() => setScreen('LOGIN')}>
            <Text style={styles.signOutBtnText}>{t('signOut')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.subHeader}>
          <TouchableOpacity style={[styles.tab, activeTab === 'dashboard' && styles.tabActive]} onPress={() => setActiveTab('dashboard')}>
            <Text style={[styles.tabText, activeTab === 'dashboard' && styles.tabTextActive]}>📊 {t('dashboard')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'create' && styles.tabActive]} onPress={() => setActiveTab('create')}>
            <Text style={[styles.tabText, activeTab === 'create' && styles.tabTextActive]}>➕ {t('createAssignment')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'reports' && styles.tabActive]} onPress={() => setActiveTab('reports')}>
            <Text style={[styles.tabText, activeTab === 'reports' && styles.tabTextActive]}>📡 {t('reports')}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {activeTab === 'dashboard' && (
            <View>
              <Text style={styles.sectionTitle}>Overview Stats</Text>
              <View style={styles.grid}>
                <View style={styles.gridCard}>
                  <Text style={styles.gridNum}>{assignments.length}</Text>
                  <Text style={styles.gridLabel}>Active Courseworks</Text>
                </View>
                <View style={styles.gridCard}>
                  <Text style={styles.gridNum}>{results.length}</Text>
                  <Text style={styles.gridLabel}>Viva Reports</Text>
                </View>
              </View>
            </View>
          )}

          {activeTab === 'create' && (
            <View style={styles.card}>
              <Text style={styles.cardHeader}>{t('createAssignment')}</Text>
              
              <Text style={styles.label}>Assignment Title</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Dynamic Arrays Assignment"
                placeholderTextColor="#4A5878"
                value={newTitle}
                onChangeText={setNewTitle}
              />

              <Text style={styles.label}>Subject</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Data Structures"
                placeholderTextColor="#4A5878"
                value={newSubject}
                onChangeText={setNewSubject}
              />

              <Text style={styles.label}>Content / Standard Answer Context</Text>
              <TextInput
                style={[styles.input, { height: 120, textAlignVertical: 'top' }]}
                multiline
                numberOfLines={6}
                placeholder="Enter standard correct parameters to verify student authenticity..."
                placeholderTextColor="#4A5878"
                value={newContent}
                onChangeText={setNewContent}
              />

              <TouchableOpacity style={styles.primaryButton} onPress={publishAssignment}>
                <Text style={styles.primaryButtonText}>🚀 {t('createAssignment')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {activeTab === 'reports' && (
            <View>
              <Text style={styles.sectionTitle}>{t('liveMonitor')}</Text>
              {results.length === 0 ? (
                <View style={styles.card}>
                  <Text style={styles.mutedText}>No reports stored in backend database yet.</Text>
                </View>
              ) : (
                results.map((r, idx) => (
                  <View style={styles.card} key={idx}>
                    <View style={styles.row}>
                      <Text style={styles.cardHeader}>{r.studentName}</Text>
                      <Text style={styles.badge}>{r.grade}</Text>
                    </View>
                    <Text style={styles.cardBody}>Subject: {r.subject}</Text>
                    <Text style={styles.cardBody}>Score: {r.final_score}/100</Text>
                    <Text style={[styles.verdictText, { color: r.authenticity_verdict?.includes('Authentic') ? '#3ECF8E' : '#E8455A' }]}>
                      🛡️ {r.authenticity_verdict || 'Highly Authentic'}
                    </Text>
                  </View>
                ))
              )}
            </View>
          )}
        </ScrollView>

        {/* Global Loading Overlay */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00D4AA" />
            <Text style={styles.loadingText}>Publishing...</Text>
          </View>
        )}
      </SafeAreaView>
    );
  }

  // ─── RENDER VIVA EXAMINATION SCREEN ────────────────────────────────
  if (screen === 'VIVA') {
    if (finalReport) {
      const offset = 376;
      return (
        <SafeAreaView style={styles.darkBackground}>
          <ExpoStatusBar style="light" />
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.card}>
              <Text style={[styles.gradientTitle, { textAlign: 'center', fontSize: 32 }]}>🏆 Report</Text>
              
              <View style={styles.reportScoreCircle}>
                <Text style={styles.reportScoreText}>{finalReport.final_score}</Text>
                <Text style={styles.reportScoreMax}>/100</Text>
              </View>

              <Text style={[styles.verdictText, { textAlign: 'center', fontSize: 20, color: finalReport.authenticity_verdict?.includes('Authentic') ? '#3ECF8E' : '#E8455A' }]}>
                🛡️ {finalReport.authenticity_verdict}
              </Text>

              <Text style={styles.reportFeedback}>{finalReport.student_feedback}</Text>

              <TouchableOpacity style={styles.primaryButton} onPress={() => { setFinalReport(null); setScreen('STUDENT'); setActiveTab('dashboard'); }}>
                <Text style={styles.primaryButtonText}>📊 Back to Dashboard</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      );
    }

    const q = vivaQuestions[currentQIdx] || { question: 'Generating Question...' };
    const canSubmit = currentAnswer.trim().length >= 30;

    return (
      <SafeAreaView style={styles.darkBackground}>
        <ExpoStatusBar style="light" />
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Text style={styles.vivaQHeader}>{t('timeRemaining')}</Text>
            <Text style={[styles.timer, timeLeft <= 15 && styles.timerRed]}>{timeLeft}s</Text>

            <View style={styles.questionBox}>
              <Text style={styles.questionText}>{q.question}</Text>
            </View>

            <Text style={styles.label}>{t('yourAnswer')}</Text>
            <TextInput
              style={[styles.input, { height: 140, textAlignVertical: 'top' }]}
              multiline
              numberOfLines={6}
              placeholder="Type your explanation here. Minimum 30 characters..."
              placeholderTextColor="#4A5878"
              value={currentAnswer}
              onChangeText={setCurrentAnswer}
            />

            <Text style={styles.charCounter}>
              {currentAnswer.length} / 30+ {t('characters')}
            </Text>

            <TouchableOpacity
              style={[styles.primaryButton, !canSubmit && { opacity: 0.5 }]}
              disabled={!canSubmit}
              onPress={() => handleAnswerSubmit(false)}
            >
              <Text style={styles.primaryButtonText}>🚀 {t('submit')} →</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Dynamic Micro-Feedback Popup Overlay */}
        {overlay && (
          <View style={styles.overlayContainer}>
            <View style={styles.overlayCard}>
              <Text style={styles.overlayScoreTitle}>AI CONCEPTUAL SCORE</Text>
              <Text style={styles.overlayScore}>{overlay.score}<Text style={styles.overlayScoreMax}>/10</Text></Text>
              
              <Text style={styles.overlayFeedbackText}>{overlay.feedback}</Text>
              
              <TouchableOpacity style={styles.primaryButton} onPress={overlay.onClose}>
                <Text style={styles.primaryButtonText}>
                  {currentQIdx + 1 >= 5 ? '📊 View Full Report →' : 'Next Question →'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Global Loading Overlay */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00D4AA" />
            <Text style={styles.loadingText}>AI Evaluating Answer...</Text>
          </View>
        )}
      </SafeAreaView>
    );
  }
}

const userProfileText = (txt) => {
  return txt.length > 12 ? txt.substring(0, 12) + '...' : txt;
};

// ─── STYLES ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  darkBackground: {
    flex: 1,
    backgroundColor: '#0D0F14',
    paddingTop: StatusBar.currentHeight || 20,
  },
  scrollContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  logoIcon: {
    fontSize: 64,
    marginBottom: 8,
  },
  gradientTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#00D4AA',
    letterSpacing: 0.5,
  },
  mutedText: {
    color: '#8A9BC0',
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#141820',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A3347',
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 5,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8A9BC0',
    marginBottom: 6,
    marginTop: 12,
    textTransform: 'uppercase',
  },
  input: {
    width: '100%',
    backgroundColor: '#1C2130',
    borderWidth: 1,
    borderColor: '#2A3347',
    borderRadius: 8,
    padding: 12,
    color: '#F0F4FF',
    fontSize: 15,
  },
  helpText: {
    fontSize: 11,
    color: '#4A5878',
    marginTop: 4,
    marginBottom: 10,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  pill: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#1C2130',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2A3347',
  },
  pillActive: {
    backgroundColor: '#00D4AA',
    borderColor: '#00D4AA',
  },
  pillText: {
    color: '#8A9BC0',
    fontWeight: '600',
    fontSize: 13,
  },
  pillTextActive: {
    color: '#0D0F14',
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#00D4AA',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  primaryButtonText: {
    color: '#0D0F14',
    fontSize: 16,
    fontWeight: '700',
  },
  langBtn: {
    marginTop: 10,
    padding: 10,
  },
  langBtnText: {
    color: '#00D4AA',
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2A3347',
    backgroundColor: '#141820',
  },
  headerTitle: {
    color: '#F0F4FF',
    fontSize: 18,
    fontWeight: '700',
  },
  signOutBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#2A3347',
    borderRadius: 6,
  },
  signOutBtnText: {
    color: '#8A9BC0',
    fontSize: 12,
    fontWeight: '600',
  },
  subHeader: {
    flexDirection: 'row',
    backgroundColor: '#141820',
    borderBottomWidth: 1,
    borderBottomColor: '#2A3347',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#00D4AA',
  },
  tabText: {
    color: '#8A9BC0',
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#00D4AA',
  },
  sectionTitle: {
    color: '#8A9BC0',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginTop: 10,
  },
  cardHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F0F4FF',
    marginBottom: 4,
  },
  cardSubHeader: {
    fontSize: 12,
    color: '#00D4AA',
    marginBottom: 8,
  },
  cardBody: {
    color: '#8A9BC0',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  cardActionBtn: {
    backgroundColor: '#1C2130',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A3347',
  },
  cardActionText: {
    color: '#00D4AA',
    fontSize: 13,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: 'rgba(0, 212, 170, 0.15)',
    color: '#00D4AA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 11,
    fontWeight: '700',
  },
  verdictText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(13, 15, 20, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  loadingText: {
    color: '#00D4AA',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
  },
  gridCard: {
    flex: 1,
    backgroundColor: '#141820',
    borderWidth: 1,
    borderColor: '#2A3347',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  gridNum: {
    fontSize: 32,
    fontWeight: '800',
    color: '#00D4AA',
  },
  gridLabel: {
    fontSize: 12,
    color: '#8A9BC0',
    marginTop: 4,
    textAlign: 'center',
  },
  vivaQHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8A9BC0',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  timer: {
    fontSize: 32,
    fontWeight: '800',
    color: '#00D4AA',
    textAlign: 'center',
    marginVertical: 8,
  },
  timerRed: {
    color: '#E8455A',
  },
  questionBox: {
    backgroundColor: '#1C2130',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#00D4AA',
    padding: 14,
    marginVertical: 12,
  },
  questionText: {
    color: '#F0F4FF',
    fontSize: 16,
    lineHeight: 22,
  },
  charCounter: {
    fontSize: 11,
    color: '#8A9BC0',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    zIndex: 9999,
  },
  overlayCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#141820',
    borderWidth: 1,
    borderColor: '#00D4AA',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  overlayScoreTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8A9BC0',
    letterSpacing: 0.5,
  },
  overlayScore: {
    fontSize: 48,
    fontWeight: '800',
    color: '#00D4AA',
    marginVertical: 8,
  },
  overlayScoreMax: {
    fontSize: 18,
    color: '#8A9BC0',
  },
  overlayFeedbackText: {
    color: '#F0F4FF',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 16,
  },
  reportScoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#00D4AA',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  reportScoreText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#00D4AA',
  },
  reportScoreMax: {
    fontSize: 14,
    color: '#8A9BC0',
  },
  reportFeedback: {
    color: '#8A9BC0',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginVertical: 12,
  }
});
