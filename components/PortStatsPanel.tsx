"use client";

import clsx from "clsx";
import { useMemo, useState } from "react";
import type { PortDashboardPayload, PortMetric, PortStatsDomain } from "@/lib/types";

interface Props {
  data: PortDashboardPayload | null;
  loading?: boolean;
}

function formatMetric(metric: PortMetric) {
  const formattedValue = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: metric.value >= 100 ? 0 : 1 }).format(metric.value);
  return metric.unit ? `${formattedValue} ${metric.unit}` : formattedValue;
}

export default function PortStatsPanel({ data, loading = false }: Props) {
  const [activeDomain, setActiveDomain] = useState<PortStatsDomain | null>(null);

  const activeGroup = useMemo(() => {
    if (!data?.domains?.length) return null;
    return data.domains.find((group) => group.domain === activeDomain) || data.domains[0];
  }, [activeDomain, data]);

  if (loading) {
    return <div className="rounded-[1.6rem] border border-white/8 bg-white/[0.03] p-4 text-sm text-slate-300">Chargement des statistiques portuaires…</div>;
  }

  if (!data) {
    return <div className="rounded-[1.6rem] border border-white/8 bg-white/[0.03] p-4 text-sm text-slate-400">Les statistiques du port s’afficheront ici.</div>;
  }

  return (
    <div className="rounded-[1.6rem] border border-white/8 bg-white/[0.03] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.32em] text-cyan-200/70">Stats portuaires</p>
          <h3 className="mt-1 text-lg font-semibold text-white">Vue hebdo / annuelle</h3>
        </div>
        <div className="rounded-full border border-white/10 bg-slate-950/50 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-slate-300">
          {data.source === "supabase" ? "Supabase" : "Démo"}
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {[
          { title: "Semaine", metrics: data.overview.weekly },
          { title: "Année", metrics: data.overview.yearly },
        ].map((block) => (
          <div key={block.title} className="rounded-2xl border border-white/8 bg-slate-950/40 p-3">
            <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">{block.title}</p>
            <div className="mt-3 space-y-2">
              {block.metrics.slice(0, 4).map((metric) => (
                <div key={`${block.title}-${metric.key}`} className="flex items-center justify-between gap-3 rounded-2xl border border-white/6 bg-white/[0.02] px-3 py-2">
                  <div>
                    <p className="text-sm text-slate-200">{metric.label}</p>
                    {typeof metric.trend === "number" && (
                      <p className={clsx("mt-1 text-[11px] uppercase tracking-[0.2em]", metric.trend >= 0 ? "text-emerald-300" : "text-red-300")}>
                        {metric.trend >= 0 ? "+" : ""}
                        {metric.trend}% {metric.comparisonLabel || "variation"}
                      </p>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-white">{formatMetric(metric)}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {data.domains.length > 0 && (
        <>
          <div className="mt-4 flex flex-wrap gap-2">
            {data.domains.map((group) => {
              const selected = group.domain === activeGroup?.domain;
              return (
                <button
                  key={group.domain}
                  onClick={() => setActiveDomain(group.domain)}
                  className={clsx(
                    "rounded-full border px-3 py-2 text-xs transition",
                    selected
                      ? "border-cyan-300/25 bg-cyan-400/10 text-cyan-100"
                      : "border-white/10 bg-white/[0.03] text-slate-400 hover:border-cyan-300/15 hover:text-white"
                  )}
                >
                  {group.label}
                </button>
              );
            })}
          </div>

          {activeGroup && (
            <div className="mt-4 rounded-2xl border border-white/8 bg-slate-950/45 p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-white">{activeGroup.label}</p>
                <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Détail métier</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {activeGroup.metrics.slice(0, 6).map((metric) => (
                  <div key={metric.key} className="rounded-2xl border border-white/6 bg-white/[0.02] px-3 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{metric.label}</p>
                    <p className="mt-2 text-lg font-semibold text-white">{formatMetric(metric)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {data.notes.length > 0 && <p className="mt-4 text-xs leading-6 text-slate-500">{data.notes[0]}</p>}
    </div>
  );
}
