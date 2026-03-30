import type { PortDashboardPayload, PortDomainPayload, PortMetric, PortMetricGroup, PortStatsDomain, PortStatsPeriod } from "@/lib/types";

const DOMAIN_LABELS: Record<PortStatsDomain, string> = {
  escales: "Escales",
  marchandises: "Marchandises",
  conteneurs: "Conteneurs",
  finance: "Finance",
  camions: "Camions",
  productivite: "Productivité",
  parts_ligne: "Parts de ligne",
};

const DOMAIN_VIEW_ENV: Record<PortStatsDomain, string> = {
  escales: "SUPABASE_PORT_STATS_VIEW_ESCALES",
  marchandises: "SUPABASE_PORT_STATS_VIEW_MARCHANDISES",
  conteneurs: "SUPABASE_PORT_STATS_VIEW_CONTENEURS",
  finance: "SUPABASE_PORT_STATS_VIEW_FINANCE",
  camions: "SUPABASE_PORT_STATS_VIEW_CAMIONS",
  productivite: "SUPABASE_PORT_STATS_VIEW_PRODUCTIVITE",
  parts_ligne: "SUPABASE_PORT_STATS_VIEW_PARTS_LIGNE",
};

interface SupabaseQueryOptions {
  select?: string;
  limit?: number;
  order?: string;
  ascending?: boolean;
  filters?: Record<string, string | number | boolean>;
}

interface StatsRecord {
  period?: string;
  period_scope?: string;
  period_key?: string;
  domain?: string;
  metric_key?: string;
  metric?: string;
  label?: string;
  metric_label?: string;
  value?: number | string | null;
  unit?: string | null;
  trend?: number | string | null;
  comparison_label?: string | null;
  [key: string]: unknown;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`La variable d'environnement ${name} est manquante`);
  }
  return value;
}

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return { configured: false as const };
  }

  return {
    configured: true as const,
    url: url.replace(/\/$/, ""),
    key,
  };
}

async function supabaseRestFetch<T>(resource: string, options: SupabaseQueryOptions = {}): Promise<T[]> {
  const config = getSupabaseConfig();
  if (!config.configured) {
    return [];
  }

  const select = options.select || "*";
  const params = new URLSearchParams({ select });

  if (typeof options.limit === "number") params.set("limit", String(options.limit));
  if (options.order) params.set("order", `${options.order}.${options.ascending === false ? "desc" : "asc"}`);

  Object.entries(options.filters || {}).forEach(([key, value]) => {
    params.set(key, `eq.${String(value)}`);
  });

  const response = await fetch(`${config.url}/rest/v1/${resource}?${params.toString()}`, {
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      Accept: "application/json",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(12000),
  });

  if (!response.ok) {
    throw new Error(`Supabase REST a échoué sur ${resource} (${response.status})`);
  }

  return (await response.json()) as T[];
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const normalized = Number(value.replace(/\s+/g, "").replace(",", "."));
    return Number.isFinite(normalized) ? normalized : 0;
  }
  return 0;
}

function normalizeMetric(record: StatsRecord): PortMetric {
  return {
    key: String(record.metric_key || record.metric || record.label || "metric"),
    label: String(record.metric_label || record.label || record.metric_key || record.metric || "Indicateur"),
    value: toNumber(record.value),
    unit: record.unit ? String(record.unit) : undefined,
    trend: record.trend === null || record.trend === undefined ? undefined : toNumber(record.trend),
    comparisonLabel: record.comparison_label ? String(record.comparison_label) : undefined,
  };
}

function fallbackDashboard(): PortDashboardPayload {
  return {
    generatedAt: new Date().toISOString(),
    source: "fallback",
    configured: false,
    overview: {
      weekly: [
        { key: "escales", label: "Escales semaine", value: 12, unit: "navires", trend: 8, comparisonLabel: "vs sem. préc." },
        { key: "marchandises", label: "Marchandises semaine", value: 84250, unit: "t", trend: 6 },
        { key: "conteneurs", label: "Conteneurs semaine", value: 3180, unit: "TEU", trend: 4 },
      ],
      yearly: [
        { key: "escales_ytd", label: "Escales YTD", value: 146, unit: "navires" },
        { key: "marchandises_ytd", label: "Marchandises YTD", value: 982400, unit: "t" },
        { key: "revenus_ytd", label: "Revenus YTD", value: 12.4, unit: "Mds XAF", trend: 11 },
      ],
    },
    domains: [
      { domain: "escales", label: "Escales", metrics: [{ key: "attente", label: "Attente moyenne", value: 3.2, unit: "h" }] },
      { domain: "marchandises", label: "Marchandises", metrics: [{ key: "vrac", label: "Vrac dominant", value: 61, unit: "%" }] },
      { domain: "conteneurs", label: "Conteneurs", metrics: [{ key: "reefer", label: "Conteneurs reefer", value: 214, unit: "TEU" }] },
      { domain: "finance", label: "Finance", metrics: [{ key: "encaissement", label: "Encaissement", value: 92, unit: "%" }] },
      { domain: "camions", label: "Camions", metrics: [{ key: "rotation", label: "Rotation moyenne", value: 47, unit: "min" }] },
      { domain: "productivite", label: "Productivité", metrics: [{ key: "cadence", label: "Cadence quai", value: 29, unit: "mvt/h" }] },
      { domain: "parts_ligne", label: "Parts de ligne", metrics: [{ key: "top_line", label: "Top line", value: 34, unit: "%" }] },
    ],
    notes: [
      "Mode démonstration: configure SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY pour alimenter le dashboard réel.",
      "Les vues par domaine sont optionnelles et permettent de corriger les mappings métier sans exposer la structure DB au front.",
    ],
  };
}

function fallbackDomain(domain: PortStatsDomain): PortDomainPayload {
  const dashboard = fallbackDashboard();
  const found = dashboard.domains.find((item) => item.domain === domain);

  return {
    generatedAt: new Date().toISOString(),
    source: "fallback",
    configured: false,
    domain,
    label: DOMAIN_LABELS[domain],
    metrics: found?.metrics || [],
    notes: dashboard.notes,
  };
}

async function fetchOverviewMetrics(period: PortStatsPeriod): Promise<PortMetric[]> {
  const viewName = process.env[period === "weekly" ? "SUPABASE_PORT_STATS_VIEW_DASHBOARD_WEEKLY" : "SUPABASE_PORT_STATS_VIEW_DASHBOARD_YEARLY"];
  if (viewName) {
    const rows = await supabaseRestFetch<StatsRecord>(viewName, { order: "metric_label", ascending: true });
    return rows.map(normalizeMetric);
  }

  const genericView = process.env.SUPABASE_PORT_STATS_VIEW_DASHBOARD;
  if (!genericView) return [];

  const rows = await supabaseRestFetch<StatsRecord>(genericView, {
    filters: { period_scope: period },
    order: "metric_label",
    ascending: true,
  });
  return rows.map(normalizeMetric);
}

async function fetchDomainMetrics(domain: PortStatsDomain): Promise<PortMetric[]> {
  const specificView = process.env[DOMAIN_VIEW_ENV[domain]];
  if (specificView) {
    const rows = await supabaseRestFetch<StatsRecord>(specificView, { order: "metric_label", ascending: true });
    return rows.map(normalizeMetric);
  }

  const genericView = process.env.SUPABASE_PORT_STATS_VIEW_DOMAIN;
  if (!genericView) return [];

  const rows = await supabaseRestFetch<StatsRecord>(genericView, {
    filters: { domain },
    order: "metric_label",
    ascending: true,
  });
  return rows.map(normalizeMetric);
}

export async function getPortDashboard(): Promise<PortDashboardPayload> {
  const supabase = getSupabaseConfig();
  if (!supabase.configured) {
    return fallbackDashboard();
  }

  const [weekly, yearly, domainEntries] = await Promise.all([
    fetchOverviewMetrics("weekly"),
    fetchOverviewMetrics("yearly"),
    Promise.all(
      (Object.keys(DOMAIN_LABELS) as PortStatsDomain[]).map(async (domain) => {
        const metrics = await fetchDomainMetrics(domain);
        return { domain, label: DOMAIN_LABELS[domain], metrics } satisfies PortMetricGroup;
      })
    ),
  ]);

  const hasData = weekly.length > 0 || yearly.length > 0 || domainEntries.some((entry) => entry.metrics.length > 0);
  if (!hasData) {
    return {
      ...fallbackDashboard(),
      generatedAt: new Date().toISOString(),
      source: "fallback",
      configured: true,
      notes: [
        "Supabase est configuré mais aucune vue exploitable n'a répondu.",
        "Renseigne SUPABASE_PORT_STATS_VIEW_DASHBOARD[_WEEKLY|_YEARLY] et/ou SUPABASE_PORT_STATS_VIEW_DOMAIN[_DOMAINE].",
      ],
    };
  }

  return {
    generatedAt: new Date().toISOString(),
    source: "supabase",
    configured: true,
    overview: { weekly, yearly },
    domains: domainEntries.filter((entry) => entry.metrics.length > 0),
    notes: [
      "Les métriques sont normalisées côté serveur avant exposition au front.",
      "La clé service Supabase reste confinée au serveur Next.js.",
    ],
  };
}

export async function getPortDomain(domain: PortStatsDomain): Promise<PortDomainPayload> {
  const supabase = getSupabaseConfig();
  if (!supabase.configured) {
    return fallbackDomain(domain);
  }

  const metrics = await fetchDomainMetrics(domain);
  if (metrics.length === 0) {
    return {
      ...fallbackDomain(domain),
      generatedAt: new Date().toISOString(),
      configured: true,
      notes: [
        `Aucune métrique disponible pour le domaine ${DOMAIN_LABELS[domain]}.`,
        "Vérifie la vue spécifique domaine ou la vue générique SUPABASE_PORT_STATS_VIEW_DOMAIN.",
      ],
    };
  }

  return {
    generatedAt: new Date().toISOString(),
    source: "supabase",
    configured: true,
    domain,
    label: DOMAIN_LABELS[domain],
    metrics,
    notes: ["Données servies via Supabase REST côté serveur uniquement."],
  };
}

export function isPortStatsDomain(value: string): value is PortStatsDomain {
  return value in DOMAIN_LABELS;
}

export function getPortStatsDomainLabel(domain: PortStatsDomain) {
  return DOMAIN_LABELS[domain];
}
