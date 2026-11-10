import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Mic, MicOff, Video, VideoOff, ScreenShare, PhoneOff, Users,
  MessageSquare, Copy, Check, Sparkles, Radio, Crown,
  Send, Volume2, VolumeX, Shield, Settings, Info, RefreshCw, PhoneCall,
  Maximize2, Minimize2, AlertCircle, UserCheck, Camera, ShieldCheck,
  FileText, ChevronDown, Download
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useVideoCall } from '../context/VideoCallContext.jsx';
import { getCallSocket } from '../services/callSocket.js';
import { callService } from '../services/index.js';

// ─── WebRTC ICE / STUN servers ──────────────────────────────────────────────
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
    { urls: 'stun:openrelay.metered.ca:80' },
  ],
};

// ─── Animated fallback canvas stream (shown when cam is unavailable) ─────────
function createFallbackStream(name = 'User') {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');

  let hue = 220;
  const draw = () => {
    hue = (hue + 0.3) % 360;
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, `hsl(${hue}, 40%, 15%)`);
    grad.addColorStop(1, `hsl(${(hue + 60) % 360}, 50%, 8%)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2 - 20, 75, 0, Math.PI * 2);
    ctx.fillStyle = `hsl(${hue}, 70%, 55%)`;
    ctx.shadowColor = `hsl(${hue}, 80%, 60%)`;
    ctx.shadowBlur = 25;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 52px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const initials = name.slice(0, 2).toUpperCase() || 'U';
    ctx.fillText(initials, canvas.width / 2, canvas.height / 2 - 20);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '600 22px Inter, sans-serif';
    ctx.fillText(name, canvas.width / 2, canvas.height / 2 + 95);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 14px Inter, sans-serif';
    ctx.fillText('(Camera Unavailable)', canvas.width / 2, canvas.height / 2 + 125);
  };

  const intervalId = setInterval(draw, 80);
  draw();

  const stream = canvas.captureStream ? canvas.captureStream(25) : new MediaStream();

  // Add a silent audio track so WebRTC SDP negotiation includes audio
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      const audioCtx = new AudioCtx();
      const oscillator = audioCtx.createOscillator();
      const dest = audioCtx.createMediaStreamDestination();
      oscillator.connect(dest);
      oscillator.start();
      const [silenceTrack] = dest.stream.getAudioTracks();
      if (silenceTrack) {
        silenceTrack.enabled = false;
        stream.addTrack(silenceTrack);
      }
    }
  } catch (e) {
    console.warn('[WebRTC] Silent audio track skipped:', e.message);
  }

  stream._cleanup = () => clearInterval(intervalId);
  return stream;
}

// ─── VideoCard: renders a single participant video tile ──────────────────────
function VideoCard({ stream, isLocal = false, name = 'User', isMuted = false, isScreenSharing = false, isVideoOff = false, role = 'user' }) {
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [hasVideoFrame, setHasVideoFrame] = useState(false);

  // 1. Video Element Binding:
  // MUST ALWAYS be muted={true}. In Chrome and modern browsers, muted video is GUARANTEED
  // to autoplay 100% without user gesture restrictions. Sound is handled by <audio ref={audioRef}>.
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    if (stream) {
      if (el.srcObject !== stream) {
        el.srcObject = stream;
      }
      el.muted = true; // Always muted: prevents browser autoplay block
      el.playsInline = true;

      const playPromise = el.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('[VideoCard] Video play warning:', err.message);
        });
      }
    } else {
      el.srcObject = null;
      setHasVideoFrame(false);
    }
  }, [stream]);

  // 2. Dedicated audio element for remote peers to play incoming sound
  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl || isLocal) return;

    if (stream) {
      if (audioEl.srcObject !== stream) {
        audioEl.srcObject = stream;
      }
      const playPromise = audioEl.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setAutoplayBlocked(false))
          .catch((err) => {
            console.warn('[VideoCard] Remote audio blocked by autoplay policy:', err.message);
            setAutoplayBlocked(true);
          });
      }
    } else {
      audioEl.srcObject = null;
    }
  }, [stream, isLocal]);

  // 3. Re-sync immediately when tracks arrive, change, or unmute
  useEffect(() => {
    if (!stream) return;
    const sync = () => {
      if (videoRef.current && videoRef.current.srcObject !== stream) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      if (audioRef.current && !isLocal && audioRef.current.srcObject !== stream) {
        audioRef.current.srcObject = stream;
        audioRef.current.play().catch(() => {});
      }
      const vTracks = stream.getVideoTracks();
      const hasLiveTrack = vTracks.length > 0 && vTracks.some((t) => t.readyState === 'live' && t.enabled);
      if (hasLiveTrack) {
        setHasVideoFrame(true);
      }
    };

    stream.addEventListener('addtrack', sync);
    stream.addEventListener('removetrack', sync);

    // Initial check
    sync();

    return () => {
      stream.removeEventListener('addtrack', sync);
      stream.removeEventListener('removetrack', sync);
    };
  }, [stream, isLocal]);

  const handleManualUnmute = () => {
    if (audioRef.current) {
      audioRef.current.play()
        .then(() => setAutoplayBlocked(false))
        .catch(() => {});
    }
  };

  // Show avatar if user turned off video, or if remote video has no active video frames yet
  const showAvatar = isVideoOff || (!isLocal && !hasVideoFrame && (!stream || stream.getVideoTracks().length === 0));

  return (
    <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-xl flex items-center justify-center min-h-[260px] h-full w-full group">
      {/* Video element: always muted to guarantee instant playback */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={true}
        onLoadedMetadata={(e) => {
          e.target.play().catch(() => {});
          setHasVideoFrame(true);
        }}
        onCanPlay={() => setHasVideoFrame(true)}
        onPlaying={() => setHasVideoFrame(true)}
        className={`h-full w-full object-cover ${isLocal ? 'transform -scale-x-100' : ''} ${showAvatar ? 'hidden' : ''}`}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />

      {/* Separate audio element for remote participants ensures audio even when video is hidden */}
      {!isLocal && (
        <audio
          ref={audioRef}
          autoPlay
          playsInline
          onCanPlay={(e) => e.target.play().catch(() => {})}
        />
      )}

      {/* Camera-off avatar */}
      {showAvatar && (
        <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-black text-2xl shadow-xl border-2 border-slate-700">
            {name ? name.slice(0, 2).toUpperCase() : 'U'}
          </div>
          <p className="text-sm text-slate-200 font-bold">{name} {isLocal ? '(You)' : ''}</p>
          <span className="text-xs text-slate-500">{isVideoOff ? 'Camera Off' : 'Connecting video…'}</span>
        </div>
      )}

      {/* Autoplay-blocked unmute button */}
      {autoplayBlocked && !isLocal && (
        <button
          onClick={handleManualUnmute}
          className="absolute top-3 right-3 flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 text-xs font-bold shadow-lg transition-all animate-bounce"
        >
          <VolumeX className="h-3.5 w-3.5" />
          <span>Click to Unmute / Play</span>
        </button>
      )}

      {/* Name badge */}
      <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-xl bg-black/70 backdrop-blur-md px-3 py-1.5 text-xs text-white font-semibold shadow-md">
        <span>{name} {isLocal ? '(You)' : ''}</span>
        {role === 'admin' && <Crown className="h-3.5 w-3.5 text-amber-400 shrink-0" title="Admin" />}
        {isMuted && <MicOff className="h-3.5 w-3.5 text-red-400" />}
      </div>

      {isScreenSharing && (
        <div className="absolute top-3 left-3 rounded-lg bg-indigo-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-md">
          Screen Sharing
        </div>
      )}
    </div>
  );
}

// ─── Main VideoCall Page ──────────────────────────────────────────────────────
export default function VideoCall() {
  const { user } = useAuth();
  const { inviteUser, inviteAllActive } = useVideoCall();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Room state
  const initialRoom = searchParams.get('room') || 'active-users-room';
  const [roomId, setRoomId] = useState(initialRoom);
  const [isInCall, setIsInCall] = useState(false);
  const [connecting, setConnecting] = useState(false);

  // Media
  const [localStream, setLocalStream] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Participants & platform users
  const [participants, setParticipants] = useState([]);
  // remoteStreams is separate state so React always re-renders VideoCard when a stream arrives
  const [remoteStreams, setRemoteStreams] = useState({});
  const [activePlatformUsers, setActivePlatformUsers] = useState([]);
  const [loadingActiveUsers, setLoadingActiveUsers] = useState(false);

  // UI state
  const [sidebarTab, setSidebarTab] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [callDuration, setCallDuration] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  // Refs
  const localStreamRef = useRef(null);
  const cameraStreamRef = useRef(null); // keeps original cam stream while screen sharing
  const peerConnectionsRef = useRef(new Map()); // socketId -> RTCPeerConnection
  const remoteStreamsRef = useRef(new Map()); // socketId -> MediaStream
  const iceQueuesRef = useRef(new Map()); // socketId -> RTCIceCandidateInit[]
  const containerRef = useRef(null);
  const callTimerRef = useRef(null);
  const roomIdRef = useRef(roomId);

  // ── Live Transcription refs & state ────────────────────────────────────────
  const [transcriptionEnabled, setTranscriptionEnabled] = useState(false);
  const [transcriptLines, setTranscriptLines] = useState([]); // { speaker, text, timestamp }
  const [liveCaption, setLiveCaption] = useState(''); // current interim result
  const recognitionRef = useRef(null);
  const transcriptEndRef = useRef(null);

  // Keep roomId ref in sync
  useEffect(() => {
    roomIdRef.current = roomId;
  }, [roomId]);

  // ─── Live Transcription: Web Speech API ────────────────────────────────────
  const startTranscription = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }
    if (recognitionRef.current) return; // already running

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onresult = (event) => {
      let interim = '';
      let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += transcript;
        } else {
          interim += transcript;
        }
      }
      setLiveCaption(interim);

      if (finalText.trim()) {
        const lineId = `t-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        const line = {
          id: lineId,
          speaker: user?.name || 'You',
          text: finalText.trim(),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isLocal: true,
        };
        setTranscriptLines((prev) => [...prev, line]);
        setLiveCaption('');

        // Broadcast transcription to all peers in the room via socket
        const socket = getCallSocket();
        if (socket && socket.connected) {
          socket.emit('call:transcription', {
            roomId: roomIdRef.current,
            line: {
              ...line,
              isLocal: false,
              senderSocketId: socket.id,
            },
          });
        }
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed') {
        toast.error('Microphone access denied. Enable mic permissions to use transcription.');
        setTranscriptionEnabled(false);
      } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
        console.warn('[Transcription] Error:', event.error);
      }
    };

    recognition.onend = () => {
      // Auto-restart unless explicitly stopped
      if (recognitionRef.current) {
        try { recognitionRef.current.start(); } catch (_) { }
      }
    };

    try {
      recognition.start();
      toast.success('🎙️ Live transcription started');
    } catch (e) {
      console.warn('[Transcription] Start failed:', e.message);
    }
  }, [user]);

  const stopTranscription = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null; // prevent auto-restart
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setLiveCaption('');
    toast('Transcription stopped', { icon: '🛑' });
  }, []);

  const toggleTranscription = useCallback(() => {
    if (transcriptionEnabled) {
      stopTranscription();
      setTranscriptionEnabled(false);
    } else {
      setTranscriptionEnabled(true);
      startTranscription();
    }
  }, [transcriptionEnabled, startTranscription, stopTranscription]);

  // Stop transcription when call ends
  useEffect(() => {
    if (!isInCall && recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setTranscriptionEnabled(false);
      setLiveCaption('');
    }
  }, [isInCall]);

  // Auto-scroll transcript panel
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcriptLines, liveCaption]);

  // Listen for remote transcription events
  useEffect(() => {
    if (!isInCall) return;
    const socket = getCallSocket();
    const handleRemoteTranscription = ({ line }) => {
      if (!line || !line.text) return;
      if (line.senderSocketId && socket && line.senderSocketId === socket.id) return;
      setTranscriptLines((prev) => {
        if (prev.some((p) => p.id === line.id)) return prev;
        return [...prev, { ...line, isLocal: false }];
      });
    };
    socket.on('call:transcription', handleRemoteTranscription);
    return () => {
      socket.off('call:transcription', handleRemoteTranscription);
    };
  }, [isInCall]);

  // Download transcript as plain text
  const downloadTranscript = useCallback(() => {
    if (!transcriptLines.length) return;
    const text = transcriptLines
      .map((l) => `[${l.timestamp}] ${l.speaker}: ${l.text}`)
      .join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${roomIdRef.current}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [transcriptLines]);

  // ─── Fetch active platform users ───────────────────────────────────────────
  const fetchActiveUsers = useCallback(async () => {
    setLoadingActiveUsers(true);
    try {
      const res = await callService.getActiveUsers();
      if (res.users) setActivePlatformUsers(res.users);
    } catch (err) {
      console.warn('[VideoCall] Could not fetch active users:', err.message);
    } finally {
      setLoadingActiveUsers(false);
    }
  }, []);

  // Fetch active users on mount, poll every 15s. Stop camera on unmount.
  useEffect(() => {
    fetchActiveUsers();
    const interval = setInterval(fetchActiveUsers, 15000);
    return () => {
      clearInterval(interval);
      stopHardwareMedia();
    };
  }, [fetchActiveUsers]);

  // ─── Call duration timer ────────────────────────────────────────────────────
  useEffect(() => {
    if (isInCall) {
      setCallDuration(0);
      callTimerRef.current = setInterval(() => setCallDuration((s) => s + 1), 1000);
    } else {
      clearInterval(callTimerRef.current);
    }
    return () => clearInterval(callTimerRef.current);
  }, [isInCall]);

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // ─── ICE candidate queue processing ────────────────────────────────────────
  const processQueuedCandidates = async (socketId, pc) => {
    const queue = iceQueuesRef.current.get(socketId) || [];
    iceQueuesRef.current.set(socketId, []);
    for (const candidate of queue) {
      try {
        if (candidate && candidate.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (e) {
        console.warn('[WebRTC] Buffered ICE candidate failed:', e.message);
      }
    }
  };

  // ─── Start hardware camera/mic ──────────────────────────────────────────────
  const startHardwareMedia = async (withVideo = true, withAudio = true) => {
    let videoTrack = null;
    let audioTrack = null;
    let fallbackCleanup = null;

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      // 1. Try real camera video
      if (withVideo) {
        try {
          const vStream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
            audio: false,
          });
          videoTrack = vStream.getVideoTracks()[0];
        } catch (vErr) {
          console.warn('[WebRTC] Camera unavailable (in use by another tab or blocked), using animated avatar:', vErr.message);
        }
      }

      // 2. Try real microphone audio
      if (withAudio) {
        try {
          const aStream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
          });
          audioTrack = aStream.getAudioTracks()[0];
        } catch (aErr) {
          console.warn('[WebRTC] Microphone unavailable:', aErr.message);
        }
      }
    }

    // Build the final combined stream
    const stream = new MediaStream();

    // Guarantee a video track exists
    if (videoTrack) {
      stream.addTrack(videoTrack);
    } else {
      const fallback = createFallbackStream(user?.name || 'You');
      const fbTrack = fallback.getVideoTracks()[0];
      if (fbTrack) {
        stream.addTrack(fbTrack);
        fallbackCleanup = fallback._cleanup;
      }
    }

    // Guarantee an audio track exists
    if (audioTrack) {
      stream.addTrack(audioTrack);
    } else {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          const oscillator = audioCtx.createOscillator();
          const dest = audioCtx.createMediaStreamDestination();
          oscillator.connect(dest);
          oscillator.start();
          const [silenceTrack] = dest.stream.getAudioTracks();
          if (silenceTrack) {
            silenceTrack.enabled = false;
            stream.addTrack(silenceTrack);
          }
        }
      } catch (_) { }
    }

    if (fallbackCleanup) {
      stream._cleanup = fallbackCleanup;
    }

    localStreamRef.current = stream;
    cameraStreamRef.current = stream;
    setLocalStream(stream);

    // Apply user's pre-join preferences
    stream.getAudioTracks().forEach((t) => { t.enabled = withAudio; });
    stream.getVideoTracks().forEach((t) => { t.enabled = withVideo; });

    return stream;
  };

  // ─── Stop hardware camera/mic ───────────────────────────────────────────────
  const stopHardwareMedia = () => {
    [localStreamRef.current, cameraStreamRef.current].forEach((s) => {
      if (s) {
        s.getTracks().forEach((t) => t.stop());
        if (s._cleanup) s._cleanup();
      }
    });
    localStreamRef.current = null;
    cameraStreamRef.current = null;
    setLocalStream(null);
  };

  // Helper to ensure all local tracks are attached to a peer connection
  const syncLocalTracksToPC = (pc) => {
    if (!localStreamRef.current) return;
    const senders = pc.getSenders();
    localStreamRef.current.getTracks().forEach((track) => {
      const sender = senders.find((s) => s.track && s.track.kind === track.kind);
      if (sender) {
        if (sender.track && sender.track.id !== track.id) {
          sender.replaceTrack(track).catch(() => {});
        }
      } else {
        try {
          pc.addTrack(track, localStreamRef.current);
        } catch (e) {
          console.warn('[WebRTC] addTrack warning:', e.message);
        }
      }
    });
  };

  // ─── Create RTCPeerConnection for a specific remote peer ───────────────────
  const createPeerConnection = useCallback((targetSocketId, targetUser) => {
    // Return existing if already created
    if (peerConnectionsRef.current.has(targetSocketId)) {
      const existingPc = peerConnectionsRef.current.get(targetSocketId);
      syncLocalTracksToPC(existingPc);
      return existingPc;
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionsRef.current.set(targetSocketId, pc);
    iceQueuesRef.current.set(targetSocketId, []);

    // Add local tracks to this peer connection
    syncLocalTracksToPC(pc);

    // ICE candidate generation → forward to peer via signaling server
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const socket = getCallSocket();
        socket.emit('call:signal', {
          to: targetSocketId,
          signal: { type: 'candidate', candidate: event.candidate.toJSON() },
        });
      }
    };

    pc.onicegatheringstatechange = () => {
      console.log(`[WebRTC] ICE gathering (${targetSocketId}):`, pc.iceGatheringState);
    };

    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC] Connection state (${targetSocketId}):`, pc.connectionState);
    };

    // Receive remote tracks → build remote MediaStream
    pc.ontrack = (event) => {
      console.log('[WebRTC] ontrack:', event.track.kind, 'from', targetSocketId, 'streams:', event.streams?.length);

      let remoteStream = remoteStreamsRef.current.get(targetSocketId);
      if (!remoteStream) {
        remoteStream = new MediaStream();
        remoteStreamsRef.current.set(targetSocketId, remoteStream);
      }

      // Add the track that arrived
      if (event.track) {
        const alreadyHasTrack = remoteStream.getTracks().find((t) => t.id === event.track.id);
        if (!alreadyHasTrack) {
          remoteStream.addTrack(event.track);
        }
      }

      // Also incorporate any other tracks in event.streams[0] if provided
      if (event.streams && event.streams[0]) {
        event.streams[0].getTracks().forEach((t) => {
          if (!remoteStream.getTracks().some((existing) => existing.id === t.id)) {
            remoteStream.addTrack(t);
          }
        });
      }

      // Force React state update with a new MediaStream wrapper so VideoCard always re-renders
      const updateStateStream = () => {
        const stream = remoteStreamsRef.current.get(targetSocketId);
        if (stream && stream.getTracks().length > 0) {
          setRemoteStreams((prev) => ({
            ...prev,
            [targetSocketId]: new MediaStream(stream.getTracks()),
          }));
        }
      };

      event.track.onunmute = () => {
        console.log('[WebRTC] Track unmuted:', event.track.kind, 'from', targetSocketId);
        updateStateStream();
      };

      updateStateStream();

      // Also keep participants in sync
      setParticipants((prev) => {
        const idx = prev.findIndex((p) => p.socketId === targetSocketId);
        const base = {
          socketId: targetSocketId,
          name: targetUser?.name || 'Participant',
          role: targetUser?.role || 'user',
          userId: targetUser?.userId || targetUser?.id,
          audioEnabled: true,
          videoEnabled: true,
          isScreenSharing: false,
        };
        if (idx !== -1) {
          const arr = [...prev];
          arr[idx] = { ...arr[idx], videoEnabled: true };
          return arr;
        }
        return [...prev, base];
      });
    };

    // Handle ICE connection state changes
    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      console.log(`[WebRTC] ICE state (${targetSocketId}):`, state);
      if (state === 'failed' || state === 'closed') {
        cleanupPeer(targetSocketId);
      }
    };

    return pc;
  }, []);

  // ─── Clean up a single peer ─────────────────────────────────────────────────
  const cleanupPeer = (socketId) => {
    const pc = peerConnectionsRef.current.get(socketId);
    if (pc) {
      pc.close();
      peerConnectionsRef.current.delete(socketId);
    }
    remoteStreamsRef.current.delete(socketId);
    iceQueuesRef.current.delete(socketId);
    setRemoteStreams((prev) => {
      const next = { ...prev };
      delete next[socketId];
      return next;
    });
    setParticipants((prev) => prev.filter((p) => p.socketId !== socketId));
  };

  // ─── Initiate offer to a specific peer ─────────────────────────────────────
  const sendOfferTo = async (targetSocketId, targetUser) => {
    const socket = getCallSocket();
    const pc = createPeerConnection(targetSocketId, targetUser);
    if (!pc || pc.signalingState !== 'stable') {
      console.log('[WebRTC] Skipping offer to', targetSocketId, 'state is', pc?.signalingState);
      return;
    }
    try {
      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
      await pc.setLocalDescription(offer);
      socket.emit('call:signal', { to: targetSocketId, signal: offer });
      console.log('[WebRTC] Offer sent to', targetSocketId);
    } catch (e) {
      console.error('[WebRTC] Failed to create/send offer:', e);
    }
  };

  // ─── Join Video Call (activates camera & mic) ───────────────────────────────
  const joinCall = async (targetRoom = roomId) => {
    if (connecting || isInCall) return;
    setConnecting(true);
    setRoomId(targetRoom);
    roomIdRef.current = targetRoom;
    setSearchParams({ room: targetRoom });

    // Start hardware
    const stream = await startHardwareMedia(videoEnabled, audioEnabled);

    const socket = getCallSocket();
    if (!socket.connected) socket.connect();

    // Remove any stale listeners from a previous call session
    socket.off('call:all-users');
    socket.off('call:user-joined');
    socket.off('call:signal');
    socket.off('call:user-media-toggled');
    socket.off('call:chat-message');
    socket.off('call:user-left');

    // ── Handler: list of existing participants sent when WE join ──────────────
    socket.on('call:all-users', async ({ participants: existingList }) => {
      console.log('[VideoCall] Existing participants:', existingList);
      const initial = [];

      for (const peer of existingList) {
        if (peer.socketId === socket.id) continue;
        initial.push({
          socketId: peer.socketId,
          name: peer.name,
          role: peer.role,
          userId: peer.userId,
          stream: null,
          audioEnabled: peer.audioEnabled !== false,
          videoEnabled: peer.videoEnabled !== false,
          isScreenSharing: false,
        });
        // Send offer to this existing participant
        await sendOfferTo(peer.socketId, peer);
      }

      setParticipants(initial);
      setIsInCall(true);
      setConnecting(false);
      toast.success(`✅ Connected to room: ${targetRoom}`);
    });

    // ── Handler: a NEW user joined the room ───────────────────────────────────
    socket.on('call:user-joined', async (newPeer) => {
      console.log('[VideoCall] New peer joined:', newPeer.name, newPeer.socketId);
      toast(`👋 ${newPeer.name} joined the call`, { icon: '🟢' });

      setParticipants((prev) => {
        if (prev.some((p) => p.socketId === newPeer.socketId)) return prev;
        return [
          ...prev,
          {
            socketId: newPeer.socketId,
            name: newPeer.name,
            role: newPeer.role,
            userId: newPeer.userId,
            stream: null,
            audioEnabled: newPeer.audioEnabled !== false,
            videoEnabled: newPeer.videoEnabled !== false,
            isScreenSharing: false,
          },
        ];
      });

      // Prepare peer connection with local tracks ready for newcomer's offer
      createPeerConnection(newPeer.socketId, newPeer);
    });

    // ── Handler: WebRTC signaling (offer / answer / ICE candidate) ────────────
    socket.on('call:signal', async ({ from, signal, sender }) => {
      let pc = peerConnectionsRef.current.get(from);
      if (!pc) {
        pc = createPeerConnection(from, sender);
      }

      // Ensure participant row exists in state
      setParticipants((prev) => {
        if (prev.some((p) => p.socketId === from)) return prev;
        return [
          ...prev,
          {
            socketId: from,
            name: sender?.name || 'Participant',
            role: sender?.role || 'user',
            userId: sender?.userId || sender?.id,
            stream: remoteStreamsRef.current.get(from) || null,
            audioEnabled: true,
            videoEnabled: true,
            isScreenSharing: false,
          },
        ];
      });

      try {
        if (signal.type === 'offer') {
          // Handle offer collision with polite peer pattern
          if (pc.signalingState !== 'stable') {
            console.warn('[WebRTC] Offer collision detected with', from, 'state:', pc.signalingState);
            const isPolite = socket.id < from;
            if (!isPolite) {
              console.log('[WebRTC] Impolite peer ignoring colliding offer from', from);
              return;
            }
            try {
              await pc.setLocalDescription({ type: 'rollback' });
            } catch (rbErr) {
              console.warn('[WebRTC] Rollback error:', rbErr.message);
            }
          }

          // Ensure our local tracks are attached before answering
          syncLocalTracksToPC(pc);

          await pc.setRemoteDescription(new RTCSessionDescription(signal));
          await processQueuedCandidates(from, pc);

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('call:signal', { to: from, signal: answer });
          console.log('[WebRTC] Answer sent to', from);

        } else if (signal.type === 'answer') {
          if (pc.signalingState === 'have-local-offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(signal));
            await processQueuedCandidates(from, pc);
            console.log('[WebRTC] Answer applied from', from);
          } else {
            console.warn('[WebRTC] Answer ignored because state is', pc.signalingState);
          }

        } else if (signal.type === 'candidate' && signal.candidate) {
          // Buffer candidates until remote description is set
          if (!pc.remoteDescription || !pc.remoteDescription.type) {
            const queue = iceQueuesRef.current.get(from) || [];
            queue.push(signal.candidate);
            iceQueuesRef.current.set(from, queue);
          } else {
            try {
              if (signal.candidate && signal.candidate.candidate) {
                await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
              }
            } catch (e) {
              console.warn('[WebRTC] addIceCandidate failed:', e.message);
            }
          }
        }
      } catch (err) {
        console.error('[WebRTC] Signaling error:', err);
      }
    });

// ── Handler: remote peer toggled audio/video ──────────────────────────────
socket.on('call:user-media-toggled', ({ socketId, audioEnabled: a, videoEnabled: v, isScreenSharing: s }) => {
  setParticipants((prev) =>
    prev.map((p) => {
      if (p.socketId !== socketId) return p;
      return {
        ...p,
        audioEnabled: typeof a === 'boolean' ? a : p.audioEnabled,
        videoEnabled: typeof v === 'boolean' ? v : p.videoEnabled,
        isScreenSharing: typeof s === 'boolean' ? s : p.isScreenSharing,
      };
    })
  );
});

// ── Handler: in-call chat ─────────────────────────────────────────────────
socket.on('call:chat-message', (msg) => {
  setChatMessages((prev) => [...prev, msg]);
  if (sidebarTab !== 'chat') {
    toast(`💬 ${msg.sender?.name}: ${msg.message.slice(0, 30)}...`, { duration: 3000 });
  }
});

// ── Handler: peer left ────────────────────────────────────────────────────
socket.on('call:user-left', ({ socketId, name }) => {
  toast(`${name || 'A participant'} left the call`, { icon: '👋' });
  cleanupPeer(socketId);
});

// Emit join-room to server
socket.emit('call:join-room', {
  roomId: targetRoom,
  user: {
    id: user?.id || user?._id,
    name: user?.name || 'You',
    email: user?.email || '',
    role: user?.role || 'user',
    audioEnabled,
    videoEnabled,
  },
});
  };

// ─── Leave Call ─────────────────────────────────────────────────────────────
const leaveCall = () => {
  const socket = getCallSocket();
  if (socket && socket.connected) {
    socket.emit('call:leave-room', { roomId: roomIdRef.current });
    socket.off('call:all-users');
    socket.off('call:user-joined');
    socket.off('call:signal');
    socket.off('call:user-media-toggled');
    socket.off('call:chat-message');
    socket.off('call:user-left');
  }

  // Close all peer connections
  peerConnectionsRef.current.forEach((pc) => pc.close());
  peerConnectionsRef.current.clear();
  remoteStreamsRef.current.clear();
  iceQueuesRef.current.clear();

  // Turn off camera & mic
  stopHardwareMedia();

  setParticipants([]);
  setRemoteStreams({});
  setIsInCall(false);
  setIsScreenSharing(false);
  setChatMessages([]);
  toast('Call ended. Camera & microphone disabled.', { icon: '📞' });
};

// ─── Toggle Microphone ──────────────────────────────────────────────────────
const toggleAudio = () => {
  const next = !audioEnabled;
  setAudioEnabled(next);

  if (localStreamRef.current) {
    localStreamRef.current.getAudioTracks().forEach((t) => { t.enabled = next; });
    const socket = getCallSocket();
    socket.emit('call:toggle-media', { roomId: roomIdRef.current, audioEnabled: next });
  }
};

// ─── Toggle Camera ──────────────────────────────────────────────────────────
const toggleVideo = () => {
  const next = !videoEnabled;
  setVideoEnabled(next);

  if (localStreamRef.current) {
    localStreamRef.current.getVideoTracks().forEach((t) => { t.enabled = next; });
    const socket = getCallSocket();
    socket.emit('call:toggle-media', { roomId: roomIdRef.current, videoEnabled: next });
  }
};

// ─── Screen Share ───────────────────────────────────────────────────────────
const toggleScreenShare = async () => {
  if (!isInCall) return;

  if (!isScreenSharing) {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      const screenVideoTrack = screenStream.getVideoTracks()[0];

      // Replace video track in all peer connections
      peerConnectionsRef.current.forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
        if (sender) sender.replaceTrack(screenVideoTrack);
      });

      // Save original camera stream
      cameraStreamRef.current = localStreamRef.current;

      // Build a combined stream (screen video + original audio)
      const combined = new MediaStream();
      combined.addTrack(screenVideoTrack);
      localStreamRef.current.getAudioTracks().forEach((t) => combined.addTrack(t));
      localStreamRef.current = combined;
      setLocalStream(combined);

      screenVideoTrack.onended = () => stopScreenShare();

      setIsScreenSharing(true);
      const socket = getCallSocket();
      socket.emit('call:toggle-media', { roomId: roomIdRef.current, isScreenSharing: true });
      toast.success('Screen sharing started');
    } catch (err) {
      console.warn('[VideoCall] Screen share failed:', err.message);
    }
  } else {
    stopScreenShare();
  }
};

const stopScreenShare = () => {
  const cameraStream = cameraStreamRef.current || localStreamRef.current;
  const cameraVideoTrack = cameraStream?.getVideoTracks()[0];

  if (cameraVideoTrack) {
    peerConnectionsRef.current.forEach((pc) => {
      const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
      if (sender) sender.replaceTrack(cameraVideoTrack);
    });
  }

  localStreamRef.current = cameraStream;
  setLocalStream(cameraStream);
  setIsScreenSharing(false);

  const socket = getCallSocket();
  socket.emit('call:toggle-media', { roomId: roomIdRef.current, isScreenSharing: false });
  toast('Screen sharing stopped', { icon: '🖥️' });
};

// ─── In-Call Chat ───────────────────────────────────────────────────────────
const sendChatMessage = (e) => {
  e.preventDefault();
  if (!chatInput.trim()) return;

  const socket = getCallSocket();
  socket.emit('call:chat-message', {
    roomId: roomIdRef.current,
    message: chatInput.trim(),
    user: { id: user?.id || user?._id, name: user?.name || 'You', role: user?.role || 'user' },
  });
  setChatInput('');
};

// ─── Utility ────────────────────────────────────────────────────────────────
const copyRoomLink = () => {
  const url = `${window.location.origin}/video-call?room=${encodeURIComponent(roomId)}`;
  navigator.clipboard.writeText(url);
  setCopiedLink(true);
  toast.success('Room invite link copied!');
  setTimeout(() => setCopiedLink(false), 2500);
};

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    containerRef.current?.requestFullscreen().catch(() => { });
    setFullscreen(true);
  } else {
    document.exitFullscreen().catch(() => { });
    setFullscreen(false);
  }
};

// ─── Grid layout ────────────────────────────────────────────────────────────
const totalCallers = 1 + participants.length;
const gridClass =
  totalCallers === 1
    ? 'grid-cols-1'
    : totalCallers === 2
      ? 'grid-cols-1 md:grid-cols-2'
      : totalCallers <= 4
        ? 'grid-cols-1 sm:grid-cols-2'
        : totalCallers <= 6
          ? 'grid-cols-2 md:grid-cols-3'
          : 'grid-cols-2 md:grid-cols-4';

// ─── Render ─────────────────────────────────────────────────────────────────
return (
  <div ref={containerRef} className="space-y-6">
    {/* ─── TOP HEADER ──────────────────────────────────────────────────────── */}
    <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl lg:flex-row lg:items-center lg:justify-between">
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 shadow-lg shadow-indigo-500/30">
            <Video className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-white lg:text-2xl">
                Live Video Conference
              </h1>
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                Active Users Ready
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Connect and video call active teammates in real-time using WebRTC peer-to-peer streaming.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <button
          onClick={() => inviteAllActive(roomId)}
          className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-600 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-600 hover:to-teal-700 transition-all hover:scale-[1.02] active:scale-[0.98]"
          title="Broadcast video call alert to all currently online users"
        >
          <Radio className="h-4 w-4 animate-pulse text-white" />
          <span>Connect All Active Users</span>
        </button>

        <button
          onClick={copyRoomLink}
          className="flex items-center gap-1.5 rounded-2xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition-all"
        >
          {copiedLink ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
          <span>{copiedLink ? 'Copied Link' : 'Copy Room Link'}</span>
        </button>
      </div>
    </div>

    {/* ─── ACTIVE USERS QUICK CONNECT ROW ──────────────────────────────────── */}
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
          </span>
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
            Active Platform Users ({activePlatformUsers.length})
          </h3>
          <span className="text-xs text-slate-400 font-medium">Click to connect directly</span>
        </div>

        <button
          onClick={fetchActiveUsers}
          disabled={loadingActiveUsers}
          className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loadingActiveUsers ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {activePlatformUsers.length === 0 ? (
        <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl">
          No external users currently active. Open this page in another browser tab to test multi-user calling!
        </div>
      ) : (
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
          {activePlatformUsers.map((u) => {
            const isCurrentUser = String(u.id) === String(user?.id || user?._id);
            return (
              <div
                key={u.id}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 shrink-0 hover:border-indigo-300 hover:bg-indigo-50/40 transition-all shadow-xs"
              >
                <div className="relative">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-black text-xs shadow-sm">
                    {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <p className="text-xs font-bold text-slate-900 truncate max-w-[120px]">{u.name}</p>
                    {u.role === 'admin' && (
                      <Crown className="h-3 w-3 text-amber-500 shrink-0" title="Admin" />
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 truncate max-w-[120px]">{u.title || u.role}</p>
                </div>

                {!isCurrentUser && (
                  <button
                    onClick={() => inviteUser(u.id, roomId)}
                    className="ml-1 flex items-center gap-1 rounded-xl bg-indigo-600 px-2.5 py-1.5 text-[10px] font-bold text-white shadow-xs hover:bg-indigo-700 transition-colors"
                    title={`Send video call invite to ${u.name}`}
                  >
                    <PhoneCall className="h-3 w-3" />
                    <span>Call</span>
                  </button>
                )}
                {isCurrentUser && (
                  <span className="ml-1 rounded-lg bg-slate-200 px-2 py-1 text-[9px] font-bold text-slate-600">
                    You
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>

    {/* ─── MAIN CALL AREA ──────────────────────────────────────────────────── */}
    {!isInCall ? (
      /* LOBBY: camera & mic remain OFF */
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Privacy Preview Card */}
        <div className="lg:col-span-7 flex flex-col justify-between rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-2xl relative overflow-hidden min-h-[440px]">
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-slate-800 flex flex-col items-center justify-center min-h-[300px] p-6 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 mb-4 shadow-xl">
              <ShieldCheck className="h-10 w-10 text-indigo-400" />
            </div>

            <h3 className="text-lg font-bold text-white">Camera &amp; Microphone are Inactive</h3>
            <p className="text-xs text-slate-400 max-w-md mt-1 leading-relaxed">
              Hardware privacy protected. Your camera and microphone only activate when you connect to the call, and will turn off immediately when you leave.
            </p>

            <div className="mt-4 flex items-center gap-2 rounded-full bg-slate-900/80 border border-slate-800 px-3.5 py-1 text-xs text-slate-300">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Ready to stream upon joining</span>
            </div>
          </div>

          {/* Pre-join preferences */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800/80 pt-4">
            <span className="text-xs text-slate-400 font-semibold">Join preferences:</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setAudioEnabled(!audioEnabled)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${audioEnabled
                    ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30 shadow-sm'
                    : 'bg-red-500/20 text-red-400 border border-red-500/40'
                  }`}
              >
                {audioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                <span>{audioEnabled ? 'Mic: On' : 'Mic: Muted'}</span>
              </button>

              <button
                onClick={() => setVideoEnabled(!videoEnabled)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${videoEnabled
                    ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30 shadow-sm'
                    : 'bg-red-500/20 text-red-400 border border-red-500/40'
                  }`}
              >
                {videoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                <span>{videoEnabled ? 'Camera: On' : 'Camera: Off'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Join Panel */}
        <div className="lg:col-span-5 flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-5">
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200 px-3 py-1 text-xs font-bold text-indigo-700">
                <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                Instant Video Room
              </span>
              <h2 className="mt-2 text-2xl font-black text-slate-900">Ready to join?</h2>
              <p className="text-xs text-slate-500 mt-1">
                Connect with all active users. WebRTC peer-to-peer audio &amp; video with low latency.
              </p>
            </div>

            {/* Room ID input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Meeting Room ID</label>
              <div className="relative">
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value.trim().toLowerCase())}
                  placeholder="e.g. active-users-room"
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setRoomId('active-users-room')}
                  className="text-[11px] font-bold text-indigo-600 hover:underline"
                >
                  #active-users-room
                </button>
                <span className="text-slate-300">·</span>
                <button
                  type="button"
                  onClick={() => setRoomId(`meeting-${Math.random().toString(36).substr(2, 6)}`)}
                  className="text-[11px] font-bold text-slate-500 hover:text-slate-700"
                >
                  Generate Random ID
                </button>
              </div>
            </div>

            {/* Profile info */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Joining as</p>
              <div className="mt-2 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-sm">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">{user?.name || 'Anonymous'}</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={() => joinCall(roomId)}
              disabled={connecting}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 py-4 text-sm font-black text-white shadow-xl shadow-indigo-600/30 hover:from-indigo-700 hover:to-violet-700 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              {connecting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Activating Camera &amp; Connecting…</span>
                </>
              ) : (
                <>
                  <Video className="h-5 w-5" />
                  <span>Join Video Call Now</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    ) : (
      /* ─── ACTIVE CALL STAGE ────────────────────────────────────────────── */
      <div className="relative rounded-3xl border border-slate-800 bg-slate-950 p-4 shadow-2xl flex flex-col min-h-[640px]">
        {/* In-call status bar */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 px-2 pb-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 rounded-full bg-red-500/20 border border-red-500/40 px-3 py-1 text-xs font-bold text-red-400">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              LIVE
            </span>
            <div className="flex items-center gap-2 text-white">
              <span className="font-black text-sm">Room: {roomId}</span>
              <span className="text-slate-500">|</span>
              <span className="font-mono text-xs text-slate-300">{formatTimer(callDuration)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl font-medium">
              <Users className="h-3.5 w-3.5 text-indigo-400" />
              <span>{totalCallers} Connected</span>
            </span>

            <button
              onClick={toggleFullscreen}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
              title="Fullscreen"
            >
              {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Video grid + sidebar */}
        <div className="flex flex-1 gap-4 overflow-hidden relative min-h-[460px]">
          <div className={`grid ${gridClass} gap-4 flex-1 auto-rows-fr`}>
            {/* Local user */}
            <VideoCard
              stream={localStream}
              isLocal={true}
              name={user?.name || 'You'}
              role={user?.role || 'user'}
              isMuted={!audioEnabled}
              isVideoOff={!videoEnabled}
              isScreenSharing={isScreenSharing}
            />

            {/* Remote participants */}
            {participants.map((p) => (
              <VideoCard
                key={p.socketId}
                stream={remoteStreams[p.socketId] || null}
                isLocal={false}
                name={p.name}
                role={p.role}
                isMuted={p.audioEnabled === false}
                isVideoOff={p.videoEnabled === false}
                isScreenSharing={p.isScreenSharing}
              />
            ))}
          </div>

          {/* Sidebar drawer */}
          {sidebarTab && (
            <div className="w-80 rounded-2xl border border-slate-800 bg-slate-900 p-4 flex flex-col justify-between shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  {sidebarTab === 'chat' ? (
                    <>
                      <MessageSquare className="h-4 w-4 text-indigo-400" />
                      <span>Meeting Chat</span>
                    </>
                  ) : sidebarTab === 'transcript' ? (
                    <>
                      <Mic className="h-4 w-4 text-violet-400" />
                      <span>Live Transcript</span>
                    </>
                  ) : (
                    <>
                      <Users className="h-4 w-4 text-emerald-400" />
                      <span>Participants</span>
                    </>
                  )}
                </h4>
                <button
                  onClick={() => setSidebarTab(null)}
                  className="text-xs font-bold text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {sidebarTab === 'chat' ? (
                <div className="flex-1 flex flex-col justify-between pt-3 overflow-hidden">
                  <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
                    {chatMessages.length === 0 ? (
                      <p className="text-center text-xs text-slate-500 py-8">
                        No messages yet. Say hi!
                      </p>
                    ) : (
                      chatMessages.map((m) => (
                        <div key={m.id} className="rounded-xl bg-slate-800/80 p-2.5 text-xs text-slate-200">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-indigo-400">{m.sender?.name || 'User'}</span>
                            <span className="text-[10px] text-slate-500">
                              {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-white text-xs break-words">{m.message}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <form onSubmit={sendChatMessage} className="mt-3 flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Type a message…"
                      className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="submit"
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </form>
                </div>
              ) : sidebarTab === 'transcript' ? (
                /* ── Transcription Panel ── */
                <div className="flex-1 flex flex-col pt-3 overflow-hidden gap-3">
                  {/* Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleTranscription}
                      className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${transcriptionEnabled
                          ? 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30'
                          : 'bg-violet-600 text-white hover:bg-violet-700'
                        }`}
                    >
                      {transcriptionEnabled ? (
                        <><MicOff className="h-3.5 w-3.5" /><span>Stop Transcription</span></>
                      ) : (
                        <><Mic className="h-3.5 w-3.5" /><span>Start Transcription</span></>
                      )}
                    </button>
                    {transcriptLines.length > 0 && (
                      <button
                        onClick={downloadTranscript}
                        title="Download transcript as .txt"
                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                      </button>
                    )}
                  </div>

                  {!transcriptionEnabled && transcriptLines.length === 0 && (
                    <p className="text-center text-xs text-slate-500 py-6 leading-relaxed">
                      Click <strong className="text-violet-400">Start Transcription</strong> to begin real-time speech-to-text. Works in Chrome &amp; Edge. Each speaker's words appear here and are shared with all participants.
                    </p>
                  )}

                  {/* Transcript lines */}
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                    {transcriptLines.map((line) => (
                      <div key={line.id} className={`rounded-xl p-2.5 text-xs ${line.isLocal ? 'bg-violet-900/40 border border-violet-700/30' : 'bg-slate-800/80'}`}>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className={`font-bold ${line.isLocal ? 'text-violet-300' : 'text-indigo-400'}`}>
                            {line.speaker}{line.isLocal ? ' (You)' : ''}
                          </span>
                          <span className="text-[10px] text-slate-500">{line.timestamp}</span>
                        </div>
                        <p className="text-white leading-relaxed">{line.text}</p>
                      </div>
                    ))}

                    {/* Live interim caption */}
                    {liveCaption && (
                      <div className="rounded-xl p-2.5 text-xs bg-violet-900/20 border border-violet-700/20 border-dashed">
                        <span className="font-bold text-violet-400">{user?.name} (typing…)</span>
                        <p className="text-slate-400 italic mt-0.5">{liveCaption}</p>
                      </div>
                    )}
                    <div ref={transcriptEndRef} />
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto pt-3 space-y-2 scrollbar-thin">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                    In this call ({totalCallers})
                  </p>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between rounded-xl bg-slate-800/70 p-2 text-xs text-white">
                      <span className="font-semibold">{user?.name || 'You'} (You)</span>
                      <span className="text-[10px] text-emerald-400 font-bold">Host</span>
                    </div>
                    {participants.map((p) => (
                      <div
                        key={p.socketId}
                        className="flex items-center justify-between rounded-xl bg-slate-800/70 p-2 text-xs text-white"
                      >
                        <span className="font-semibold">{p.name}</span>
                        <span className="text-[10px] text-slate-400">Connected</span>
                      </div>
                    ))}
                  </div>

                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mt-5 mb-2">
                    Invite Online Teammates
                  </p>
                  <div className="space-y-1.5">
                    {activePlatformUsers.map((u) => {
                      if (String(u.id) === String(user?.id || user?._id)) return null;
                      return (
                        <div
                          key={u.id}
                          className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-2 text-xs"
                        >
                          <span className="text-slate-300 truncate max-w-[120px]">{u.name}</span>
                          <button
                            onClick={() => inviteUser(u.id, roomId)}
                            className="rounded-lg bg-indigo-600/80 px-2 py-1 text-[10px] font-bold text-white hover:bg-indigo-600"
                          >
                            Invite
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Live caption overlay — shown at bottom of video area when transcription is on */}
        {transcriptionEnabled && liveCaption && (
          <div className="mx-4 mb-2 rounded-xl bg-black/70 backdrop-blur-md px-4 py-2 text-center">
            <p className="text-xs text-slate-400 font-semibold">
              <span className="text-violet-400">{user?.name}:</span>{' '}
              <span className="text-white italic">{liveCaption}</span>
            </p>
          </div>
        )}

        {/* ── Bottom controls bar ─────────────────────────────────────────── */}
        <div className="mt-4 flex items-center justify-center gap-3 pt-2">
          <div className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl px-4 py-2.5 shadow-2xl">
            {/* Mic */}
            <button
              onClick={toggleAudio}
              className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all ${audioEnabled
                  ? 'bg-slate-800 text-white hover:bg-slate-700'
                  : 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30'
                }`}
              title={audioEnabled ? 'Mute Mic' : 'Unmute Mic'}
            >
              {audioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </button>

            {/* Camera */}
            <button
              onClick={toggleVideo}
              className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all ${videoEnabled
                  ? 'bg-slate-800 text-white hover:bg-slate-700'
                  : 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30'
                }`}
              title={videoEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
            >
              {videoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </button>

            {/* Screen share */}
            <button
              onClick={toggleScreenShare}
              className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all ${isScreenSharing
                  ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              title={isScreenSharing ? 'Stop Screen Sharing' : 'Share Screen'}
            >
              <ScreenShare className="h-5 w-5" />
            </button>

            <div className="h-6 w-px bg-slate-800 mx-1" />

            {/* Transcription button */}
            <button
              onClick={toggleTranscription}
              className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all relative ${transcriptionEnabled
                  ? 'bg-violet-600 text-white hover:bg-violet-700'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              title={transcriptionEnabled ? 'Stop Live Transcription' : 'Start Live Transcription'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
              {transcriptionEnabled && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-violet-300 animate-ping" />
              )}
            </button>

            {/* Transcript panel button */}
            <button
              onClick={() => setSidebarTab(sidebarTab === 'transcript' ? null : 'transcript')}
              className={`relative flex h-11 w-11 items-center justify-center rounded-xl transition-all ${sidebarTab === 'transcript'
                  ? 'bg-violet-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              title="View Live Transcript"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              {transcriptLines.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-violet-500 text-[9px] font-bold text-white">
                  {transcriptLines.length > 9 ? '9+' : transcriptLines.length}
                </span>
              )}
            </button>

            {/* Participants panel */}
            <button
              onClick={() => setSidebarTab(sidebarTab === 'users' ? null : 'users')}
              className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all ${sidebarTab === 'users'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              title="Participants"
            >
              <Users className="h-5 w-5" />
            </button>

            {/* Chat panel */}
            <button
              onClick={() => setSidebarTab(sidebarTab === 'chat' ? null : 'chat')}
              className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all ${sidebarTab === 'chat'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              title="In-call Chat"
            >
              <MessageSquare className="h-5 w-5" />
            </button>

            <div className="h-6 w-px bg-slate-800 mx-1" />

            {/* End call */}
            <button
              onClick={leaveCall}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-red-600/30 hover:from-red-700 hover:to-rose-700 transition-all hover:scale-[1.02] active:scale-[0.98]"
              title="Leave Meeting & Turn Off Camera/Mic"
            >
              <PhoneOff className="h-4 w-4" />
              <span>End Call</span>
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);
}
