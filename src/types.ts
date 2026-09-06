export interface MobileNotification {
  id: string;
  app: string;
  icon: string;
  title: string;
  message: string;
  time: string;
  unread: boolean;
  priority?: 'low' | 'normal' | 'high';
}

export interface MobileFile {
  id: string;
  name: string;
  folder: 'Documents' | 'Downloads' | 'Camera' | 'Audio' | 'System';
  size: string;
  type: 'image' | 'pdf' | 'doc' | 'code' | 'audio' | 'archive';
  modified: string;
  previewUrl?: string;
  contentSnippet?: string;
}

export interface MobileApp {
  id: string;
  name: string;
  icon: string;
  category: 'System' | 'Productivity' | 'Media' | 'Tools';
  screen: 'home' | 'browser' | 'youtube' | 'camera' | 'files' | 'messages' | 'settings' | 'notes' | 'gallery' | 'dialer';
  badge?: number;
}

export interface MobileDeviceState {
  isLocked: boolean;
  pinCode: string;
  battery: number;
  isCharging: boolean;
  volume: number; // 0 - 100
  brightness: number; // 0 - 100
  wifi: boolean;
  bluetooth: boolean;
  flashlight: boolean;
  doNotDisturb: boolean;
  cellularSignal: number; // 1 - 4
  currentApp: string | null; // null = home / lock screen
  screenState: 'off' | 'locked' | 'unlocked';
}

export interface PickUpDetectionResult {
  itemName: string;
  category: string;
  confidence: number;
  description: string;
  spokenAnnouncement: string;
  usageOrFacts?: string;
  detectedAt: string;
}

export interface MarketSearchScrapeResult {
  query: string;
  item: string;
  priceEstimate: string;
  standardQuantities: string;
  commonUses: string[];
  summary: string;
  spokenText: string;
  searchUrl: string;
  scrapedSources: { title: string; url: string; snippet: string }[];
  marketTips?: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  category: 'voice' | 'vision' | 'mobile' | 'gesture' | 'system' | 'search';
  title: string;
  detail: string;
  status: 'success' | 'warning' | 'info' | 'error';
  badge?: string;
}

export interface VoiceCommandDef {
  id: string;
  triggerPhrase: string;
  aliases: string[];
  category: 'Mobile Control' | 'Vision Mission' | 'Web Search' | 'Navigation' | 'System';
  description: string;
  sampleAction: string;
}

export type GestureType =
  | 'NONE'
  | 'OPEN_PALM'
  | 'CLOSED_FIST'
  | 'SWIPE_LEFT'
  | 'SWIPE_RIGHT'
  | 'POINT_PINCH'
  | 'VICTORY'
  | 'THUMBS_UP';

export interface RemoteMobileCommand {
  id: string;
  type: 'LOCK' | 'UNLOCK' | 'FLASHLIGHT' | 'VIBRATE' | 'NOTIFY' | 'OPEN_APP' | 'WAKE_LOCK' | 'SPEAK';
  payload?: any;
  timestamp: number;
}

export interface RealDeviceStatus {
  isPhysicalMobile: boolean;
  batteryLevel: number;
  isCharging: boolean;
  wakeLockActive: boolean;
  torchActive: boolean;
  networkType: string;
  userAgent: string;
  hasVibration: boolean;
  hasTorch: boolean;
  hasNotifications: boolean;
}
