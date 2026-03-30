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
    description: "Obtenir le statut général du Port Autonome de Kribi via les stats portuaires générales",
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
    description: "Interroger les statistiques conteneurs via Softis de manière sécurisée",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Question ou requête métier sur les conteneurs, import/export, EVP, TEU, pleins/vides" },
      },
      required: ["query"],
    },
  },
  {
    type: "function" as const,
    name: "query_port_stats",
    description: "Interroger les statistiques portuaires générales via Supabase (escales, marchandises, finance, camions, productivité, vue générale)",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Question métier sur les statistiques portuaires générales" },
        domain: {
          type: "string",
          enum: ["escales", "marchandises", "conteneurs", "finance", "camions", "productivite", "parts_ligne"],
          description: "Domaine ciblé si nécessaire",
        },
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
  { name: "get_port_status", description: "Statut général du port", enabled: true, icon: "⚓" },
  { name: "generate_gemini_dataviz", description: "Dataviz Gemini", enabled: true, icon: "📊" },
  { name: "query_softis", description: "Stats conteneurs via Softis", enabled: true, icon: "🗄️" },
  { name: "query_port_stats", description: "Stats portuaires générales", enabled: true, icon: "📈" },
];
