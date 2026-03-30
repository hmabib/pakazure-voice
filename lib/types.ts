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

export interface Settings {
  voice: string;
  language: string;
  systemPrompt: string;
  mcpServers: MCPServer[];
  pushToTalk: boolean;
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
  avatar: {
    mouthX: 0.5,
    mouthY: -1.5,
    eyesX: 0.3,
    eyesY: -1.2,
    effectIntensity: 0.85,
    avatarScale: 1.04,
    keepCenteredWhileSpeaking: true,
    showTranscriptBelowAvatar: true,
  },
};
