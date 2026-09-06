/**
 * JARVIS Audio & Speech Synthesis Engine
 */

class JarvisAudioEngine {
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;
  private preferredVoice: SpeechSynthesisVoice | null = null;

  constructor() {
    // AudioContext will be initialized on first user interaction
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        this.selectBestVoice();
      };
      this.selectBestVoice();
    }
  }

  private initAudioContext() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  private selectBestVoice() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const voices = window.speechSynthesis.getVoices();
    // Prefer natural British or deep authoritative American English voice
    const jarvisVoice =
      voices.find((v) => v.name.toLowerCase().includes('daniel') || v.name.toLowerCase().includes('george')) ||
      voices.find((v) => v.lang.startsWith('en-GB')) ||
      voices.find((v) => v.name.toLowerCase().includes('male') && v.lang.startsWith('en')) ||
      voices.find((v) => v.lang.startsWith('en')) ||
      voices[0];

    if (jarvisVoice) {
      this.preferredVoice = jarvisVoice;
    }
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
    return window.speechSynthesis.getVoices();
  }

  public setVoice(voice: SpeechSynthesisVoice) {
    this.preferredVoice = voice;
  }

  public toggleMute(muted?: boolean): boolean {
    this.isMuted = muted !== undefined ? muted : !this.isMuted;
    if (this.isMuted && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /* ---------------- Sound Synthesizer Effects (Web Audio API) --------------- */

  public playBeep(freq = 920, duration = 0.12, type: OscillatorType = 'sine') {
    if (this.isMuted) return;
    try {
      this.initAudioContext();
      if (!this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

      gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch {
      // Ignore audio synthesis errors on blocked browsers
    }
  }

  public playScanChirp() {
    if (this.isMuted) return;
    try {
      this.initAudioContext();
      if (!this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(450, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1400, this.audioCtx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.25);
    } catch {}
  }

  public playLockSound(locked: boolean) {
    if (this.isMuted) return;
    try {
      this.initAudioContext();
      if (!this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      if (locked) {
        osc.frequency.setValueAtTime(600, this.audioCtx.currentTime);
        osc.frequency.setValueAtTime(320, this.audioCtx.currentTime + 0.08);
      } else {
        osc.frequency.setValueAtTime(400, this.audioCtx.currentTime);
        osc.frequency.setValueAtTime(840, this.audioCtx.currentTime + 0.08);
      }

      gain.gain.setValueAtTime(0.12, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.18);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.18);
    } catch {}
  }

  public playAlert() {
    if (this.isMuted) return;
    this.playBeep(480, 0.15, 'sawtooth');
    setTimeout(() => this.playBeep(720, 0.2, 'sine'), 160);
  }

  /* ---------------- Speech Synthesis Engine (Voice Output) ------------------ */

  public speak(text: string, onEnd?: () => void) {
    if (this.isMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      onEnd?.();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[*_#`]/g, '').trim();
      if (!cleanText) {
        onEnd?.();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      if (this.preferredVoice) {
        utterance.voice = this.preferredVoice;
      }
      utterance.pitch = 0.98;
      utterance.rate = 1.05;
      utterance.volume = 1.0;

      utterance.onend = () => {
        onEnd?.();
      };
      utterance.onerror = () => {
        onEnd?.();
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis failed:', e);
      onEnd?.();
    }
  }
}

export const jarvisAudio = new JarvisAudioEngine();
