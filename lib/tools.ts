import type { Tool } from "./types";

export const TOOL_DEFINITIONS = [
  {
    type: "function" as const,
    name: "get_current_time",
    description: "Obtenir la date et l'heure actuelles (fuseau horaire Africa/Lagos)",
    parameters: { type: "object", properties: {}, required: [] },
  },
  {
    type: "function" as const,
    name: "get_weather",
    description: "Obtenir la météo actuelle pour une ville",
    parameters: {
      type: "object",
      properties: {
        city: { type: "string", description: "Nom de la ville" },
      },
      required: ["city"],
    },
  },
  {
    type: "function" as const,
    name: "calculate",
    description: "Évaluer une expression mathématique",
    parameters: {
      type: "object",
      properties: {
        expression: { type: "string", description: "Expression mathématique à calculer" },
      },
      required: ["expression"],
    },
  },
  {
    type: "function" as const,
    name: "search_web",
    description: "Rechercher des informations sur le web",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Requête de recherche" },
      },
      required: ["query"],
    },
  },
  {
    type: "function" as const,
    name: "get_port_status",
    description: "Obtenir le statut en temps réel du Port Autonome de Kribi (PAK), Cameroun",
    parameters: { type: "object", properties: {}, required: [] },
  },
  {
    type: "function" as const,
    name: "generate_gemini_dataviz",
    description: "Générer une structure de visualisation de données avec Gemini à partir d'un prompt métier",
    parameters: {
      type: "object",
      properties: {
        prompt: { type: "string", description: "Brief ou besoin de data visualisation" },
      },
      required: ["prompt"],
    },
  },
  {
    type: "function" as const,
    name: "query_softis",
    description: "Interroger de manière sécurisée le backend Softis via une route serveur protégée",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Requête métier ou SQL compatible selon votre backend Softis" },
      },
      required: ["query"],
    },
  },
];

export const DEFAULT_TOOLS: Tool[] = [
  { name: "get_current_time", description: "Date & heure actuelles", enabled: true, icon: "🕐" },
  { name: "get_weather", description: "Météo en temps réel", enabled: true, icon: "🌤️" },
  { name: "calculate", description: "Calcul mathématique", enabled: true, icon: "🧮" },
  { name: "search_web", description: "Recherche web", enabled: true, icon: "🔍" },
  { name: "get_port_status", description: "Statut Port de Kribi", enabled: true, icon: "⚓" },
  { name: "generate_gemini_dataviz", description: "Dataviz Gemini", enabled: true, icon: "📊" },
  { name: "query_softis", description: "Requêtes Softis sécurisées", enabled: true, icon: "🗄️" },
];
