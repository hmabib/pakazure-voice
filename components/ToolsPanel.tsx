"use client";

import clsx from "clsx";
import { Cpu, DatabaseZap, Radar, Search, Sparkles, Waves, X } from "lucide-react";
import type { Tool } from "@/lib/types";

interface Props {
  tools: Tool[];
  onToggle: (name: string) => void;
  onClose: () => void;
}

const futureIntegrations = [
  { name: "Softis Ops", icon: DatabaseZap, status: "À brancher", tone: "text-cyan-200" },
  { name: "Gemini Dataviz", icon: Sparkles, status: "Preview UI prêt", tone: "text-sky-200" },
  { name: "Météo & route", icon: Waves, status: "Tool natif", tone: "text-emerald-200" },
  { name: "Recherche stratégique", icon: Search, status: "Tool natif", tone: "text-violet-200" },
  { name: "Port status / CAMCIS", icon: Radar, status: "Connecteur futur", tone: "text-amber-200" },
  { name: "Agents & actions", icon: Cpu, status: "Architecture prête", tone: "text-blue-200" },
];

export default function ToolsPanel({ tools, onToggle, onClose }: Props) {
  const enabledCount = tools.filter((tool) => tool.enabled).length;

  return (
    <div className="slide-in-right fixed right-0 top-0 z-40 flex h-full w-full max-w-md flex-col border-l border-cyan-300/15 bg-slate-950/92 backdrop-blur-2xl shadow-[0_0_60px_rgba(8,15,34,0.8)]">
      <div className="border-b border-white/10 px-5 py-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.38em] text-cyan-200/75">Action center</p>
            <h2 className="mt-2 text-xl font-semibold text-white">Panneau outils & intégrations</h2>
          </div>
          <button onClick={onClose} className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-400 transition hover:border-cyan-300/30 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="rounded-2xl border border-cyan-300/15 bg-cyan-400/5 p-3">
            <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">Actifs</p>
            <p className="mt-1 text-2xl font-semibold text-white">{enabledCount}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">Registry</p>
            <p className="mt-1 text-2xl font-semibold text-white">{tools.length}</p>
          </div>
          <div className="rounded-2xl border border-emerald-300/10 bg-emerald-400/5 p-3">
            <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">Mode</p>
            <p className="mt-1 text-sm font-semibold text-emerald-200">Ready</p>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium text-white">Outils temps réel</h3>
            <span className="text-[10px] uppercase tracking-[0.28em] text-slate-500">live toggles</span>
          </div>

          <div className="space-y-3">
            {tools.map((tool) => (
              <div key={tool.name} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 transition hover:border-cyan-300/20 hover:bg-cyan-400/[0.04]">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/15 bg-slate-900/80 text-xl">
                    {tool.icon || "🔧"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {tool.name.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-slate-400">{tool.description}</p>
                      </div>
                      <button
                        onClick={() => onToggle(tool.name)}
                        className={clsx(
                          "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition",
                          tool.enabled
                            ? "border-cyan-300/30 bg-cyan-400/20"
                            : "border-white/10 bg-slate-800"
                        )}
                      >
                        <span
                          className={clsx(
                            "inline-block h-5 w-5 rounded-full bg-white shadow transition-transform",
                            tool.enabled ? "translate-x-6" : "translate-x-1"
                          )}
                        />
                      </button>
                    </div>

                    <div className="mt-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.24em]">
                      <span className={clsx("rounded-full px-2 py-1", tool.enabled ? "bg-emerald-400/10 text-emerald-200" : "bg-slate-800 text-slate-400")}>
                        {tool.enabled ? "Actif" : "Off"}
                      </span>
                      <span className="text-slate-500">tool-choice auto</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium text-white">Connecteurs prévus</h3>
            <span className="text-[10px] uppercase tracking-[0.28em] text-slate-500">api slots</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {futureIntegrations.map(({ name, icon: Icon, status, tone }) => (
              <div key={name} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl border border-cyan-300/15 bg-slate-900/80 p-2.5">
                    <Icon size={18} className={tone} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{name}</p>
                    <p className="text-xs text-slate-400">{status}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="border-t border-white/10 px-5 py-4 text-xs leading-relaxed text-slate-400">
        Le panneau est déjà structuré pour accueillir des actions métier, des outils temps réel et des APIs externes sans casser la compatibilité Next.js / Vercel.
      </div>
    </div>
  );
}
