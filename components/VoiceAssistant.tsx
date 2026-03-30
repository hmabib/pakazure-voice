"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import {
  Activity,
  Bot,
  ChevronRight,
  DatabaseZap,
  Mic,
  MicOff,
  PhoneOff,
  Radar,
  Search,
  Send,
  Settings,
  Sparkles,
  Waves,
  Wrench,
} from "lucide-react";
import CamaraBotoAvatar from "./CamaraBotoAvatar";
import TranscriptPanel from "./TranscriptPanel";
import ToolsPanel from "./ToolsPanel";
import SettingsModal from "./SettingsModal";
import { useRealtimeSession } from "@/hooks/useRealtimeSession";
import { DEFAULT_TOOLS } from "@/lib/tools";
import { DEFAULT_SETTINGS } from "@/lib/types";
import type { Settings as SettingsType, Tool } from "@/lib/types";

const STATUS_LABELS: Record<string, { text: string; tone: string; chip: string }> = {
  idle: { text: "Système prêt. Lancez une session pour commencer.", tone: "text-slate-300", chip: "bg-slate-800 text-slate-300" },
  connecting: { text: "Ouverture du canal temps réel en cours.", tone: "text-amber-200", chip: "bg-amber-400/15 text-amber-100" },
  connected: { text: "Canal établi, attente d'instruction vocale ou texte.", tone: "text-cyan-100", chip: "bg-cyan-400/15 text-cyan-100" },
  listening: { text: "Capture micro active, le système écoute.", tone: "text-emerald-200", chip: "bg-emerald-400/15 text-emerald-100" },
  thinking: { text: "Analyse en cours et orchestration des outils.", tone: "text-amber-200", chip: "bg-amber-400/15 text-amber-100" },
  speaking: { text: "Réponse audio en cours de diffusion.", tone: "text-cyan-100", chip: "bg-cyan-400/15 text-cyan-100" },
  error: { text: "Incident détecté sur la session courante.", tone: "text-red-200", chip: "bg-red-400/15 text-red-100" },
  disconnected: { text: "Session arrêtée. Vous pouvez relancer immédiatement.", tone: "text-slate-400", chip: "bg-slate-800 text-slate-300" },
};

const actionCards = [
  {
    title: "Lancer analyse portuaire",
    description: "Prépare un point de situation opérations / escales / congestion.",
    icon: Radar,
    prompt: "Prépare un briefing portuaire opérationnel pour Kribi avec priorités et risques du jour.",
    tag: "Priorité 1",
  },
  {
    title: "Interroger Softis",
    description: "Ouvre un flux d'analyse métier via les données internes disponibles.",
    icon: DatabaseZap,
    prompt: "Analyse les données Softis disponibles et résume les points de décision opérationnels.",
    tag: "Décision",
  },
  {
    title: "Générer dataviz",
    description: "Crée un brief prêt pour une vue KPI ou tableau d'exploitation.",
    icon: Sparkles,
    prompt: "Génère une visualisation synthétique des KPI opérationnels prioritaires du jour.",
    tag: "Pilotage",
  },
  {
    title: "Veille web & météo",
    description: "Croise météo, web et contexte logistique avant décision.",
    icon: Search,
    prompt: "Croise météo et informations web utiles pour les opérations portuaires de Kribi aujourd'hui.",
    tag: "Contexte",
  },
];

const quickPrompts = [
  "Donne-moi un briefing météo pour Kribi",
  "Résume l'état opérationnel du port",
  "Quelles actions prioritaires aujourd'hui ?",
  "Prépare une synthèse logistique du jour",
];

function PakazureMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 shadow-[0_0_24px_rgba(34,211,238,0.15)]">
        <Bot size={20} className="text-cyan-200" />
      </div>
      <div>
        <p className="text-[11px] uppercase tracking-[0.42em] text-cyan-200/75">PAKAZURE Voice Ops</p>
        <h1 className="mt-1 text-lg font-semibold text-white sm:text-xl">Cockpit vocal opérationnel</h1>
      </div>
    </div>
  );
}

export default function VoiceAssistant() {
  const [settings, setSettings] = useState<SettingsType>({
    ...DEFAULT_SETTINGS,
    voice: "echo",
    systemPrompt:
      "Tu es Camara Boto, assistant IA premium de PAKAZURE pour le Port Autonome de Kribi. Tu réponds toujours en français, avec clarté, autorité calme et sens du service. Tu peux piloter des outils comme météo, recherche, dataviz, statut portuaire et futures APIs métier.",
  });
  const [tools, setTools] = useState<Tool[]>(DEFAULT_TOOLS);
  const [showTools, setShowTools] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [textInput, setTextInput] = useState("");
  const textRef = useRef<HTMLInputElement>(null);

  const { status, transcript, isMuted, volume, connect, disconnect, toggleMute, sendText, clearTranscript } =
    useRealtimeSession(settings, tools);

  const isConnected = ["connected", "listening", "thinking", "speaking"].includes(status);
  const isConnecting = status === "connecting";
  const statusInfo = STATUS_LABELS[status] || STATUS_LABELS.idle;
  const enabledTools = tools.filter((tool) => tool.enabled).length;

  const metrics = useMemo(
    () => [
      { label: "Session", value: isConnected ? "Active" : status === "error" ? "Erreur" : "Standby" },
      { label: "Volume", value: `${Math.round(Math.min(100, volume * 100))}%` },
      { label: "Messages", value: String(transcript.length).padStart(2, "0") },
      { label: "Outils actifs", value: `${enabledTools}/${tools.length}` },
    ],
    [enabledTools, isConnected, status, volume, transcript.length, tools.length]
  );

  const handleStartOrMute = () => {
    if (["idle", "disconnected", "error"].includes(status)) {
      connect();
      return;
    }

    if (isConnected) toggleMute();
  };

  const handleSendText = () => {
    if (!textInput.trim() || !isConnected) return;
    sendText(textInput.trim());
    setTextInput("");
  };

  const queuePrompt = (prompt: string) => {
    setTextInput(prompt);
    textRef.current?.focus();
  };

  const runPrimaryAction = () => {
    if (["idle", "disconnected", "error"].includes(status)) {
      connect();
      return;
    }

    queuePrompt("Prépare un briefing opérationnel priorisé du jour.");
  };

  const toggleTool = (name: string) => {
    setTools((prev) => prev.map((tool) => (tool.name === name ? { ...tool, enabled: !tool.enabled } : tool)));
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.code === "Escape") {
        setShowTools(false);
        setShowSettings(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="grid-bg relative min-h-screen bg-[linear-gradient(180deg,#030817_0%,#07101f_100%)] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.08),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(46,109,180,0.12),transparent_30%)]" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1560px] flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="panel-shell mb-4 flex flex-col gap-4 px-5 py-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-8">
            <PakazureMark />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {metrics.map((metric) => (
                <div key={metric.label} className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">{metric.label}</p>
                  <p className="mt-2 text-base font-semibold text-white">{metric.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className={clsx("rounded-full border px-4 py-2 text-xs uppercase tracking-[0.32em]", statusInfo.chip)}>{status}</div>
            <button
              onClick={() => setShowTools(true)}
              className="inline-flex items-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100 transition hover:border-cyan-300/40 hover:bg-cyan-400/15"
            >
              <Wrench size={16} />
              Outils
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:border-cyan-300/20 hover:text-white"
            >
              <Settings size={16} />
              Paramètres
            </button>
          </div>
        </header>

        <main className="grid flex-1 gap-4 xl:grid-cols-[minmax(0,1.35fr)_360px]">
          <section className="grid gap-4">
            <div className="panel-shell p-5 sm:p-6">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_320px] lg:items-start">
                <div>
                  <div className="mb-4 flex flex-wrap items-center gap-3">
                    <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.32em] text-cyan-100">
                      Centre de décision vocal
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.32em] text-slate-300">
                      Kribi node
                    </span>
                  </div>

                  <h2 className="max-w-3xl text-3xl font-semibold leading-tight text-white sm:text-4xl">
                    Faites du centre écran la zone d’action, d’analyse et de décision.
                  </h2>
                  <p className={clsx("mt-4 max-w-2xl text-sm leading-7 text-slate-400", statusInfo.tone)}>{statusInfo.text}</p>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <button
                      onClick={runPrimaryAction}
                      disabled={isConnecting}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-300/30 bg-cyan-400/15 px-6 py-4 text-sm font-medium text-cyan-50 transition hover:border-cyan-300/50 hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Mic size={18} />
                      {["idle", "disconnected", "error"].includes(status) ? "Démarrer session vocale" : "Préparer briefing prioritaire"}
                    </button>

                    <button
                      onClick={() => queuePrompt("Lance une analyse opérationnelle complète à partir du contexte disponible.")}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm text-slate-200 transition hover:border-cyan-300/20 hover:text-white"
                    >
                      <Activity size={18} />
                      Lancer analyse
                    </button>
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-white/8 bg-white/[0.03] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.32em] text-cyan-200/70">Canal session</p>
                      <p className="mt-1 text-sm text-slate-400">Pilotage immédiat du flux vocal</p>
                    </div>
                    {isMuted && isConnected && (
                      <span className="rounded-full bg-red-400/15 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-red-100">Micro coupé</span>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      onClick={handleStartOrMute}
                      disabled={isConnecting}
                      className={clsx(
                        "flex items-center justify-between rounded-2xl border px-4 py-4 text-left transition",
                        isConnecting && "cursor-not-allowed opacity-60",
                        isMuted && isConnected && "border-red-300/25 bg-red-400/10 text-red-100",
                        status === "listening" && "border-emerald-300/30 bg-emerald-400/12 text-emerald-100",
                        status === "speaking" && "border-cyan-300/30 bg-cyan-400/12 text-cyan-100",
                        (!isConnected || status === "connected" || status === "thinking") && !isMuted && "border-blue-300/20 bg-blue-400/10 text-blue-100"
                      )}
                    >
                      <div>
                        <p className="text-sm font-semibold">
                          {["idle", "disconnected", "error"].includes(status) ? "Ouvrir le canal" : isMuted ? "Réactiver le micro" : "Couper le micro"}
                        </p>
                        <p className="mt-1 text-xs text-slate-300/80">Action directe sur la session temps réel</p>
                      </div>
                      {isMuted || !isConnected ? <MicOff size={18} /> : <Mic size={18} />}
                    </button>

                    <button
                      onClick={disconnect}
                      disabled={!isConnected}
                      className="flex items-center justify-between rounded-2xl border border-red-300/15 bg-red-400/10 px-4 py-4 text-left text-red-100 transition disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <div>
                        <p className="text-sm font-semibold">Terminer la session</p>
                        <p className="mt-1 text-xs text-red-100/70">Arrêt propre du canal en cours</p>
                      </div>
                      <PhoneOff size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
              <div className="panel-shell p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.32em] text-cyan-200/70">Actions métier</p>
                    <h3 className="mt-2 text-xl font-semibold text-white">Modules prioritaires</h3>
                  </div>
                  <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-cyan-100">
                    Cliquables
                  </span>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {actionCards.map(({ title, description, icon: Icon, prompt, tag }) => (
                    <button
                      key={title}
                      onClick={() => queuePrompt(prompt)}
                      className="group rounded-[1.6rem] border border-white/8 bg-white/[0.03] p-4 text-left transition hover:border-cyan-300/25 hover:bg-cyan-400/[0.05]"
                    >
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div className="rounded-2xl border border-cyan-300/15 bg-slate-900/80 p-3">
                          <Icon size={18} className="text-cyan-200" />
                        </div>
                        <span className="rounded-full bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.28em] text-slate-300">{tag}</span>
                      </div>
                      <p className="text-sm font-semibold text-white">{title}</p>
                      <p className="mt-2 text-sm leading-relaxed text-slate-400">{description}</p>
                      <div className="mt-4 inline-flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-cyan-100/80">
                        Exécuter
                        <ChevronRight size={14} className="transition group-hover:translate-x-1" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="panel-shell p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.32em] text-cyan-200/70">Saisie rapide</p>
                    <h3 className="mt-2 text-lg font-semibold text-white">Prompt & envoi</h3>
                  </div>
                  <button
                    onClick={() => setShowTools(true)}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 transition hover:border-cyan-300/20 hover:text-white"
                  >
                    Configurer
                  </button>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-2 shadow-inner shadow-black/20">
                  <div className="flex flex-col gap-2">
                    <input
                      ref={textRef}
                      type="text"
                      value={textInput}
                      onChange={(event) => setTextInput(event.target.value)}
                      onKeyDown={(event) => event.key === "Enter" && handleSendText()}
                      placeholder="Tapez un ordre, une analyse ou un briefing..."
                      className="w-full bg-transparent px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none"
                    />
                    <button
                      onClick={handleSendText}
                      disabled={!textInput.trim() || !isConnected}
                      className="inline-flex items-center justify-center gap-2 rounded-[1rem] border border-cyan-300/20 bg-cyan-400/15 px-4 py-3 text-sm text-cyan-100 transition disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Send size={15} />
                      Envoyer à la session active
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {quickPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => queuePrompt(prompt)}
                      className="flex w-full items-center justify-between rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3 text-left text-sm text-slate-300 transition hover:border-cyan-300/20 hover:text-white"
                    >
                      <span>{prompt}</span>
                      <ChevronRight size={15} className="text-slate-500" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="panel-shell flex min-h-[360px] flex-col overflow-hidden">
              <TranscriptPanel transcript={transcript} onClear={clearTranscript} />
            </div>
          </section>

          <aside className="grid gap-4">
            <div className="panel-shell p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.32em] text-cyan-200/70">Avatar secondaire</p>
                  <h3 className="mt-2 text-lg font-semibold text-white">Camara Boto</h3>
                </div>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-slate-300">
                  Live
                </span>
              </div>
              <CamaraBotoAvatar status={status} volume={volume} compact />
            </div>

            <div className="panel-shell p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.32em] text-cyan-200/70">État outils</p>
                  <h3 className="mt-2 text-lg font-semibold text-white">Disponibilité</h3>
                </div>
                <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-emerald-100">
                  {enabledTools} actifs
                </span>
              </div>

              <div className="space-y-3">
                {tools.slice(0, 4).map((tool) => (
                  <button
                    key={tool.name}
                    onClick={() => toggleTool(tool.name)}
                    className="flex w-full items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-left transition hover:border-cyan-300/20"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">{tool.name.replace(/_/g, " ")}</p>
                      <p className="mt-1 text-xs text-slate-400">{tool.description}</p>
                    </div>
                    <span
                      className={clsx(
                        "ml-3 rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.24em]",
                        tool.enabled ? "bg-emerald-400/10 text-emerald-100" : "bg-slate-800 text-slate-400"
                      )}
                    >
                      {tool.enabled ? "ON" : "OFF"}
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500">Dataviz</p>
                  <p className="mt-2 text-xl font-semibold text-white">Ready</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500">Météo</p>
                  <p className="mt-2 text-xl font-semibold text-white">Live</p>
                </div>
              </div>
            </div>

            <div className="panel-shell p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.32em] text-cyan-200/70">Pilotage synthèse</p>
                  <h3 className="mt-2 text-lg font-semibold text-white">Signaux rapides</h3>
                </div>
                <Waves size={16} className="text-cyan-200" />
              </div>

              <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500">Canal</p>
                  <p className="mt-2 text-xl font-semibold text-white">{status}</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500">Dernier mode</p>
                  <p className="mt-2 text-xl font-semibold text-white">{isMuted ? "Muted" : "Ouvert"}</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500">Actions prêtes</p>
                  <p className="mt-2 text-xl font-semibold text-white">{actionCards.length}</p>
                </div>
              </div>
            </div>
          </aside>
        </main>
      </div>

      {showTools && (
        <>
          <button className="fixed inset-0 z-30 bg-slate-950/55 backdrop-blur-sm" onClick={() => setShowTools(false)} aria-label="Fermer le panneau outils" />
          <ToolsPanel tools={tools} onToggle={toggleTool} onClose={() => setShowTools(false)} />
        </>
      )}

      {showSettings && <SettingsModal settings={settings} onSave={setSettings} onClose={() => setShowSettings(false)} />}
    </div>
  );
}
