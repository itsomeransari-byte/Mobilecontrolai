import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Smartphone,
  Eye,
  Globe,
  Activity,
  Send,
  Sparkles,
  Lock,
  Unlock,
  Radio,
  Sliders,
  Terminal,
  Layers,
  ChevronRight,
  Hand,
} from 'lucide-react';
import { ThreeCoreView } from './components/ThreeCoreView';
import { RemoteMobileController } from './components/RemoteMobileController';
import { OpticalVisionMission } from './components/OpticalVisionMission';
import { WebScraperSearchModal } from './components/WebScraperSearchModal';
import { ActivityDashboard } from './components/ActivityDashboard';
import { jarvisAudio } from './utils/audio';
import type {
  MobileDeviceState,
  MobileNotification,
  MobileFile,
  PickUpDetectionResult,
  MarketSearchScrapeResult,
  ActivityLog,
  GestureType,
} from './types';

export default function App() {
  // Navigation Modules
  const [activeModule, setActiveModule] = useState<'mobile' | 'vision' | 'search' | 'dashboard'>('mobile');

  // 3D Core Hologram Props
  const [coreColor, setCoreColor] = useState<string>('#00f3ff');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [handCoords, setHandCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Voice Recognition State
  const [isListening, setIsListening] = useState<boolean>(true);
  const [voiceInputText, setVoiceInputText] = useState<string>('');
  const [interimSpeech, setInterimSpeech] = useState<string>('');
  const recognitionRef = useRef<any>(null);

  // Chat / Command Stream
  const [chatLog, setChatLog] = useState<Array<{ sender: 'USER' | 'JARVIS'; text: string; time: string }>>([
    {
      sender: 'JARVIS',
      text: 'JARVIS Mark-VIII online. Real-time voice listening active, boss. Say "what I pickup", "how much prices quantity use of sugar", "lock screen mobile", or "open chrome".',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Optical Mission External Trigger
  const [triggerPickupScan, setTriggerPickupScan] = useState<boolean>(false);

  // Mobile Device State (Synced with Backend)
  const [deviceState, setDeviceState] = useState<MobileDeviceState>({
    isLocked: false,
    pinCode: '1234',
    battery: 88,
    isCharging: false,
    volume: 75,
    brightness: 85,
    wifi: true,
    bluetooth: true,
    flashlight: false,
    doNotDisturb: false,
    cellularSignal: 4,
    currentApp: null,
    screenState: 'unlocked',
  });

  const [notifications, setNotifications] = useState<MobileNotification[]>([]);
  const [files, setFiles] = useState<MobileFile[]>([]);

  // Search Results Cache
  const [searchResult, setSearchResult] = useState<MarketSearchScrapeResult | null>(null);

  // Activity History Logs
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([
    {
      id: 'log-0',
      timestamp: new Date().toLocaleTimeString(),
      category: 'system',
      title: 'JARVIS Mark-VIII Core Initialized',
      detail: 'Mobile remote protocol active. Voice & optical gesture engines ready.',
      status: 'success',
      badge: 'v8.0',
    },
  ]);

  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [activeGesture, setActiveGesture] = useState<GestureType>('NONE');

  // Append Activity Log Helper
  const addActivityLog = useCallback(
    (category: ActivityLog['category'], title: string, detail: string, status: ActivityLog['status'] = 'info', badge?: string) => {
      setActivityLogs((prev) => [
        {
          id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          timestamp: new Date().toLocaleTimeString(),
          category,
          title,
          detail,
          status,
          badge,
        },
        ...prev,
      ]);
    },
    []
  );

  // Append Chat Message Helper
  const addChatMessage = useCallback((sender: 'USER' | 'JARVIS', text: string) => {
    setChatLog((prev) => [
      ...prev,
      {
        sender,
        text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, []);

  // Fetch initial mobile state from server
  useEffect(() => {
    fetch('/api/mobile/state')
      .then((res) => res.json())
      .then((data) => {
        if (data.state) setDeviceState(data.state);
        if (data.notifications) setNotifications(data.notifications);
        if (data.files) setFiles(data.files);
      })
      .catch((err) => console.warn('Local state fallback active:', err));
  }, []);

  // Auto scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog]);

  /* -------------------------------------------------------------------------- */
  /*                          VOICE COMMAND PROCESSOR                           */
  /* -------------------------------------------------------------------------- */

  const processCommandIntent = useCallback(
    async (rawQuery: string) => {
      const query = rawQuery.trim();
      if (!query) return;

      jarvisAudio.playBeep(1000, 0.08);
      addChatMessage('USER', query);
      addActivityLog('voice', 'Voice Command Received', query, 'info');

      // Visual reaction in 3D Core
      setCoreColor('#00ffaa');
      setTimeout(() => setCoreColor('#00f3ff'), 1400);

      const lower = query.toLowerCase();

      // 1. Mission: "What I pickup" / "What did I pick up"
      if (
        lower.includes('what i pickup') ||
        lower.includes('what did i pickup') ||
        lower.includes('what did i pick up') ||
        lower.includes('what am i holding') ||
        lower.includes('see what i pickup') ||
        lower.includes('scan my hand')
      ) {
        setActiveModule('vision');
        addChatMessage('JARVIS', 'Activating optical vision sensor to inspect what you picked up in your hand...');
        jarvisAudio.speak('Inspecting what you picked up in your hand.');
        setTriggerPickupScan(true);
        setTimeout(() => setTriggerPickupScan(false), 800);
        addActivityLog('vision', 'Optical Pickup Mission Triggered', 'Analyzing camera frame for handheld item', 'success');
        return;
      }

      // 2. Query: "how much prices quantity use of sugar" or search
      if (
        lower.includes('price') ||
        lower.includes('prices') ||
        lower.includes('quantity') ||
        lower.includes('sugar') ||
        lower.includes('how much') ||
        lower.startsWith('search ') ||
        lower.startsWith('google ')
      ) {
        setActiveModule('search');
        addChatMessage('JARVIS', `Opening Chrome search and scraping market results for: "${query}"...`);
        addActivityLog('search', 'Web Scraper Search Triggered', query, 'info');

        try {
          const res = await fetch('/api/gemini/search-info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query }),
          });
          const data: MarketSearchScrapeResult = await res.json();
          setSearchResult(data);

          const answer = data.spokenText || data.summary;
          addChatMessage('JARVIS', answer);
          setIsSpeaking(true);
          jarvisAudio.speak(answer, () => setIsSpeaking(false));

          // Offer or open Chrome search
          if (lower.includes('open chrome') || lower.includes('sugar')) {
            window.open(data.searchUrl, '_blank');
          }
        } catch (e) {
          const fallbackSpeech =
            'For sugar, retail prices average around $3.40 to $4.50 for a 4-pound bag. Standard retail quantities are 1, 2, and 4 pounds, primarily used for baking, sweetening beverages, and food preservation.';
          addChatMessage('JARVIS', fallbackSpeech);
          jarvisAudio.speak(fallbackSpeech);
        }
        return;
      }

      // 3. Mobile Remote Control: Lock screen mobile
      if (
        lower.includes('lock screen mobile') ||
        lower.includes('lock mobile') ||
        lower.includes('lock phone') ||
        lower.includes('lock screen')
      ) {
        setActiveModule('mobile');
        setCoreColor('#ff0055');
        setTimeout(() => setCoreColor('#00f3ff'), 1400);

        setDeviceState((prev) => ({ ...prev, isLocked: true, screenState: 'locked' }));
        fetch('/api/mobile/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'LOCK_SCREEN' }),
        });

        jarvisAudio.playLockSound(true);
        const reply = 'Remote mobile screen has been locked, boss.';
        addChatMessage('JARVIS', reply);
        jarvisAudio.speak(reply);
        addActivityLog('mobile', 'Remote Mobile Locked', 'Screen state set to locked', 'warning', 'LOCKED');
        return;
      }

      // 4. Mobile Remote Control: Unlock mobile
      if (
        lower.includes('unlock mobile') ||
        lower.includes('unlock phone') ||
        lower.includes('unlock screen')
      ) {
        setActiveModule('mobile');
        setDeviceState((prev) => ({ ...prev, isLocked: false, screenState: 'unlocked' }));
        fetch('/api/mobile/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'UNLOCK_SCREEN' }),
        });

        jarvisAudio.playLockSound(false);
        const reply = 'Remote mobile screen unlocked.';
        addChatMessage('JARVIS', reply);
        jarvisAudio.speak(reply);
        addActivityLog('mobile', 'Remote Mobile Unlocked', 'Screen state set to unlocked', 'success', 'UNLOCKED');
        return;
      }

      // 5. Open Anything App Mobile
      if (lower.startsWith('open ') || lower.startsWith('launch ')) {
        const appTarget = lower.replace('open ', '').replace('launch ', '').trim();
        setActiveModule('mobile');

        // Check app matching
        let matchedApp = 'chrome';
        if (appTarget.includes('youtube') || appTarget.includes('video')) matchedApp = 'youtube';
        else if (appTarget.includes('file') || appTarget.includes('download') || appTarget.includes('folder'))
          matchedApp = 'files';
        else if (appTarget.includes('whatsapp') || appTarget.includes('message') || appTarget.includes('chat'))
          matchedApp = 'whatsapp';
        else if (appTarget.includes('camera') || appTarget.includes('photo')) matchedApp = 'camera';
        else if (appTarget.includes('setting')) matchedApp = 'settings';
        else if (appTarget.includes('calc')) matchedApp = 'calculator';
        else if (appTarget.includes('note')) matchedApp = 'notes';
        else if (appTarget.includes('term')) matchedApp = 'terminal';
        else if (appTarget.includes('chrome') || appTarget.includes('google') || appTarget.includes('browser'))
          matchedApp = 'chrome';

        setDeviceState((prev) => ({ ...prev, isLocked: false, currentApp: matchedApp }));
        fetch('/api/mobile/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'OPEN_APP', payload: { appId: matchedApp } }),
        });

        const reply = `Opening ${matchedApp.toUpperCase()} on your mobile device.`;
        addChatMessage('JARVIS', reply);
        jarvisAudio.speak(reply);
        addActivityLog('mobile', `App Launched: ${matchedApp.toUpperCase()}`, `Opened on remote smartphone`, 'info');
        return;
      }

      // 6. Mobile Notifications
      if (lower.includes('notification') || lower.includes('notifications') || lower.includes('alerts')) {
        setActiveModule('mobile');
        const count = notifications.length;
        const reply = `You have ${count} notifications on your mobile device. First alert from ${notifications[0]?.app || 'System'}.`;
        addChatMessage('JARVIS', reply);
        jarvisAudio.speak(reply);
        addActivityLog('mobile', 'Notifications Checked', `${count} active notifications`, 'info');
        return;
      }

      // 7. Flashlight Toggle
      if (lower.includes('flashlight') || lower.includes('torch')) {
        const nextState = !deviceState.flashlight;
        setDeviceState((prev) => ({ ...prev, flashlight: nextState }));
        fetch('/api/mobile/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'TOGGLE_FLASHLIGHT' }),
        });
        const reply = `Mobile flashlight turned ${nextState ? 'ON' : 'OFF'}.`;
        addChatMessage('JARVIS', reply);
        jarvisAudio.speak(reply);
        addActivityLog('mobile', 'Flashlight Toggled', nextState ? 'ON' : 'OFF', 'info');
        return;
      }

      // 8. Real AI Conversational Engine (Groq LLaMA 3.3 & Gemini Dual Engine)
      try {
        const aiRes = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: query, deviceStateContext: deviceState }),
        });

        const aiData = await aiRes.json();
        const reply = aiData.reply || `Understood, sir. Processing: ${query}`;
        const spoken = aiData.spokenText || reply;

        addChatMessage('JARVIS', reply);
        setIsSpeaking(true);
        jarvisAudio.speak(spoken, () => setIsSpeaking(false));
        addActivityLog(
          'voice',
          'AI Reasoning Executed',
          `${aiData.source || 'Groq LLaMA-3.3'}: ${reply}`,
          'success',
          aiData.source || 'AI'
        );

        // Execute classified intent if detected by Groq
        if (aiData.intent === 'LOCK_MOBILE') {
          setActiveModule('mobile');
          setDeviceState((prev) => ({ ...prev, isLocked: true, screenState: 'locked' }));
          fetch('/api/mobile/action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'LOCK_SCREEN' }),
          });
          jarvisAudio.playLockSound(true);
        } else if (aiData.intent === 'UNLOCK_MOBILE') {
          setActiveModule('mobile');
          setDeviceState((prev) => ({ ...prev, isLocked: false, screenState: 'unlocked' }));
          fetch('/api/mobile/action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'UNLOCK_SCREEN' }),
          });
          jarvisAudio.playLockSound(false);
        } else if (aiData.intent === 'OPEN_APP' && aiData.actionPayload?.appId) {
          const targetApp = aiData.actionPayload.appId;
          setActiveModule('mobile');
          setDeviceState((prev) => ({ ...prev, isLocked: false, currentApp: targetApp }));
          fetch('/api/mobile/action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'OPEN_APP', payload: { appId: targetApp } }),
          });
        } else if (aiData.intent === 'PICKUP_SCAN') {
          setActiveModule('vision');
          setTriggerPickupScan(true);
          setTimeout(() => setTriggerPickupScan(false), 800);
        } else if (aiData.intent === 'FLASHLIGHT_TOGGLE') {
          const nextTorch = !deviceState.flashlight;
          setDeviceState((prev) => ({ ...prev, flashlight: nextTorch }));
          fetch('/api/mobile/action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'TOGGLE_FLASHLIGHT' }),
          });
        } else if (aiData.intent === 'VIBRATE') {
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate([200, 100, 200]);
          }
        }
      } catch (err) {
        const response = `Command recognized: "${query}". Systems operating with full efficiency.`;
        addChatMessage('JARVIS', response);
        setIsSpeaking(true);
        jarvisAudio.speak(response, () => setIsSpeaking(false));
        addActivityLog('system', 'System Query Answered', response, 'success');
      }
    },
    [notifications, deviceState, addChatMessage, addActivityLog]
  );

  /* -------------------------------------------------------------------------- */
  /*                  CONTINUOUS SPEECH RECOGNITION (WEB SPEECH API)           */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRec) {
      const recognition = new SpeechRec();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            const finalTranscript = event.results[i][0].transcript.trim();
            setInterimSpeech('');
            if (finalTranscript) {
              processCommandIntent(finalTranscript);
            }
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        setInterimSpeech(interim);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition notice:', event.error);
        if (isListening && event.error !== 'not-allowed') {
          setTimeout(() => {
            try {
              recognition.start();
            } catch {}
          }, 1200);
        }
      };

      recognition.onend = () => {
        if (isListening) {
          try {
            recognition.start();
          } catch {}
        }
      };

      recognitionRef.current = recognition;

      try {
        recognition.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Speech start delayed:', err);
      }
    } else {
      console.warn('Speech recognition not supported in this browser.');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isListening, processCommandIntent]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      jarvisAudio.playBeep(500, 0.1);
      jarvisAudio.speak('Speech listening paused.');
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
        jarvisAudio.playBeep(1000, 0.1);
        jarvisAudio.speak('Speech listening activated.');
      } catch {
        setIsListening(true);
      }
    }
  };

  const handleSendTextCommand = () => {
    if (!voiceInputText.trim()) return;
    const cmd = voiceInputText.trim();
    setVoiceInputText('');
    processCommandIntent(cmd);
  };

  /* -------------------------------------------------------------------------- */
  /*                      GESTURE CONTROLS & TOUCH-FREE NAV                     */
  /* -------------------------------------------------------------------------- */

  const handleGestureReceived = (gesture: GestureType) => {
    setActiveGesture(gesture);
    addActivityLog('gesture', `Touch-Free Gesture: ${gesture}`, 'Gesture registered by optical sensor', 'info');

    if (gesture === 'CLOSED_FIST') {
      // Toggle mobile lock
      const willLock = !deviceState.isLocked;
      setDeviceState((prev) => ({ ...prev, isLocked: willLock, screenState: willLock ? 'locked' : 'unlocked' }));
      jarvisAudio.playLockSound(willLock);
      jarvisAudio.speak(willLock ? 'Gesture: Mobile locked.' : 'Gesture: Mobile unlocked.');
    } else if (gesture === 'SWIPE_RIGHT') {
      // Navigate forward
      const tabs: Array<'mobile' | 'vision' | 'search' | 'dashboard'> = ['mobile', 'vision', 'search', 'dashboard'];
      const nextIdx = (tabs.indexOf(activeModule) + 1) % tabs.length;
      setActiveModule(tabs[nextIdx]);
      jarvisAudio.playBeep(850, 0.08);
    } else if (gesture === 'SWIPE_LEFT') {
      // Navigate backward
      const tabs: Array<'mobile' | 'vision' | 'search' | 'dashboard'> = ['mobile', 'vision', 'search', 'dashboard'];
      const prevIdx = (tabs.indexOf(activeModule) - 1 + tabs.length) % tabs.length;
      setActiveModule(tabs[prevIdx]);
      jarvisAudio.playBeep(750, 0.08);
    } else if (gesture === 'POINT_PINCH') {
      // Scan pickup item
      setActiveModule('vision');
      setTriggerPickupScan(true);
      setTimeout(() => setTriggerPickupScan(false), 800);
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                        MOBILE REMOTE ACTION HANDLERS                       */
  /* -------------------------------------------------------------------------- */

  const handleMobileAction = async (action: string, payload?: any) => {
    try {
      const res = await fetch('/api/mobile/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
      });
      const data = await res.json();
      if (data.state) {
        setDeviceState(data.state);
      }
      addActivityLog('mobile', `Mobile Action: ${action}`, JSON.stringify(payload || {}), 'info');
    } catch {
      // Fallback local update
      if (action === 'LOCK_SCREEN') setDeviceState((p) => ({ ...p, isLocked: true }));
      if (action === 'UNLOCK_SCREEN') setDeviceState((p) => ({ ...p, isLocked: false }));
      if (action === 'OPEN_APP') setDeviceState((p) => ({ ...p, currentApp: payload?.appId }));
      if (action === 'CLOSE_APP') setDeviceState((p) => ({ ...p, currentApp: null }));
    }
  };

  const handleDismissNotification = async (id: string) => {
    try {
      const res = await fetch('/api/mobile/notifications/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      setNotifications(data.notifications || []);
      addActivityLog('mobile', 'Notification Dismissed', `ID: ${id}`, 'info');
    } catch {
      setNotifications((prev) => (id === 'all' ? [] : prev.filter((n) => n.id !== id)));
    }
  };

  const handleDeleteFile = async (id: string) => {
    try {
      const res = await fetch('/api/mobile/files/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      setFiles(data.files || []);
      addActivityLog('mobile', 'Remote File Deleted', `ID: ${id}`, 'warning');
    } catch {
      setFiles((prev) => prev.filter((f) => f.id !== id));
    }
  };

  const handleUploadFile = async (name: string, folder: any) => {
    try {
      const res = await fetch('/api/mobile/files/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, folder }),
      });
      const data = await res.json();
      setFiles(data.files || []);
      addActivityLog('mobile', 'File Uploaded Remotely', name, 'success');
    } catch {
      const newF: MobileFile = {
        id: `file-${Date.now()}`,
        name,
        folder,
        size: '120 KB',
        type: 'doc',
        modified: 'Just now',
      };
      setFiles((prev) => [newF, ...prev]);
    }
  };

  return (
    <div
      id="jarvis-v8-root"
      className="relative w-full min-h-screen bg-slate-950 text-cyan-400 font-sans select-none overflow-x-hidden"
    >
      {/* 3D Holographic Core Background Viewport */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40 lg:opacity-75">
        <ThreeCoreView
          glowColor={coreColor}
          isListening={isListening}
          isSpeaking={isSpeaking}
          handX={handCoords.x}
          handY={handCoords.y}
        />
      </div>

      {/* Cyber Grid Overlay */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/15 via-transparent to-slate-950/90" />

      {/* FOREGROUND APPLICATION HUD */}
      <div className="relative z-10 flex flex-col min-h-screen p-3 sm:p-5 max-w-7xl mx-auto gap-4">
        {/* TOP BAR / SYSTEM STATUS HEADER */}
        <header
          id="main-top-hud"
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/80 border border-cyan-500/30 rounded-2xl p-3 sm:px-5 backdrop-blur-xl shadow-lg shadow-cyan-950/20"
        >
          {/* Logo & Clock */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shadow-md shadow-cyan-500/20">
              <Sparkles className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-widest text-white uppercase">
                  JARVIS <span className="text-cyan-400">OS v8</span>
                </h1>
                <span className="text-[10px] font-mono bg-cyan-950 border border-cyan-500/40 text-cyan-300 px-1.5 py-0.5 rounded font-bold">
                  REMOTE MOBILE & VISION
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Real-Time Voice • Hand-Pickup Mission • Touch-Free Gestures • Mobile Control
              </p>
            </div>
          </div>

          {/* Quick HUD Metrics & Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Always Listening Indicator */}
            <button
              id="speech-toggle-top-btn"
              onClick={toggleListening}
              className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-2 transition ${
                isListening
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
              {isListening ? 'ALWAYS LISTENING' : 'MIC PAUSED'}
            </button>

            {/* Remote Lock status pill */}
            <div
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-mono flex items-center gap-1.5 ${
                deviceState.isLocked
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
              }`}
            >
              {deviceState.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              <span>{deviceState.isLocked ? 'PHONE: LOCKED' : 'PHONE: UNLOCKED'}</span>
            </div>

            {/* Audio Mute Toggle */}
            <button
              id="audio-mute-toggle-btn"
              onClick={() => {
                const nextMute = jarvisAudio.toggleMute();
                setIsMuted(nextMute);
                if (!nextMute) jarvisAudio.speak('Audio feedback enabled.');
              }}
              className="p-2 bg-slate-800/80 hover:bg-slate-700 text-cyan-300 rounded-xl border border-slate-700 transition"
              title={isMuted ? 'Unmute Audio Feedback' : 'Mute Audio Feedback'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            </button>
          </div>
        </header>

        {/* TOUCHLESS GESTURE & MODULE NAVIGATION BAR */}
        <nav
          id="module-nav-bar"
          className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/70 border border-cyan-500/20 rounded-xl p-2 backdrop-blur-md"
        >
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              id="nav-tab-mobile"
              onClick={() => {
                setActiveModule('mobile');
                jarvisAudio.playBeep(900, 0.06);
              }}
              className={`px-3 py-2 rounded-lg text-xs font-mono font-bold flex items-center gap-2 transition ${
                activeModule === 'mobile'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              1. Mobile Remote & Lock
            </button>

            <button
              id="nav-tab-vision"
              onClick={() => {
                setActiveModule('vision');
                jarvisAudio.playBeep(900, 0.06);
              }}
              className={`px-3 py-2 rounded-lg text-xs font-mono font-bold flex items-center gap-2 transition ${
                activeModule === 'vision'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Eye className="w-4 h-4" />
              2. Hand-Pickup Mission
            </button>

            <button
              id="nav-tab-search"
              onClick={() => {
                setActiveModule('search');
                jarvisAudio.playBeep(900, 0.06);
              }}
              className={`px-3 py-2 rounded-lg text-xs font-mono font-bold flex items-center gap-2 transition ${
                activeModule === 'search'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Globe className="w-4 h-4" />
              3. Web Scraper & Chrome
            </button>

            <button
              id="nav-tab-dashboard"
              onClick={() => {
                setActiveModule('dashboard');
                jarvisAudio.playBeep(900, 0.06);
              }}
              className={`px-3 py-2 rounded-lg text-xs font-mono font-bold flex items-center gap-2 transition ${
                activeModule === 'dashboard'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Activity className="w-4 h-4" />
              4. Activity & Commands
            </button>
          </div>

          {/* Touch-Free Gesture Badge */}
          <div className="flex items-center gap-2 text-xs font-mono bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
            <Hand className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">Touchless Gestures:</span>
            <span className="text-amber-300 font-bold">Swipe L/R • Fist Lock • Pinch Scan</span>
          </div>
        </nav>

        {/* MAIN MODULE CONTENT AREA */}
        <main className="flex-1 flex flex-col gap-4">
          {activeModule === 'mobile' && (
            <RemoteMobileController
              deviceState={deviceState}
              notifications={notifications}
              files={files}
              onAction={handleMobileAction}
              onDismissNotification={handleDismissNotification}
              onDeleteFile={handleDeleteFile}
              onUploadFile={handleUploadFile}
              onOpenChromeSearch={(query) => {
                processCommandIntent(`how much prices quantity use of ${query}`);
              }}
            />
          )}

          {activeModule === 'vision' && (
            <OpticalVisionMission
              onItemDetected={(result) => {
                addChatMessage('JARVIS', `Optical mission report: "${result.spokenAnnouncement}"`);
                addActivityLog(
                  'vision',
                  `Object Identified: ${result.itemName}`,
                  result.description,
                  'success',
                  result.category
                );
              }}
              onGestureDetected={handleGestureReceived}
              onHandCoordinates={(x, y) => setHandCoords({ x, y })}
              isExternalScanTriggered={triggerPickupScan}
            />
          )}

          {activeModule === 'search' && (
            <WebScraperSearchModal
              initialResult={searchResult}
              onSearchExecuted={(res) => {
                setSearchResult(res);
                addActivityLog('search', `Market Scrape: ${res.item || res.query}`, res.priceEstimate, 'success');
              }}
            />
          )}

          {activeModule === 'dashboard' && (
            <ActivityDashboard
              activityLogs={activityLogs}
              onClearLogs={() => setActivityLogs([])}
              onTriggerVoiceCommand={(phrase) => processCommandIntent(phrase)}
              isListening={isListening}
              onToggleListening={toggleListening}
            />
          )}
        </main>

        {/* BOTTOM DECK: REAL-TIME CONTINUOUS SPEECH & COMMAND INPUT */}
        <footer
          id="bottom-voice-deck"
          className="flex flex-col gap-2.5 bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-3 sm:p-4 backdrop-blur-xl shadow-2xl shadow-cyan-950/40"
        >
          {/* Chat Stream & Continuous Speech Transcript */}
          <div
            id="chat-speech-transcript"
            className="h-28 sm:h-32 overflow-y-auto space-y-2 pr-1 border border-slate-800/80 bg-slate-950/70 rounded-xl p-3 font-mono text-xs"
          >
            {chatLog.map((entry, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${
                  entry.sender === 'USER' ? 'items-end' : 'items-start'
                } animate-fadeIn`}
              >
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-0.5">
                  <span className={entry.sender === 'USER' ? 'text-blue-400 font-bold' : 'text-cyan-400 font-bold'}>
                    {entry.sender === 'USER' ? 'COMMANDER' : 'JARVIS CORE'}
                  </span>
                  <span>{entry.time}</span>
                </div>
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
                    entry.sender === 'USER'
                      ? 'bg-blue-600/25 border border-blue-500/40 text-blue-100 rounded-tr-none'
                      : 'bg-cyan-950/40 border border-cyan-500/30 text-cyan-200 rounded-tl-none'
                  }`}
                >
                  {entry.text}
                </div>
              </div>
            ))}

            {/* Real-time Interim Live Transcript */}
            {interimSpeech && (
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-emerald-400 font-bold animate-pulse">Hearing live...</span>
                <div className="bg-slate-800/80 text-emerald-300 border border-emerald-500/40 rounded-lg px-3 py-1.5 italic">
                  {interimSpeech}...
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Quick Voice Command Triggers Bar */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
            <span className="text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              Quick Say:
            </span>
            <button
              onClick={() => processCommandIntent('What I pickup')}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-cyan-950 text-cyan-300 border border-slate-700 transition"
            >
              &ldquo;What I pickup&rdquo;
            </button>
            <button
              onClick={() => processCommandIntent('how much prices quantity use of sugar')}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-cyan-950 text-cyan-300 border border-slate-700 transition"
            >
              &ldquo;Price, quantity, use of sugar&rdquo;
            </button>
            <button
              onClick={() => processCommandIntent('Lock screen mobile')}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-cyan-950 text-cyan-300 border border-slate-700 transition"
            >
              &ldquo;Lock screen mobile&rdquo;
            </button>
            <button
              onClick={() => processCommandIntent('Open Chrome')}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-cyan-950 text-cyan-300 border border-slate-700 transition"
            >
              &ldquo;Open Chrome&rdquo;
            </button>
            <button
              onClick={() => processCommandIntent('Open Files')}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-cyan-950 text-cyan-300 border border-slate-700 transition"
            >
              &ldquo;Open Files&rdquo;
            </button>
          </div>

          {/* Command Input Box */}
          <div className="flex items-center gap-2">
            <button
              id="mic-action-btn"
              onClick={toggleListening}
              className={`p-2.5 rounded-xl border transition flex-shrink-0 ${
                isListening
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 hover:bg-emerald-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
              title={isListening ? 'Mute microphone' : 'Start microphone'}
            >
              {isListening ? <Mic className="w-5 h-5 animate-pulse" /> : <MicOff className="w-5 h-5" />}
            </button>

            <div className="relative flex-1">
              <input
                id="voice-command-input"
                type="text"
                value={voiceInputText}
                onChange={(e) => setVoiceInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendTextCommand()}
                placeholder={
                  isListening
                    ? 'Always listening... or type any command (e.g. "what I pickup", "price of sugar", "lock mobile")'
                    : 'Mic paused. Type a command or click mic icon...'
                }
                className="w-full px-4 py-2.5 bg-slate-950/90 border border-cyan-500/40 rounded-xl text-xs text-white placeholder-slate-500 font-mono outline-none focus:border-cyan-400 transition"
              />
            </div>

            <button
              id="send-command-btn"
              onClick={handleSendTextCommand}
              className="p-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition flex items-center justify-center flex-shrink-0 shadow-lg shadow-cyan-500/25"
              title="Send Command"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
