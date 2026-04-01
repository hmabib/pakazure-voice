import OpenAI from "openai";
import { getPortDashboard, getPortDomain } from "@/lib/port-stats";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`La variable d'environnement ${name} est manquante`);
  }
  return value;
}

export async function getCurrentTime() {
  const now = new Date();
  return {
    datetime: now.toLocaleString("fr-FR", { timeZone: "Africa/Lagos" }),
    date: now.toLocaleDateString("fr-FR", { timeZone: "Africa/Lagos" }),
    time: now.toLocaleTimeString("fr-FR", { timeZone: "Africa/Lagos" }),
    timezone: "Africa/Lagos (WAT, UTC+1)",
    iso: now.toISOString(),
  };
}

export async function getWeather(city: string) {
  const safeCity = city || "Kribi";
  const res = await fetch(`https://wttr.in/${encodeURIComponent(safeCity)}?format=j1`, {
    signal: AbortSignal.timeout(6000),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Service météo indisponible (${res.status})`);
  }

  const data = await res.json();
  const current = data.current_condition?.[0];
  return {
    city: safeCity,
    temp_c: current?.temp_C,
    feels_like_c: current?.FeelsLikeC,
    description: current?.weatherDesc?.[0]?.value,
    humidity: current?.humidity ? `${current.humidity}%` : undefined,
    wind_kmph: current?.windspeedKmph ? `${current.windspeedKmph} km/h` : undefined,
    visibility_km: current?.visibility,
  };
}

export async function calculate(expression: string) {
  const expr = expression || "";
  const safe = expr.replace(/[^0-9+\-*/.() %^,\s]/g, "");
  const normalized = safe.replace(/\^/g, "**");
  const result = Function(`"use strict"; return (${normalized})`)();
  return { expression: expr, result, formatted: String(result) };
}

export async function searchWeb(query: string) {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;
  if (!apiKey) {
    return {
      query,
      configured: false,
      note: "BRAVE_SEARCH_API_KEY non configurée. Ajoute-la dans Vercel pour activer la vraie recherche web.",
      results: [],
    };
  }

  const res = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5&search_lang=fr`, {
    headers: {
      Accept: "application/json",
      "Accept-Encoding": "gzip",
      "X-Subscription-Token": apiKey,
    },
    signal: AbortSignal.timeout(7000),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Brave Search a échoué (${res.status})`);
  }

  const data = await res.json();
  const results = (data.web?.results || []).slice(0, 5).map((item: Record<string, unknown>) => ({
    title: item.title,
    snippet: item.description,
    url: item.url,
  }));

  return { query, configured: true, results };
}

export async function getPortStatus() {
  const dashboard = await getPortDashboard();
  return {
    port: "Port Autonome de Kribi (PAK)",
    status: dashboard.configured ? "Connecté" : "Fallback",
    source: dashboard.source,
    note: dashboard.configured
      ? "Les statistiques portuaires générales sont disponibles côté serveur et consultables par l'assistant."
      : "Le panneau stats fonctionne, mais certaines variables Supabase restent à configurer pour la donnée réelle.",
    last_updated: dashboard.generatedAt,
  };
}

export async function generateGeminiDataviz(prompt: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      configured: false,
      note: "GEMINI_API_KEY non configurée. Ajoute-la pour activer la dataviz IA.",
      prompt,
    };
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `Tu es un moteur de data visualisation pour PAKAZURE. À partir de ce besoin: ${prompt}\n\nRetourne uniquement un JSON valide avec cette structure: {\"title\": string, \"summary\": string, \"chartType\": string, \"series\": [{\"label\": string, \"value\": number}], \"insight\": string }`,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
      },
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Gemini API a échoué (${response.status})`);
  }

  const data = await response.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) {
    throw new Error("Réponse Gemini vide");
  }

  return {
    configured: true,
    prompt,
    visualization: JSON.parse(raw),
  };
}

export async function querySoftis(query: string) {
  const baseUrl = process.env.SOFTIS_API_BASE_URL;
  const token = process.env.SOFTIS_API_TOKEN;

  if (baseUrl && token) {
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query }),
      signal: AbortSignal.timeout(15000),
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Softis API a échoué (${res.status})`);
    }

    const data = await res.json();
    return {
      configured: true,
      backend: "softis-conteneurs",
      scope: "conteneurs",
      query,
      data,
    };
  }

  const domain = await getPortDomain("conteneurs");
  return {
    configured: false,
    backend: "supabase-conteneurs-fallback",
    scope: "conteneurs",
    note: "SOFTIS_API_BASE_URL et/ou SOFTIS_API_TOKEN non configurés. Réponse fournie via la vue conteneurs Supabase déjà branchée.",
    query,
    data: domain,
  };
}

export async function queryPortStats(query: string, domain?: string) {
  const allowedDomains = ["escales", "marchandises", "conteneurs", "finance", "camions", "productivite", "parts_ligne"];

  if (domain && allowedDomains.includes(domain)) {
    return {
      configured: true,
      backend: "supabase-port-stats",
      scope: domain,
      query,
      data: await getPortDomain(domain as "escales" | "marchandises" | "conteneurs" | "finance" | "camions" | "productivite" | "parts_ligne"),
    };
  }

  return {
    configured: true,
    backend: "supabase-port-stats",
    scope: "general",
    query,
    data: await getPortDashboard(),
  };
}

export async function createRealtimeSession({ enableVideo = false }: { enableVideo?: boolean } = {}) {
  const apiKey = requireEnv("OPENAI_API_KEY");
  const model = (process.env.OPENAI_REALTIME_MODEL || "gpt-4o-realtime-preview-2024-12-17") as
    | "gpt-4o-realtime-preview"
    | "gpt-4o-realtime-preview-2024-10-01"
    | "gpt-4o-realtime-preview-2024-12-17"
    | "gpt-4o-mini-realtime-preview"
    | "gpt-4o-mini-realtime-preview-2024-12-17";
  const voice = (process.env.OPENAI_REALTIME_VOICE || "shimmer") as
    | "alloy"
    | "ash"
    | "ballad"
    | "coral"
    | "echo"
    | "fable"
    | "nova"
    | "onyx"
    | "sage"
    | "shimmer"
    | "verse";

  const client = new OpenAI({ apiKey });
  const videoInputEnabled = process.env.OPENAI_REALTIME_ENABLE_VIDEO === "true";

  const session = await client.beta.realtime.sessions.create({
    model,
    voice,
    modalities: ["audio", "text"],
    instructions:
      "Tu es Camara Boto, voix opérationnelle de PAKAZURE. Réponds en français, de façon claire, utile et naturelle.",
    input_audio_transcription: { model: "whisper-1", language: "fr" },
    turn_detection: {
      type: "server_vad",
      silence_duration_ms: 600,
      threshold: 0.5,
      prefix_padding_ms: 300,
    },
  });

  return {
    client_secret: session.client_secret,
    model,
    voice,
    capabilities: {
      videoInput: enableVideo && videoInputEnabled,
      videoMode: enableVideo && videoInputEnabled ? "camera-feed" : "architecture-only",
      fallbackReason:
        enableVideo && !videoInputEnabled
          ? "Support webcam realtime non confirmé côté modèle/session."
          : undefined,
    },
  };
}
