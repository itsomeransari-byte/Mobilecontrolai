import React, { useState } from 'react';
import {
  Activity,
  Mic,
  Clock,
  Filter,
  Download,
  Trash2,
  Play,
  CheckCircle2,
  AlertTriangle,
  Info,
  Shield,
  Smartphone,
  Eye,
  Globe,
  Sliders,
  Sparkles,
} from 'lucide-react';
import type { ActivityLog, VoiceCommandDef } from '../types';
import { jarvisAudio } from '../utils/audio';

interface ActivityDashboardProps {
  activityLogs: ActivityLog[];
  onClearLogs: () => void;
  onTriggerVoiceCommand: (phrase: string) => void;
  isListening: boolean;
  onToggleListening: () => void;
}

export const ActivityDashboard: React.FC<ActivityDashboardProps> = ({
  activityLogs,
  onClearLogs,
  onTriggerVoiceCommand,
  isListening,
  onToggleListening,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'history' | 'commands' | 'telemetry'>('history');

  // Supported Voice Commands Directory
  const voiceCommands: VoiceCommandDef[] = [
    {
      id: 'cmd-1',
      triggerPhrase: 'What I pickup',
      aliases: ['what did I pickup', 'see what I pickup', 'scan my hand', 'identify item'],
      category: 'Vision Mission',
      description: 'Scans webcam frame to identify what object you are holding in your hand and announces the item.',
      sampleAction: 'Analyzes optical feed and speaks item name via voice feedback.',
    },
    {
      id: 'cmd-2',
      triggerPhrase: 'How much prices quantity use of sugar',
      aliases: ['price quantity use of sugar', 'search sugar prices', 'market price of sugar'],
      category: 'Web Search',
      description: 'Scrapes live market pricing, commercial packaging quantities, and culinary uses of sugar.',
      sampleAction: 'Synthesizes market data, opens Chrome search tab, and reads results aloud.',
    },
    {
      id: 'cmd-3',
      triggerPhrase: 'Lock screen mobile',
      aliases: ['lock phone', 'lock mobile', 'lock screen'],
      category: 'Mobile Control',
      description: 'Remotely triggers secure lock screen on the smartphone with lock sound effect.',
      sampleAction: 'Sets mobile state to locked and enables PIN/biometrics.',
    },
    {
      id: 'cmd-4',
      triggerPhrase: 'Unlock mobile',
      aliases: ['unlock phone', 'unlock screen'],
      category: 'Mobile Control',
      description: 'Remotely unlocks the connected mobile device to display the app launcher.',
      sampleAction: 'Bypasses lock screen and opens active mobile interface.',
    },
    {
      id: 'cmd-5',
      triggerPhrase: 'Open Chrome',
      aliases: ['open browser', 'launch chrome', 'open google'],
      category: 'Mobile Control',
      description: 'Launches Chrome browser on the mobile device with live search capability.',
      sampleAction: 'Opens Chrome simulated screen and search query bar.',
    },
    {
      id: 'cmd-6',
      triggerPhrase: 'Open Files',
      aliases: ['open file manager', 'browse files', 'show documents'],
      category: 'Mobile Control',
      description: 'Accesses remote device internal storage, files, and downloads.',
      sampleAction: 'Launches Remote File Manager explorer.',
    },
    {
      id: 'cmd-7',
      triggerPhrase: 'Show notifications',
      aliases: ['open notifications', 'read notifications', 'clear notifications'],
      category: 'Mobile Control',
      description: 'Pulls up all incoming device notifications, SMS, and WhatsApp alerts.',
      sampleAction: 'Displays mobile notification center.',
    },
    {
      id: 'cmd-8',
      triggerPhrase: 'Turn on flashlight',
      aliases: ['flashlight on', 'torch on', 'turn off flashlight'],
      category: 'Mobile Control',
      description: 'Toggles mobile device rear LED flashlight.',
      sampleAction: 'Hardware flashlight state updated.',
    },
    {
      id: 'cmd-9',
      triggerPhrase: 'System status report',
      aliases: ['status', 'diagnostics', 'check core'],
      category: 'System',
      description: 'Runs real-time diagnostic of 3D Hologram, audio engines, and mobile link.',
      sampleAction: 'JARVIS speaks full operational readiness report.',
    },
  ];

  const filteredLogs =
    selectedFilter === 'all' ? activityLogs : activityLogs.filter((log) => log.category === selectedFilter);

  const exportLogs = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(activityLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `jarvis_v8_activity_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    jarvisAudio.speak('Activity log exported successfully.');
  };

  return (
    <div
      id="activity-dashboard-container"
      className="flex flex-col gap-4 bg-slate-900/85 border border-cyan-500/30 rounded-xl p-4 lg:p-5 backdrop-blur-md shadow-xl shadow-cyan-950/20"
    >
      {/* Top Header & Mode Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-cyan-500/20 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
          <div>
            <h3 className="text-sm font-bold tracking-wider text-cyan-300 uppercase">Real-Time Activity Dashboard</h3>
            <p className="text-xs text-slate-400">Continuous telemetry, command management & event tracking</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1 rounded text-xs font-mono font-bold transition ${
              activeTab === 'history' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            Activity Logs ({activityLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('commands')}
            className={`px-3 py-1 rounded text-xs font-mono font-bold transition ${
              activeTab === 'commands' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            Voice Command Hub ({voiceCommands.length})
          </button>
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`px-3 py-1 rounded text-xs font-mono font-bold transition ${
              activeTab === 'telemetry' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            System Telemetry
          </button>
        </div>
      </div>

      {/* TAB 1: ACTIVITY HISTORY */}
      {activeTab === 'history' && (
        <div className="flex flex-col gap-3 animate-fadeIn">
          {/* Action & Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-mono">
              <Filter className="w-3.5 h-3.5 text-slate-400 mr-1" />
              {['all', 'voice', 'vision', 'mobile', 'gesture', 'search', 'system'].map((f) => (
                <button
                  key={f}
                  onClick={() => setSelectedFilter(f)}
                  className={`px-2.5 py-1 rounded text-xs transition uppercase ${
                    selectedFilter === f
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={exportLogs}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded text-xs font-mono flex items-center gap-1 border border-slate-700 transition"
              >
                <Download className="w-3.5 h-3.5" />
                Export
              </button>
              <button
                onClick={() => {
                  onClearLogs();
                  jarvisAudio.speak('Activity logs cleared.');
                }}
                className="px-2.5 py-1 bg-slate-800 hover:bg-rose-900/60 text-rose-300 rounded text-xs font-mono flex items-center gap-1 border border-slate-700 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            </div>
          </div>

          {/* Timeline List */}
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/60 rounded-lg border border-slate-800 text-slate-500 text-xs font-mono">
              No activity logs recorded for category: {selectedFilter.toUpperCase()}.
            </div>
          ) : (
            <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 flex items-start justify-between gap-3 hover:border-cyan-500/40 transition"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {log.category === 'voice' && <Mic className="w-4 h-4 text-cyan-400" />}
                      {log.category === 'vision' && <Eye className="w-4 h-4 text-emerald-400" />}
                      {log.category === 'mobile' && <Smartphone className="w-4 h-4 text-blue-400" />}
                      {log.category === 'gesture' && <Activity className="w-4 h-4 text-purple-400" />}
                      {log.category === 'search' && <Globe className="w-4 h-4 text-amber-400" />}
                      {log.category === 'system' && <Shield className="w-4 h-4 text-slate-400" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{log.title}</span>
                        <span className="text-[10px] font-mono uppercase bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                          {log.category}
                        </span>
                        {log.badge && (
                          <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.5 rounded">
                            {log.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">{log.detail}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 flex-shrink-0">
                    <Clock className="w-3 h-3" />
                    <span>{log.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: VOICE COMMANDS HUB */}
      {activeTab === 'commands' && (
        <div className="flex flex-col gap-3 animate-fadeIn">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>REGISTERED VOICE INTENTS & TRIGGERS</span>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isListening ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
              <span className="text-cyan-400 font-bold">{isListening ? 'CONTINUOUS LISTENING: ON' : 'MIC STANDBY'}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto pr-1">
            {voiceCommands.map((cmd) => (
              <div
                key={cmd.id}
                className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between gap-2.5 hover:border-cyan-500/40 transition group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-300 group-hover:text-cyan-200">
                      &ldquo;{cmd.triggerPhrase}&rdquo;
                    </span>
                    <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                      {cmd.category}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{cmd.description}</p>

                  <div className="mt-2 text-[11px] font-mono text-slate-400 flex flex-wrap gap-1">
                    <span className="text-slate-500">Aliases:</span>
                    {cmd.aliases.map((alias) => (
                      <span key={alias} className="bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-slate-300">
                        {alias}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] text-slate-500 font-mono">Action: {cmd.sampleAction}</span>
                  <button
                    onClick={() => onTriggerVoiceCommand(cmd.triggerPhrase)}
                    className="px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded text-xs font-mono font-bold flex items-center gap-1 transition"
                  >
                    <Play className="w-3 h-3" />
                    Test Trigger
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SYSTEM TELEMETRY */}
      {activeTab === 'telemetry' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-fadeIn">
          {/* Core Gauge */}
          <div className="bg-slate-950/80 border border-cyan-500/30 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">3D HOLOGRAPHIC CORE</span>
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            </div>
            <div className="text-2xl font-bold text-white my-2">60 FPS</div>
            <span className="text-[11px] font-mono text-cyan-400">Three.js WebGL Engine Synced</span>
          </div>

          {/* Mobile Link Gauge */}
          <div className="bg-slate-950/80 border border-cyan-500/30 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">MOBILE TETHER</span>
              <Smartphone className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400 my-2">ONLINE</div>
            <span className="text-[11px] font-mono text-slate-400">5G Ultra Low Latency (~12ms)</span>
          </div>

          {/* Optical Tracker Gauge */}
          <div className="bg-slate-950/80 border border-cyan-500/30 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">OPTICAL SENSOR</span>
              <Eye className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-cyan-300 my-2">ACTIVE</div>
            <span className="text-[11px] font-mono text-slate-400">Gemini Vision Multimodal API</span>
          </div>

          {/* Voice Engine Gauge */}
          <div className="bg-slate-950/80 border border-cyan-500/30 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">AUDIO SYNTHESIS</span>
              <Mic className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white my-2">ENABLED</div>
            <span className="text-[11px] font-mono text-emerald-400">Speech Synthesis Feedback OK</span>
          </div>
        </div>
      )}
    </div>
  );
};
