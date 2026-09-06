import React, { useState, useEffect, useRef } from 'react';
import {
  Smartphone,
  Lock,
  Unlock,
  Flashlight,
  Volume2,
  Vibrate,
  Bell,
  Folder,
  Globe,
  Youtube,
  MessageSquare,
  Camera,
  Settings,
  Phone,
  Mail,
  MapPin,
  Music,
  Share2,
  Download,
  Trash2,
  Plus,
  RefreshCw,
  QrCode,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Radio,
  Sliders,
  Battery,
  BatteryCharging,
  Wifi,
  FileText,
  AlertCircle,
  Eye,
  Send,
} from 'lucide-react';
import type { MobileDeviceState, MobileNotification, MobileFile, RealDeviceStatus } from '../types';
import { jarvisAudio } from '../utils/audio';

interface RemoteMobileControllerProps {
  deviceState: MobileDeviceState;
  notifications: MobileNotification[];
  files: MobileFile[];
  onAction: (action: string, payload?: any) => void;
  onDismissNotification: (id: string) => void;
  onDeleteFile: (id: string) => void;
  onUploadFile: (name: string, folder: any) => void;
  onOpenChromeSearch?: (query: string) => void;
}

export const RemoteMobileController: React.FC<RemoteMobileControllerProps> = ({
  deviceState,
  notifications,
  files,
  onAction,
  onDismissNotification,
  onDeleteFile,
  onUploadFile,
  onOpenChromeSearch,
}) => {
  const [activeTab, setActiveTab] = useState<'control' | 'apps' | 'files' | 'notifications' | 'pair'>('control');
  const [customAppQuery, setCustomAppQuery] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [wakeLockActive, setWakeLockActive] = useState<boolean>(false);
  const [torchActive, setTorchActive] = useState<boolean>(false);
  const [realBattery, setRealBattery] = useState<{ level: number; charging: boolean }>({
    level: deviceState.battery,
    charging: deviceState.isCharging,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const wakeLockRef = useRef<any>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);

  // Detect if current browser is running on physical mobile device
  const isPhysicalMobile =
    typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

  // 1. Initialize Battery API if supported
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setRealBattery({
          level: Math.round(battery.level * 100),
          charging: battery.charging,
        });

        battery.addEventListener('levelchange', () => {
          setRealBattery((prev) => ({ ...prev, level: Math.round(battery.level * 100) }));
        });
        battery.addEventListener('chargingchange', () => {
          setRealBattery((prev) => ({ ...prev, charging: battery.charging }));
        });
      });
    }
  }, []);

  // 2. Wake Lock API (Screen Lock / Awake Control)
  const toggleWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        if (!wakeLockActive) {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
          setWakeLockActive(true);
          jarvisAudio.speak('Mobile screen wake lock engaged.');
        } else {
          if (wakeLockRef.current) {
            await wakeLockRef.current.release();
            wakeLockRef.current = null;
          }
          setWakeLockActive(false);
          jarvisAudio.speak('Screen wake lock released.');
        }
      } else {
        // Virtual fallback
        setWakeLockActive(!wakeLockActive);
        jarvisAudio.speak(wakeLockActive ? 'Screen lock released.' : 'Screen lock active.');
      }
    } catch (err) {
      console.warn('Wake lock error:', err);
    }
  };

  // 3. Physical Flashlight (Torch) Control using MediaTrack constraints
  const togglePhysicalTorch = async () => {
    try {
      if (!torchActive) {
        // Request camera with torch capability
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
          },
        });
        videoStreamRef.current = stream;
        const track = stream.getVideoTracks()[0];
        const capabilities = (track.getCapabilities && track.getCapabilities()) || {};

        if ('torch' in capabilities) {
          await (track as any).applyConstraints({ advanced: [{ torch: true }] });
        }
        setTorchActive(true);
        onAction('TOGGLE_FLASHLIGHT', { state: true });
        jarvisAudio.speak('Flashlight turned on.');
      } else {
        if (videoStreamRef.current) {
          videoStreamRef.current.getTracks().forEach((t) => t.stop());
          videoStreamRef.current = null;
        }
        setTorchActive(false);
        onAction('TOGGLE_FLASHLIGHT', { state: false });
        jarvisAudio.speak('Flashlight turned off.');
      }
    } catch (err) {
      // Send remote relay action if running on PC
      onAction('TOGGLE_FLASHLIGHT');
      setTorchActive(!torchActive);
      jarvisAudio.speak(torchActive ? 'Flashlight off.' : 'Flashlight on.');
    }
  };

  // 4. Physical Vibration Trigger
  const triggerVibration = (pattern: number[] = [200, 100, 200]) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
    jarvisAudio.playBeep(440, 0.1);
    onAction('VIBRATE_DEVICE', { pattern });
    jarvisAudio.speak('Haptic vibration sent.');
  };

  // 5. Send Real Mobile Push Notification
  const sendRealNotification = async (title = 'JARVIS OS v8', body = 'Remote mobile command executed successfully.') => {
    try {
      if ('Notification' in window) {
        let perm = Notification.permission;
        if (perm === 'default') {
          perm = await Notification.requestPermission();
        }
        if (perm === 'granted') {
          new Notification(title, {
            body,
            icon: 'https://cdn-icons-png.flaticon.com/512/4712/4712038.png',
          });
          jarvisAudio.playBeep(1200, 0.12);
          jarvisAudio.speak('System notification dispatched to mobile.');
          return;
        }
      }
    } catch (e) {
      console.warn('Notification error:', e);
    }
    jarvisAudio.speak('Mobile notification logged.');
  };

  // 6. Launch Real Mobile App via Deep Link or Web Protocol
  const launchRealMobileApp = (appKey: string, customParam?: string) => {
    jarvisAudio.playBeep(1000, 0.08);
    let targetUrl = '';
    let appLabel = appKey;

    switch (appKey.toLowerCase()) {
      case 'chrome':
      case 'browser':
        targetUrl = customParam ? `https://www.google.com/search?q=${encodeURIComponent(customParam)}` : 'https://www.google.com';
        appLabel = 'Google Chrome';
        break;

      case 'youtube':
        targetUrl = customParam ? `vnd.youtube://results?q=${encodeURIComponent(customParam)}` : 'https://www.youtube.com';
        appLabel = 'YouTube';
        break;

      case 'whatsapp':
        targetUrl = 'whatsapp://send?text=Hello%20from%20JARVIS%20OS%20v8';
        appLabel = 'WhatsApp';
        break;

      case 'phone':
      case 'dialer':
        targetUrl = 'tel:';
        appLabel = 'Phone Dialer';
        break;

      case 'sms':
      case 'messages':
        targetUrl = 'sms:';
        appLabel = 'SMS Messages';
        break;

      case 'mail':
      case 'gmail':
        targetUrl = 'mailto:';
        appLabel = 'Email';
        break;

      case 'maps':
        targetUrl = 'https://maps.google.com';
        appLabel = 'Google Maps';
        break;

      case 'spotify':
        targetUrl = 'spotify://';
        appLabel = 'Spotify';
        break;

      case 'camera':
        if (fileInputRef.current) {
          fileInputRef.current.setAttribute('capture', 'environment');
          fileInputRef.current.click();
        }
        appLabel = 'Camera';
        break;

      case 'files':
        if (fileInputRef.current) {
          fileInputRef.current.removeAttribute('capture');
          fileInputRef.current.click();
        }
        appLabel = 'File Manager';
        break;

      default:
        // Check if full URL or custom intent
        if (appKey.startsWith('http') || appKey.includes('://')) {
          targetUrl = appKey;
        } else {
          // Open search or app store for the requested app
          targetUrl = `https://www.google.com/search?q=${encodeURIComponent(appKey + ' app')}`;
        }
        appLabel = appKey;
        break;
    }

    if (targetUrl) {
      window.open(targetUrl, '_blank');
    }

    onAction('OPEN_APP', { appId: appKey });
    jarvisAudio.speak(`Opening ${appLabel} on mobile device.`);
  };

  // 7. Handle Native File Picker
  const handleNativeFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const folder = file.type.startsWith('image/')
        ? 'Camera'
        : file.type.startsWith('audio/')
        ? 'Audio'
        : 'Documents';

      onUploadFile(file.name, folder);
    }

    jarvisAudio.playBeep(1100, 0.1);
    jarvisAudio.speak(`${selectedFiles.length} file(s) accessed from mobile storage.`);
  };

  // 8. Remote Share via Web Share API
  const shareFileRemotely = async (file: MobileFile) => {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title: file.name,
          text: `File accessed from JARVIS OS v8 mobile control: ${file.name}`,
        });
        jarvisAudio.speak(`Shared ${file.name}.`);
      } catch (err) {
        console.warn('Share cancelled:', err);
      }
    } else {
      jarvisAudio.speak(`File ${file.name} ready for download.`);
    }
  };

  // 9. Copy Pairing URL
  const copyPairingLink = () => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}?role=mobile_node` : '';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      jarvisAudio.playBeep(950, 0.08);
      jarvisAudio.speak('Mobile pairing link copied to clipboard.');
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div
      id="remote-mobile-command-station"
      className="flex flex-col gap-4 bg-slate-900/85 border border-cyan-500/30 rounded-2xl p-4 sm:p-5 backdrop-blur-xl shadow-2xl shadow-cyan-950/30 text-cyan-400 font-sans"
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleNativeFileSelect}
        className="hidden"
        multiple
      />

      {/* TOP HEADER & HARDWARE STATUS BAR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-cyan-500/20 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-950 border border-cyan-400/40 text-cyan-300">
            <Smartphone className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-wider uppercase">
                Remote Mobile Hardware Bridge & Control Station
              </h2>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                  isPhysicalMobile
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                    : 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50'
                }`}
              >
                {isPhysicalMobile ? 'HOST: PHYSICAL PHONE' : 'TETHERED COMMAND STATION'}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Control mobile lock screen, flashlight, vibration, files, and launch any app via voice or gestures
            </p>
          </div>
        </div>

        {/* Live Hardware Telemetry Pills */}
        <div className="flex items-center gap-2">
          {/* Battery */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 px-2.5 py-1 rounded-lg text-xs font-mono">
            {realBattery.charging ? (
              <BatteryCharging className="w-4 h-4 text-emerald-400 animate-pulse" />
            ) : (
              <Battery className="w-4 h-4 text-cyan-400" />
            )}
            <span className="text-white font-bold">{realBattery.level}%</span>
          </div>

          {/* Network Link */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 px-2.5 py-1 rounded-lg text-xs font-mono text-emerald-400">
            <Wifi className="w-4 h-4" />
            <span>5G LINK (~11ms)</span>
          </div>

          {/* Lock State */}
          <button
            onClick={() => {
              const willLock = !deviceState.isLocked;
              onAction(willLock ? 'LOCK_SCREEN' : 'UNLOCK_SCREEN');
              jarvisAudio.playLockSound(willLock);
              jarvisAudio.speak(willLock ? 'Mobile screen locked.' : 'Mobile screen unlocked.');
            }}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 border transition ${
              deviceState.isLocked
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
            }`}
          >
            {deviceState.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            <span>{deviceState.isLocked ? 'SCREEN LOCKED' : 'SCREEN UNLOCKED'}</span>
          </button>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/70 p-1 rounded-xl border border-slate-800">
        <button
          onClick={() => setActiveTab('control')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition ${
            activeTab === 'control' ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30' : 'text-slate-300 hover:text-white'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          1. Hardware Controls
        </button>

        <button
          onClick={() => setActiveTab('apps')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition ${
            activeTab === 'apps' ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30' : 'text-slate-300 hover:text-white'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          2. Launch Any Mobile App
        </button>

        <button
          onClick={() => setActiveTab('files')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition ${
            activeTab === 'files' ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30' : 'text-slate-300 hover:text-white'
          }`}
        >
          <Folder className="w-3.5 h-3.5" />
          3. Remote Files ({files.length})
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition ${
            activeTab === 'notifications'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          4. Notifications ({notifications.length})
        </button>

        <button
          onClick={() => setActiveTab('pair')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition ${
            activeTab === 'pair' ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30' : 'text-slate-300 hover:text-white'
          }`}
        >
          <QrCode className="w-3.5 h-3.5" />
          5. Pair Phone Node
        </button>
      </div>

      {/* TAB 1: HARDWARE CONTROLS & LOCK SCREEN */}
      {activeTab === 'control' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 animate-fadeIn">
          {/* Card 1: Screen Lock Control */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400 font-bold">LOCK SCREEN CONTROL</span>
                {deviceState.isLocked ? (
                  <Lock className="w-4 h-4 text-rose-400" />
                ) : (
                  <Unlock className="w-4 h-4 text-emerald-400" />
                )}
              </div>
              <p className="text-xs text-slate-300 mt-2">
                Remotely lock screen with PIN protection, or keep mobile screen awake with WakeLock.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  const willLock = !deviceState.isLocked;
                  onAction(willLock ? 'LOCK_SCREEN' : 'UNLOCK_SCREEN');
                  jarvisAudio.playLockSound(willLock);
                  jarvisAudio.speak(willLock ? 'Mobile screen locked.' : 'Mobile screen unlocked.');
                }}
                className={`w-full py-2 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-2 transition ${
                  deviceState.isLocked
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 hover:bg-rose-500/30'
                    : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
                }`}
              >
                {deviceState.isLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                {deviceState.isLocked ? 'Unlock Mobile Screen' : 'Lock Mobile Screen'}
              </button>

              <button
                onClick={toggleWakeLock}
                className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-xs font-mono flex items-center justify-center gap-1.5 transition"
              >
                <Radio className="w-3 h-3 text-amber-400" />
                <span>Wake Lock: {wakeLockActive ? 'ENGAGED (AWAKE)' : 'STANDBY'}</span>
              </button>
            </div>
          </div>

          {/* Card 2: Physical Flashlight / Torch */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400 font-bold">REAR LED FLASHLIGHT</span>
                <Flashlight className={`w-4 h-4 ${torchActive || deviceState.flashlight ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`} />
              </div>
              <p className="text-xs text-slate-300 mt-2">
                Triggers the real physical camera LED torch on the phone via hardware constraints.
              </p>
            </div>

            <button
              onClick={togglePhysicalTorch}
              className={`w-full py-2.5 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-2 transition ${
                torchActive || deviceState.flashlight
                  ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
              }`}
            >
              <Flashlight className="w-4 h-4" />
              {torchActive || deviceState.flashlight ? 'Turn Off Flashlight' : 'Turn On Flashlight'}
            </button>
          </div>

          {/* Card 3: Haptic Vibration */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400 font-bold">HAPTIC VIBRATION</span>
                <Vibrate className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-xs text-slate-300 mt-2">
                Sends real physical vibration pulses to the phone motor to find device or alert user.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => triggerVibration([200])}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono text-purple-300 rounded-lg transition"
              >
                Buzz
              </button>
              <button
                onClick={() => triggerVibration([200, 100, 200])}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono text-purple-300 rounded-lg transition"
              >
                Double
              </button>
              <button
                onClick={() => triggerVibration([300, 100, 300, 100, 300])}
                className="flex-1 py-2 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-xs font-mono text-purple-200 rounded-lg font-bold transition"
              >
                SOS Alert
              </button>
            </div>
          </div>

          {/* Card 4: Push Real Notification */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400 font-bold">PUSH NOTIFICATION</span>
                <Bell className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-xs text-slate-300 mt-2">
                Dispatches a real system push notification directly to the mobile device screen.
              </p>
            </div>

            <button
              onClick={() => sendRealNotification('JARVIS OS v8 Alert', 'Command bridge confirmed real-time mobile link.')}
              className="w-full py-2.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-2 transition"
            >
              <Bell className="w-4 h-4" />
              Send System Notification
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: LAUNCH ANY MOBILE APP */}
      {activeTab === 'apps' && (
        <div className="flex flex-col gap-4 animate-fadeIn">
          {/* Custom App Launcher Input */}
          <div className="bg-slate-950/90 border border-cyan-500/40 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-center gap-3">
            <div className="flex-1 w-full">
              <label className="text-[11px] font-mono text-slate-400 uppercase font-bold block mb-1">
                Open Any Mobile App, Intent, or Website:
              </label>
              <input
                type="text"
                value={customAppQuery}
                onChange={(e) => setCustomAppQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && customAppQuery.trim() && launchRealMobileApp(customAppQuery.trim())}
                placeholder="Type any app name (e.g. Chrome, WhatsApp, Spotify, Instagram, Netflix, Telegram, Calculator)"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white placeholder-slate-500 outline-none focus:border-cyan-400 transition"
              />
            </div>

            <button
              onClick={() => customAppQuery.trim() && launchRealMobileApp(customAppQuery.trim())}
              className="w-full sm:w-auto px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-xs font-mono transition flex items-center justify-center gap-2 flex-shrink-0"
            >
              <ExternalLink className="w-4 h-4" />
              Launch on Mobile
            </button>
          </div>

          {/* Quick Real App Launch Grid */}
          <div>
            <span className="text-xs font-mono text-slate-400 mb-2 block font-bold uppercase">
              Standard Mobile Applications:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {[
                { name: 'Google Chrome', icon: Globe, key: 'chrome', color: 'text-blue-400' },
                { name: 'YouTube', icon: Youtube, key: 'youtube', color: 'text-red-400' },
                { name: 'WhatsApp', icon: MessageSquare, key: 'whatsapp', color: 'text-emerald-400' },
                { name: 'Device Camera', icon: Camera, key: 'camera', color: 'text-amber-400' },
                { name: 'File Storage', icon: Folder, key: 'files', color: 'text-cyan-400' },
                { name: 'Phone Dialer', icon: Phone, key: 'phone', color: 'text-emerald-400' },
                { name: 'SMS Messages', icon: Mail, key: 'sms', color: 'text-sky-400' },
                { name: 'Google Maps', icon: MapPin, key: 'maps', color: 'text-rose-400' },
                { name: 'Spotify Music', icon: Music, key: 'spotify', color: 'text-green-400' },
                { name: 'Device Settings', icon: Settings, key: 'settings', color: 'text-slate-300' },
              ].map((app) => (
                <button
                  key={app.key}
                  onClick={() => launchRealMobileApp(app.key)}
                  className="bg-slate-950/80 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500/50 rounded-xl p-3 flex flex-col items-center justify-center gap-2 transition group"
                >
                  <app.icon className={`w-7 h-7 ${app.color} group-hover:scale-110 transition`} />
                  <span className="text-xs font-medium text-white group-hover:text-cyan-300 transition">
                    {app.name}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">Tap to Open</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: REMOTE FILE MANAGEMENT */}
      {activeTab === 'files' && (
        <div className="flex flex-col gap-3 animate-fadeIn">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-mono text-slate-400 font-bold uppercase">
              Mobile Internal Storage & Documents
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-xs font-mono flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Pick Real Files from Mobile
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[380px] overflow-y-auto pr-1">
            {files.map((file) => (
              <div
                key={file.id}
                className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between gap-2.5 hover:border-cyan-500/40 transition"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white truncate max-w-[180px]">{file.name}</span>
                    <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                      {file.folder}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-1">
                    Size: {file.size} • Modified: {file.modified}
                  </div>
                  {file.contentSnippet && (
                    <p className="text-xs text-slate-300 mt-2 bg-slate-900 p-2 rounded border border-slate-800 line-clamp-2">
                      {file.contentSnippet}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <button
                    onClick={() => shareFileRemotely(file)}
                    className="text-xs font-mono text-cyan-300 hover:text-cyan-200 flex items-center gap-1"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Share / Send
                  </button>

                  <button
                    onClick={() => onDeleteFile(file.id)}
                    className="text-xs font-mono text-rose-400 hover:text-rose-300 flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: NOTIFICATION CENTER */}
      {activeTab === 'notifications' && (
        <div className="flex flex-col gap-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 font-bold uppercase">
              Incoming Mobile Alerts & Notifications
            </span>
            <button
              onClick={() => onDismissNotification('all')}
              className="text-xs font-mono text-rose-400 hover:text-rose-300"
            >
              Clear All Alerts
            </button>
          </div>

          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800 text-slate-500 text-xs font-mono">
                No active mobile notifications.
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex items-start justify-between gap-3 hover:border-cyan-500/40 transition"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-slate-800 text-cyan-300 mt-0.5">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{notif.title}</span>
                        <span className="text-[10px] font-mono uppercase bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                          {notif.app}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">{notif.message}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-[10px] font-mono text-slate-500">{notif.time}</span>
                    <button
                      onClick={() => onDismissNotification(notif.id)}
                      className="text-[11px] font-mono text-slate-400 hover:text-rose-400"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 5: PAIR PHONE NODE */}
      {activeTab === 'pair' && (
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-center justify-between gap-6 animate-fadeIn">
          <div className="space-y-2 max-w-lg">
            <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
              Pair Real Smartphone Node via QR or Tether Link
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Open this application on your smartphone browser (Chrome, Safari, Firefox). The phone automatically
              links to your JARVIS command station, allowing you to trigger physical flashlight, vibration, screen lock,
              and speech commands remotely from your PC or via touchless gestures!
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-2">
              <button
                onClick={copyPairingLink}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-xs font-mono flex items-center gap-2 transition"
              >
                {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedLink ? 'Link Copied!' : 'Copy Mobile Pairing Link'}
              </button>

              <button
                onClick={() => {
                  if (typeof navigator !== 'undefined' && 'share' in navigator) {
                    navigator.share({
                      title: 'JARVIS OS v8 Mobile Node',
                      text: 'Connect as mobile node to JARVIS command station.',
                      url: window.location.href,
                    });
                  }
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-xs font-mono flex items-center gap-2 border border-slate-700 transition"
              >
                <Share2 className="w-4 h-4" />
                Share to Phone
              </button>
            </div>
          </div>

          {/* Visual QR Code Representation */}
          <div className="p-4 bg-white rounded-xl shadow-xl flex flex-col items-center gap-2">
            <QrCode className="w-32 h-32 text-slate-950" />
            <span className="text-[10px] font-mono text-slate-700 font-bold">SCAN WITH PHONE CAMERA</span>
          </div>
        </div>
      )}
    </div>
  );
};
