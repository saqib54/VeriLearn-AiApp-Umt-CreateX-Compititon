import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Navbar from '../components/Navbar';

// ── Simple WebRTC signaling via BroadcastChannel (same-origin / same-browser demo)
// In production replace with Socket.io + STUN/TURN

function usePeerConnection(isStudent) {
  const pcRef = useRef(null);
  const channelRef = useRef(null);

  const getPC = () => {
    if (!pcRef.current || pcRef.current.signalingState === 'closed') {
      pcRef.current = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      });
    }
    return pcRef.current;
  };

  const cleanup = () => {
    pcRef.current?.close();
    pcRef.current = null;
    channelRef.current?.close();
    channelRef.current = null;
  };

  return { getPC, cleanup, channelRef };
}

// ─── Student Side ─────────────────────────────────────────────────────────────
export function StudentScreenShare() {
  const { t, isUrdu } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [channelId, setChannelId] = useState('');
  const [sharing, setSharing] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const previewRef = useRef(null);
  const streamRef = useRef(null);
  const bcRef = useRef(null);
  const pcRef = useRef(null);

  const startSharing = async () => {
    if (!channelId.trim()) { setError('Please enter a Channel ID'); return; }
    setError('');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      setError(isUrdu 
        ? '⚠️ اسکرین شیئرنگ صرف ڈیسک ٹاپ براؤزرز (جیسے کروم یا فائر فاکس) پر دستیاب ہے۔ موبائل پر ڈائریکٹ ٹیسٹ جاری رکھیں۔'
        : '⚠️ Screen sharing is only supported on Desktop browsers (Chrome, Firefox, Edge) or Secure Contexts (HTTPS/localhost). Please continue with the exam directly!'
      );
      return;
    }
    try {
      // Get screen + microphone
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 15 }, audio: true });
      let micStream = null;
      try {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      } catch { /* mic optional */ }

      // Combine tracks
      const tracks = [...screenStream.getTracks()];
      if (micStream) tracks.push(...micStream.getAudioTracks());

      // Show preview
      if (previewRef.current) previewRef.current.srcObject = screenStream;
      streamRef.current = screenStream;
      setSharing(true);
      setStatus('🟢 Sharing — waiting for teacher to connect...');

      // BroadcastChannel signaling
      const bc = new BroadcastChannel(`vl-screen-${channelId.trim()}`);
      bcRef.current = bc;

      const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
      pcRef.current = pc;

      // Add all tracks
      tracks.forEach(track => pc.addTrack(track, screenStream));

      pc.onicecandidate = e => {
        if (e.candidate) bc.postMessage({ type: 'ice-student', candidate: e.candidate });
      };

      // Listen for teacher's messages
      bc.onmessage = async (e) => {
        const msg = e.data;
        if (msg.type === 'join') {
          setStatus('📡 Teacher joined! Creating offer...');
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          bc.postMessage({ type: 'offer', sdp: offer });
          setStatus('✅ Teacher connected — screen is live!');
        }
        if (msg.type === 'answer') {
          await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
        }
        if (msg.type === 'ice-teacher' && msg.candidate) {
          try { await pc.addIceCandidate(new RTCIceCandidate(msg.candidate)); } catch {}
        }
      };

      screenStream.getVideoTracks()[0].onended = stopSharing;

    } catch (e) {
      setError('Screen sharing failed: ' + e.message);
      setSharing(false);
    }
  };

  const stopSharing = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    pcRef.current?.close();
    bcRef.current?.close();
    streamRef.current = null;
    pcRef.current = null;
    bcRef.current = null;
    if (previewRef.current) previewRef.current.srcObject = null;
    setSharing(false);
    setStatus('');
  };

  useEffect(() => () => stopSharing(), []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <div className="container" style={{ maxWidth: 700, paddingTop: 32 }} dir={isUrdu ? 'rtl' : 'ltr'}>
        <button className="btn btn-outline btn-sm" onClick={() => navigate('/student')}
          style={{ marginBottom: 20, direction: 'ltr' }}>← Back</button>

        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, marginBottom: 6 }}>
          {t('screenShareTitle')}
        </h2>
        <p className="text-muted" style={{ marginBottom: 24 }}>{t('shareDesc')}</p>

        {error && <div className="alert alert-red" style={{ marginBottom: 16 }}>{error}</div>}
        {status && (
          <div className="alert alert-teal" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            {status}
          </div>
        )}

        <div className="card fade-up" style={{ marginBottom: 16 }}>
          <div className="field">
            <label className="label">{t('channelId')}</label>
            <input className="input" placeholder={t('channelPlaceholder')}
              value={channelId} onChange={e => setChannelId(e.target.value)}
              disabled={sharing} />
          </div>

          {/* Screen preview */}
          <div style={{
            background: '#000', borderRadius: 10, minHeight: 240,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16, overflow: 'hidden', position: 'relative',
            border: sharing ? '2px solid var(--teal)' : '2px solid var(--border)'
          }}>
            {sharing ? (
              <>
                <video ref={previewRef} autoPlay muted playsInline
                  style={{ width: '100%', borderRadius: 8, maxHeight: 300, objectFit: 'contain' }} />
                <div style={{
                  position: 'absolute', top: 12, right: 12,
                  background: 'rgba(232,69,90,0.9)', borderRadius: 20,
                  padding: '4px 12px', fontSize: 12, fontWeight: 700, color: '#fff',
                  display: 'flex', alignItems: 'center', gap: 6
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', animation: 'dpulse 1s infinite' }} />
                  LIVE
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', color: '#555' }}>
                <div style={{ fontSize: 56, marginBottom: 12 }}>🖥️</div>
                <p className="text-muted">{t('shareScreen')}</p>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            {!sharing
              ? <button className="btn btn-full btn-lg" onClick={startSharing}>{t('startSharing')}</button>
              : <button className="btn btn-danger btn-full btn-lg" onClick={stopSharing}>{t('stopSharingBtn')}</button>
            }
          </div>
        </div>

        {/* Instructions */}
        <div className="card" style={{ background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.2)' }}>
          <div className="section-title" style={{ marginBottom: 12 }}>📋 How It Works</div>
          <ol style={{ paddingLeft: 20, color: 'var(--text-muted)', fontSize: 14, lineHeight: 2 }}>
            <li>Enter a Channel ID (share this with your teacher)</li>
            <li>Click "Start Sharing" and allow screen access</li>
            <li>Teacher joins the same Channel ID to view your screen</li>
            <li>Your microphone audio will also be shared</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

// ─── Teacher Side ─────────────────────────────────────────────────────────────
export function TeacherScreenWatch() {
  const { t, isUrdu } = useLanguage();
  const navigate = useNavigate();
  const [channelId, setChannelId] = useState('');
  const [joined, setJoined] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [hasStream, setHasStream] = useState(false);
  const videoRef = useRef(null);
  const bcRef = useRef(null);
  const pcRef = useRef(null);

  const joinChannel = async () => {
    if (!channelId.trim()) { setError('Please enter a Channel ID'); return; }
    setError('');
    setJoined(true);
    setStatus('🔍 Looking for student...');

    const bc = new BroadcastChannel(`vl-screen-${channelId.trim()}`);
    bcRef.current = bc;

    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    pcRef.current = pc;

    pc.ontrack = (e) => {
      if (videoRef.current && e.streams[0]) {
        videoRef.current.srcObject = e.streams[0];
        setHasStream(true);
        setStatus('✅ Student screen connected!');
      }
    };

    pc.onicecandidate = e => {
      if (e.candidate) bc.postMessage({ type: 'ice-teacher', candidate: e.candidate });
    };

    bc.onmessage = async (e) => {
      const msg = e.data;
      if (msg.type === 'offer') {
        setStatus('📡 Connecting to student...');
        await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        bc.postMessage({ type: 'answer', sdp: answer });
      }
      if (msg.type === 'ice-student' && msg.candidate) {
        try { await pc.addIceCandidate(new RTCIceCandidate(msg.candidate)); } catch {}
      }
    };

    // Signal our presence
    bc.postMessage({ type: 'join' });
  };

  const leave = () => {
    pcRef.current?.close();
    bcRef.current?.close();
    pcRef.current = null;
    bcRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setJoined(false);
    setHasStream(false);
    setStatus('');
  };

  useEffect(() => () => leave(), []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <div className="container" style={{ maxWidth: 800, paddingTop: 32 }} dir={isUrdu ? 'rtl' : 'ltr'}>
        <button className="btn btn-outline btn-sm" onClick={() => navigate('/teacher')}
          style={{ marginBottom: 20, direction: 'ltr' }}>← Back</button>

        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, marginBottom: 6 }}>
          {t('watchTitle')}
        </h2>
        <p className="text-muted" style={{ marginBottom: 24 }}>Join a student's session to view their screen in real-time.</p>

        {error && <div className="alert alert-red" style={{ marginBottom: 16 }}>{error}</div>}
        {status && (
          <div className={`alert ${hasStream ? 'alert-green' : 'alert-teal'}`} style={{ marginBottom: 16 }}>
            {status}
          </div>
        )}

        {!joined && (
          <div className="card fade-up" style={{ marginBottom: 20 }}>
            <div className="field">
              <label className="label">{t('channelId')}</label>
              <input className="input" placeholder={t('channelPlaceholder')}
                value={channelId} onChange={e => setChannelId(e.target.value)} />
            </div>
            <button className="btn btn-full btn-lg" onClick={joinChannel}>{t('joinBtn')}</button>
          </div>
        )}

        {joined && (
          <div className="card fade-up" style={{ marginBottom: 20 }}>
            <div style={{
              background: '#000', borderRadius: 10, minHeight: 380,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 16, overflow: 'hidden', position: 'relative',
              border: hasStream ? '2px solid var(--green)' : '2px solid var(--border)'
            }}>
              <video ref={videoRef} autoPlay playsInline
                style={{ width: '100%', maxHeight: 450, objectFit: 'contain', display: hasStream ? 'block' : 'none' }} />
              {!hasStream && (
                <div style={{ textAlign: 'center', color: '#555' }}>
                  <div style={{ fontSize: 64, marginBottom: 16 }}>📡</div>
                  <p className="text-muted">{t('waitingScreen')}</p>
                  <div className="spinner" style={{ margin: '24px auto 0' }} />
                </div>
              )}
              {hasStream && (
                <div style={{
                  position: 'absolute', top: 12, left: 12,
                  background: 'rgba(62,207,142,0.9)', borderRadius: 20,
                  padding: '4px 12px', fontSize: 12, fontWeight: 700, color: '#000',
                  display: 'flex', alignItems: 'center', gap: 6
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#000', animation: 'dpulse 1s infinite' }} />
                  {t('screenLive')}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="text-muted text-sm">Channel: <strong style={{ color: 'var(--teal)' }}>{channelId}</strong></span>
              <button className="btn btn-danger" onClick={leave}>{t('leaveBtn')}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
