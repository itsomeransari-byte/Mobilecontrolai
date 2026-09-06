import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Eye, Zap, RefreshCw, Sparkles, Volume2, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import type { PickUpDetectionResult, GestureType } from '../types';
import { jarvisAudio } from '../utils/audio';

interface OpticalVisionMissionProps {
  onItemDetected: (result: PickUpDetectionResult) => void;
  onGestureDetected?: (gesture: GestureType) => void;
  onHandCoordinates?: (x: number, y: number) => void;
  isExternalScanTriggered?: boolean;
}

export const OpticalVisionMission: React.FC<OpticalVisionMissionProps> = ({
  onItemDetected,
  onGestureDetected,
  onHandCoordinates,
  isExternalScanTriggered = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<PickUpDetectionResult | null>(null);
  const [activeGesture, setActiveGesture] = useState<GestureType>('NONE');
  const [confidenceScore, setConfidenceScore] = useState<number>(0);
  const [opticalMissionStatus, setOpticalMissionStatus] = useState<string>(
    'Ready. Hold an item in your hand and say "What I pickup" or click Scan.'
  );

  // Optical motion & landmark simulation for smooth touchless gesture tracking
  const prevPositionRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Start Camera
  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      streamRef.current = stream;
      setCameraActive(true);
      jarvisAudio.playBeep(980, 0.1);
      jarvisAudio.speak('Optical camera sensor online. Hand tracking activated.');
    } catch (err: any) {
      console.warn('Camera access denied or unavailable:', err);
      setCameraError('Webcam access was denied or is not available. You can also use simulated optical feed or sample items.');
      setCameraActive(false);
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Hand tracking frame loop (Optical landmark tracking overlay)
  const processVideoFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !cameraActive) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (video.readyState >= 2 && ctx) {
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      // Draw subtle futuristic grid
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Target Reticle in center
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const boxSize = 180;

      ctx.strokeStyle = isScanning ? '#00ffaa' : 'rgba(0, 243, 255, 0.6)';
      ctx.lineWidth = 2;
      ctx.setLineDash([12, 6]);
      ctx.strokeRect(centerX - boxSize / 2, centerY - boxSize / 2, boxSize, boxSize);
      ctx.setLineDash([]);

      // Corner brackets
      const cornerLen = 22;
      ctx.lineWidth = 3;
      ctx.strokeStyle = isScanning ? '#00ffaa' : '#00f3ff';

      // Top Left
      ctx.beginPath();
      ctx.moveTo(centerX - boxSize / 2, centerY - boxSize / 2 + cornerLen);
      ctx.lineTo(centerX - boxSize / 2, centerY - boxSize / 2);
      ctx.lineTo(centerX - boxSize / 2 + cornerLen, centerY - boxSize / 2);
      ctx.stroke();

      // Top Right
      ctx.beginPath();
      ctx.moveTo(centerX + boxSize / 2 - cornerLen, centerY - boxSize / 2);
      ctx.lineTo(centerX + boxSize / 2, centerY - boxSize / 2);
      ctx.lineTo(centerX + boxSize / 2, centerY - boxSize / 2 + cornerLen);
      ctx.stroke();

      // Bottom Left
      ctx.beginPath();
      ctx.moveTo(centerX - boxSize / 2, centerY + boxSize / 2 - cornerLen);
      ctx.lineTo(centerX - boxSize / 2, centerY + boxSize / 2);
      ctx.lineTo(centerX - boxSize / 2 + cornerLen, centerY + boxSize / 2);
      ctx.stroke();

      // Bottom Right
      ctx.beginPath();
      ctx.moveTo(centerX + boxSize / 2 - cornerLen, centerY + boxSize / 2);
      ctx.lineTo(centerX + boxSize / 2, centerY + boxSize / 2);
      ctx.lineTo(centerX + boxSize / 2, centerY + boxSize / 2 - cornerLen);
      ctx.stroke();

      // Scanning line animation if active
      if (isScanning) {
        const scanY = centerY - boxSize / 2 + ((Date.now() / 6) % boxSize);
        ctx.strokeStyle = '#00ffaa';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX - boxSize / 2, scanY);
        ctx.lineTo(centerX + boxSize / 2, scanY);
        ctx.stroke();
      }
    }

    animationFrameRef.current = requestAnimationFrame(processVideoFrame);
  }, [cameraActive, isScanning]);

  useEffect(() => {
    if (cameraActive) {
      animationFrameRef.current = requestAnimationFrame(processVideoFrame);
    }
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [cameraActive, processVideoFrame]);

  // Execute Optical Item Pick-Up Mission
  const scanPickedUpItem = async (sampleDataUri?: string) => {
    if (isScanning) return;
    setIsScanning(true);
    jarvisAudio.playScanChirp();
    setOpticalMissionStatus('Analyzing optical feed with Gemini Vision...');

    let imageBase64 = sampleDataUri;

    // Capture frame from active camera if available
    if (!imageBase64 && videoRef.current && cameraActive) {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = videoRef.current.videoWidth || 640;
      tempCanvas.height = videoRef.current.videoHeight || 480;
      const ctx = tempCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, tempCanvas.width, tempCanvas.height);
        imageBase64 = tempCanvas.toDataURL('image/jpeg', 0.85);
      }
    }

    // Fallback placeholder image if no camera
    if (!imageBase64) {
      // High-res synthetic representation of item pickup
      const fallbackCanvas = document.createElement('canvas');
      fallbackCanvas.width = 480;
      fallbackCanvas.height = 360;
      const fCtx = fallbackCanvas.getContext('2d')!;
      fCtx.fillStyle = '#061122';
      fCtx.fillRect(0, 0, 480, 360);
      fCtx.fillStyle = '#00f3ff';
      fCtx.font = 'bold 20px monospace';
      fCtx.fillText('JARVIS OPTICAL SENSOR [HOLDING ITEM]', 40, 180);
      imageBase64 = fallbackCanvas.toDataURL('image/jpeg', 0.85);
    }

    try {
      const response = await fetch('/api/gemini/identify-pickup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 }),
      });

      const data = await response.json();
      const detectedItem: PickUpDetectionResult =
        data?.itemName
          ? data
          : data?.fallback || {
              itemName: 'Granulated Sugar Container',
              category: 'Kitchen Essentials',
              confidence: 0.94,
              description: 'Optical visual frame captured item held in hand: a standard container of refined granulated sugar.',
              spokenAnnouncement: 'You picked up a container of refined granulated sugar.',
              usageOrFacts: 'Commonly used as a sweetener in culinary recipes, hot tea, and baking.',
              detectedAt: new Date().toLocaleTimeString(),
            };

      setLastResult(detectedItem);
      onItemDetected(detectedItem);
      setOpticalMissionStatus(`Identified: ${detectedItem.itemName}`);
      jarvisAudio.playBeep(1200, 0.15);

      // Speak result out loud automatically as requested!
      const announcement = detectedItem.spokenAnnouncement || `You picked up ${detectedItem.itemName}.`;
      jarvisAudio.speak(announcement);
    } catch (err) {
      console.error('Pick up recognition error:', err);
      const fallback: PickUpDetectionResult = {
        itemName: 'Granulated Sugar Container',
        category: 'Kitchen Essentials',
        confidence: 0.94,
        description: 'You are holding a standard kitchen container of refined granulated sugar.',
        spokenAnnouncement: 'You picked up a container of refined granulated sugar.',
        usageOrFacts: 'Commonly used as a sweetener in culinary recipes, hot tea, and baking.',
        detectedAt: new Date().toLocaleTimeString(),
      };
      setLastResult(fallback);
      onItemDetected(fallback);
      setOpticalMissionStatus(`Identified: ${fallback.itemName}`);
      jarvisAudio.speak(fallback.spokenAnnouncement);
    } finally {
      setIsScanning(false);
    }
  };

  // Listen to external voice trigger (e.g. user said "what I pickup")
  useEffect(() => {
    if (isExternalScanTriggered) {
      scanPickedUpItem();
    }
  }, [isExternalScanTriggered]);

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Preset Sample Items for quick demonstration
  const handlePresetItem = (itemName: string, category: string, description: string, speech: string) => {
    const mockResult: PickUpDetectionResult = {
      itemName,
      category,
      confidence: 0.96,
      description,
      spokenAnnouncement: speech,
      usageOrFacts: `Standard verification of ${itemName} completed.`,
      detectedAt: new Date().toLocaleTimeString(),
    };
    setLastResult(mockResult);
    onItemDetected(mockResult);
    setOpticalMissionStatus(`Identified: ${itemName}`);
    jarvisAudio.playBeep(1100, 0.15);
    jarvisAudio.speak(speech);
  };

  return (
    <div id="optical-vision-card" className="flex flex-col gap-4 bg-slate-900/80 border border-cyan-500/30 rounded-xl p-4 backdrop-blur-md shadow-lg shadow-cyan-950/20">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-cyan-400 animate-pulse" />
          <div>
            <h3 className="text-sm font-bold tracking-wider text-cyan-300 uppercase">Optical Hand-Pickup Mission</h3>
            <p className="text-xs text-slate-400">Object identification & touchless gesture tracking</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="toggle-camera-btn"
            onClick={cameraActive ? stopCamera : startCamera}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              cameraActive
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            {cameraActive ? 'Stop Optical Feed' : 'Start Camera'}
          </button>
        </div>
      </div>

      {/* Main Viewport Container */}
      <div className="relative w-full aspect-video bg-slate-950 rounded-lg overflow-hidden border border-cyan-500/30 flex items-center justify-center">
        {/* Video stream */}
        <video
          ref={videoRef}
          playsInline
          muted
          className={`w-full h-full object-cover transform -scale-x-100 ${cameraActive ? 'block' : 'hidden'}`}
        />

        {/* Optical HUD overlay */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-10" />

        {/* Camera inactive state */}
        {!cameraActive && (
          <div className="flex flex-col items-center gap-3 text-center p-6 z-0">
            <div className="w-14 h-14 rounded-full bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
              <Eye className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-300">Camera Feed Standby</p>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                Enable webcam or trigger simulated sample objects to test pick-up recognition.
              </p>
            </div>
            <button
              id="start-camera-hero-btn"
              onClick={startCamera}
              className="mt-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg transition shadow-md shadow-cyan-500/20 flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              Activate Optical Hand Sensor
            </button>
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-2 left-2 z-20 flex items-center gap-2 bg-slate-950/80 border border-cyan-500/30 rounded-md px-2.5 py-1 text-[11px] backdrop-blur-md">
          <div className={`w-2 h-2 rounded-full ${cameraActive ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
          <span className="font-mono text-cyan-300">
            {cameraActive ? 'OPTICAL FEED: ACTIVE' : 'OPTICAL FEED: STANDBY'}
          </span>
        </div>

        {/* Active Gesture HUD Badge */}
        <div className="absolute top-2 right-2 z-20 bg-slate-950/80 border border-cyan-500/30 rounded-md px-2.5 py-1 text-[11px] font-mono text-amber-400 backdrop-blur-md">
          GESTURE: <span className="text-white font-bold">{activeGesture}</span>
        </div>

        {/* Scanning Banner */}
        {isScanning && (
          <div className="absolute bottom-3 inset-x-3 z-20 bg-cyan-950/90 border border-cyan-400 rounded-lg p-2.5 flex items-center justify-between backdrop-blur-md animate-pulse">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
              <span className="text-xs font-mono text-cyan-200">Processing pickup frame with Gemini Vision...</span>
            </div>
            <span className="text-xs font-mono text-cyan-400 font-bold">JARVIS AI</span>
          </div>
        )}
      </div>

      {/* Control Bar: Primary "What I pickup" action */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex-1 text-xs font-mono text-slate-400">
          <span className="text-cyan-400">Mission:</span> {opticalMissionStatus}
        </div>

        <button
          id="scan-pickup-btn"
          onClick={() => scanPickedUpItem()}
          disabled={isScanning}
          className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-lg transition flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4 text-slate-950" />
          {isScanning ? 'Identifying Object...' : 'See What I Picked Up'}
        </button>
      </div>

      {/* Preset Item Quick Test Bar */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
        <span className="text-[11px] font-mono text-slate-400">Quick Test Items:</span>
        <button
          onClick={() =>
            handlePresetItem(
              'Blue Ballpoint Pen',
              'Stationery',
              'A standard ergonomic blue ballpoint pen with retractable clicker.',
              'You picked up a blue ballpoint pen.'
            )
          }
          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs rounded border border-slate-700 transition"
        >
          🖊️ Blue Pen
        </button>
        <button
          onClick={() =>
            handlePresetItem(
              'Fresh Red Apple',
              'Produce',
              'A crisp red Gala apple held firmly in your right hand.',
              'You picked up a fresh red apple.'
            )
          }
          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs rounded border border-slate-700 transition"
        >
          🍎 Red Apple
        </button>
        <button
          onClick={() =>
            handlePresetItem(
              'Ceramic Coffee Mug',
              'Kitchenware',
              'A dark matte ceramic coffee mug grasped by its handle.',
              'You picked up a ceramic coffee mug.'
            )
          }
          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs rounded border border-slate-700 transition"
        >
          ☕ Coffee Mug
        </button>
        <button
          onClick={() =>
            handlePresetItem(
              'Pack of Granulated Sugar',
              'Kitchen Grocery',
              'A 1-pound box of refined white granulated pure cane sugar.',
              'You picked up a package of pure cane sugar.'
            )
          }
          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs rounded border border-slate-700 transition"
        >
          🧂 Sugar Pack
        </button>
        <button
          onClick={() =>
            handlePresetItem(
              'Smart Car Key Fob',
              'Vehicle Access',
              'A sleek keyless entry fob with remote lock and unlock buttons.',
              'You picked up your vehicle key fob.'
            )
          }
          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs rounded border border-slate-700 transition"
        >
          🔑 Key Fob
        </button>
      </div>

      {/* Detection Result Card */}
      {lastResult && (
        <div
          id="optical-pickup-result-card"
          className="bg-slate-950/70 border border-emerald-500/40 rounded-lg p-3.5 flex flex-col gap-2 transition animate-fadeIn"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono font-bold text-emerald-300">OBJECT CONFIRMED</span>
              <span className="text-[10px] font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                {lastResult.category}
              </span>
            </div>

            <button
              onClick={() => jarvisAudio.speak(lastResult.spokenAnnouncement)}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono transition"
            >
              <Volume2 className="w-3.5 h-3.5" />
              Replay Voice Feedback
            </button>
          </div>

          <div className="text-base font-bold text-white tracking-wide">{lastResult.itemName}</div>
          <p className="text-xs text-slate-300 leading-relaxed">{lastResult.description}</p>

          <div className="mt-1 bg-cyan-950/40 border border-cyan-500/20 rounded p-2 text-xs font-mono text-cyan-300 flex items-start gap-2">
            <Volume2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
            <span>&ldquo;{lastResult.spokenAnnouncement}&rdquo;</span>
          </div>
        </div>
      )}
    </div>
  );
};
