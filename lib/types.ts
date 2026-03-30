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

export interface Settings {
  voice: string;
  language: string;
  systemPrompt: string;
  mcpServers: MCPServer[];
  pushToTalk: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  voice: "shimmer",
  language: "fr",
  systemPrompt:
    "Tu es PAKAZURE Voice, un assistant IA expert en logistique portuaire et commerce africain. Tu réponds toujours en français sauf si l'utilisateur parle une autre langue. Tu es précis, professionnel et utile. Tu as accès à des outils pour rechercher des informations, calculer, obtenir la météo et le statut du Port Autonome de Kribi.",
  mcpServers: [],
  pushToTalk: false,
};
