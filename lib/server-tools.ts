import OpenAI from "openai";

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
  return {
    port: "Port Autonome de Kribi (PAK)",
    status: "Opérationnel",
    source: "Connecteur métier à brancher",
    note: "Ce module est prêt côté UI, mais nécessite encore l’intégration API métier réelle pour exposer des données opérationnelles vérifiées.",
    last_updated: new Date().toISOString(),
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

  if (!baseUrl || !token) {
    return {
      configured: false,
      note: "SOFTIS_API_BASE_URL et/ou SOFTIS_API_TOKEN non configurés. Le slot sécurisé est prêt côté serveur.",
      query,
    };
  }

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
    query,
    data,
  };
}

export async function createRealtimeSession() {
  const client = new OpenAI({ apiKey: requireEnv("OPENAI_API_KEY") });
  const model = (process.env.OPENAI_REALTIME_MODEL || "gpt-4o-realtime-preview") as
    | "gpt-4o-realtime-preview"
    | "gpt-4o-realtime-preview-2024-10-01"
    | "gpt-4o-realtime-preview-2024-12-17"
    | "gpt-4o-mini-realtime-preview"
    | "gpt-4o-mini-realtime-preview-2024-12-17";

  return client.beta.realtime.sessions.create({
    model,
    voice: "echo",
  });
}
