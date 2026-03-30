export type SessionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "listening"
  | "thinking"
  | "speaking"
  | "error"
  | "disconnected";

export interface TranscriptItem {
  id: string;
  role: "user" | "assistant" | "tool";
  text: string;
  timestamp: Date;
  toolName?: string;
  toolResult?: string;
}

export interface Tool {
  name: string;
  description: string;
  enabled: boolean;
  icon?: string;
}

export interface MCPServer {
  url: string;
  name: string;
  connected: boolean;
}

export interface AvatarSettings {
  mouthX: number;
  mouthY: number;
  eyesX: number;
  eyesY: number;
  effectIntensity: number;
  avatarScale: number;
  keepCenteredWhileSpeaking: boolean;
  showTranscriptBelowAvatar: boolean;
}

export interface RealtimeVideoSettings {
  enabled: boolean;
  previewMirrored: boolean;
  mode: "camera-feed" | "architecture-only";
  fallbackReason?: string;
}

export interface Settings {
  voice: string;
  language: string;
  systemPrompt: string;
  mcpServers: MCPServer[];
  pushToTalk: boolean;
  realtimeVideo: RealtimeVideoSettings;
  avatar: AvatarSettings;
}

export type PortStatsDomain =
  | "escales"
  | "marchandises"
  | "conteneurs"
  | "finance"
  | "camions"
  | "productivite"
  | "parts_ligne";

export type PortStatsPeriod = "weekly" | "yearly";

export interface PortMetric {
  key: string;
  label: string;
  value: number;
  unit?: string;
  trend?: number;
  comparisonLabel?: string;
}

export interface PortMetricGroup {
  domain: PortStatsDomain;
  label: string;
  metrics: PortMetric[];
}

export interface PortDashboardPayload {
  generatedAt: string;
  source: "supabase" | "fallback";
  configured: boolean;
  overview: {
    weekly: PortMetric[];
    yearly: PortMetric[];
  };
  domains: PortMetricGroup[];
  notes: string[];
}

export interface PortDomainPayload {
  generatedAt: string;
  source: "supabase" | "fallback";
  configured: boolean;
  domain: PortStatsDomain;
  label: string;
  metrics: PortMetric[];
  notes: string[];
}

export const DEFAULT_SETTINGS: Settings = {
  voice: "shimmer",
  language: "fr",
  systemPrompt:
    "Tu es PAKAZURE Voice, un assistant IA expert en logistique portuaire et commerce africain. Tu réponds toujours en français sauf si l'utilisateur parle une autre langue. Tu es précis, professionnel et utile. Tu as accès à des outils pour rechercher des informations, calculer, obtenir la météo et le statut du Port Autonome de Kribi.",
  mcpServers: [],
  pushToTalk: false,
  realtimeVideo: {
    enabled: false,
    previewMirrored: true,
    mode: "architecture-only",
    fallbackReason:
      "Le flux webcam vers le modèle realtime dépend encore du support effectif du modèle et de la négociation WebRTC côté fournisseur. L’option prépare le state, la session et la capture locale avec garde-fous.",
  },
  avatar: {
    mouthX: 6,
    mouthY: 5,
    eyesX: 4.5,
    eyesY: 4,
    effectIntensity: 0.7,
    avatarScale: 1.04,
    keepCenteredWhileSpeaking: true,
    showTranscriptBelowAvatar: true,
  },
};
