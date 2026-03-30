"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import {
  Activity,
  Bot,
  BrainCircuit,
  ChevronRight,
  Mic,
  MicOff,
  PhoneOff,
  Radar,
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
  idle: { text: "Prêt à ouvrir le canal vocal", tone: "text-slate-300", chip: "bg-slate-800 text-slate-300" },
  connecting: { text: "Négociation WebRTC en cours", tone: "text-amber-200", chip: "bg-amber-400/15 text-amber-100" },
  connected: { text: "Canal établi, en attente de votre voix", tone: "text-cyan-100", chip: "bg-cyan-400/15 text-cyan-100" },
  listening: { text: "Écoute active du microphone", tone: "text-emerald-200", chip: "bg-emerald-400/15 text-emerald-100" },
  thinking: { text: "Analyse et orchestration des réponses", tone: "text-amber-200", chip: "bg-amber-400/15 text-amber-100" },
  speaking: { text: "Camara Boto répond en temps réel", tone: "text-cyan-100", chip: "bg-cyan-400/15 text-cyan-100" },
  error: { text: "Incident détecté sur la session", tone: "text-red-200", chip: "bg-red-400/15 text-red-100" },
  disconnected: { text: "Session fermée proprement", tone: "text-slate-400", chip: "bg-slate-800 text-slate-300" },
};

const actionCards = [
  { title: "Softis Ops", value: "Slot UI", description: "Zone prête pour actions métier, workflows et formulaires.", icon: BrainCircuit },
  { title: "Gemini Dataviz", value: "Preview", description: "Panneau de visualisation / synthèse graphique déjà intégré.", icon: Sparkles },
  { title: "Port status", value: "Live-ready", description: "Emplacement pour statut navires, escales et opérations.", icon: Radar },
  { title: "Weather / Search", value: "Native", description: "Outils temps réel pilotés par l’assistant vocal.", icon: Waves },
];

const quickPrompts = [
  "Donne-moi un briefing météo pour Kribi",
  "Prépare un point de situation portuaire",
  "Résume les actions disponibles aujourd’hui",
  "Fais une synthèse logistique du jour",
];

function PakazureMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 shadow-[0_0_24px_rgba(34,211,238,0.15)]">
        <Bot size={20} className="text-cyan-200" />
      </div>
      <div>
        <p className="text-[11px] uppercase tracking-[0.42em] text-cyan-200/75">PAKAZURE Voice OS</p>
        <h1 className="mt-1 text-lg font-semibold text-white sm:text-xl">Console futuriste • Camara Boto</h1>
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

  const metrics = useMemo(
    () => [
      { label: "Session", value: isConnected ? "Active" : status === "error" ? "Erreur" : "Standby" },
      { label: "Volume", value: `${Math.round(Math.min(100, volume * 100))}%` },
      { label: "Transcript", value: String(transcript.length).padStart(2, "0") },
      { label: "Tools", value: `${tools.filter((tool) => tool.enabled).length}/${tools.length}` },
    ],
    [isConnected, status, volume, transcript.length, tools]
  );

  const handleMicClick = () => {
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
    <div className="grid-bg relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.08),transparent_28%),linear-gradient(180deg,#020817_0%,#061022_52%,#020617_100%)] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(59,130,246,0.08),transparent_25%),radial-gradient(circle_at_85%_18%,rgba(34,211,238,0.08),transparent_22%),radial-gradient(circle_at_50%_100%,rgba(59,130,246,0.08),transparent_35%)]" />
      <div className="pointer-events-none absolute inset-0 circuit-overlay opacity-60" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1600px] flex-col px-4 py-4 sm:px-6 lg:px-8">
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
            <div className={clsx("rounded-full border px-4 py-2 text-xs uppercase tracking-[0.32em]", statusInfo.chip)}>
              {status}
            </div>
            <button onClick={() => setShowTools(true)} className="inline-flex items-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100 transition hover:border-cyan-300/40 hover:bg-cyan-400/15">
              <Wrench size={16} />
              Outils
            </button>
            <button onClick={() => setShowSettings(true)} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:border-cyan-300/20 hover:text-white">
              <Settings size={16} />
              Paramètres
            </button>
          </div>
        </header>

        <main className="grid flex-1 gap-4 xl:grid-cols-[320px_minmax(0,1fr)_360px]">
          <section className="panel-shell order-2 flex flex-col gap-4 p-4 xl:order-1">
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-cyan-200/70">Actions cockpit</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Opérations & outils</h2>
            </div>

            <div className="grid gap-3">
              {actionCards.map(({ title, value, description, icon: Icon }) => (
                <div key={title} className="rounded-3xl border border-white/8 bg-white/[0.03] p-4 transition hover:border-cyan-300/20 hover:bg-cyan-400/[0.04]">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="rounded-2xl border border-cyan-300/15 bg-slate-900/80 p-2.5">
                      <Icon size={18} className="text-cyan-200" />
                    </div>
                    <span className="rounded-full bg-cyan-400/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.28em] text-cyan-100">{value}</span>
                  </div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{description}</p>
                </div>
              ))}
            </div>

            <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
              <div className="mb-3 flex items-center gap-2">
                <Activity size={16} className="text-cyan-200" />
                <p className="text-sm font-medium text-white">Prompts rapides</p>
              </div>
              <div className="space-y-2">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => {
                      setTextInput(prompt);
                      textRef.current?.focus();
                    }}
                    className="flex w-full items-center justify-between rounded-2xl border border-white/8 bg-slate-900/50 px-4 py-3 text-left text-sm text-slate-300 transition hover:border-cyan-300/20 hover:text-white"
                  >
                    <span>{prompt}</span>
                    <ChevronRight size={15} className="text-slate-500" />
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="panel-shell order-1 flex min-h-[620px] flex-col justify-between p-4 sm:p-6 xl:order-2">
            <div className="flex flex-col items-center">
              <div className="mb-5 text-center">
                <p className="text-[11px] uppercase tracking-[0.38em] text-cyan-200/70">Realtime avatar core</p>
                <h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">Centre de commande vocal PAKAZURE</h2>
                <p className={clsx("mt-3 max-w-2xl text-sm leading-relaxed text-slate-400", statusInfo.tone)}>{statusInfo.text}</p>
              </div>

              <CamaraBotoAvatar status={status} volume={volume} />
            </div>

            <div className="mt-6 grid gap-4">
              <div className="rounded-[2rem] border border-cyan-300/15 bg-cyan-400/[0.05] p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.32em] text-cyan-200/75">Voice console</p>
                    <p className="mt-1 text-sm text-slate-300">Pilotage micro, saisie texte et statut de session</p>
                  </div>
                  {isMuted && isConnected && (
                    <span className="rounded-full bg-red-400/15 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-red-100">Micro coupé</span>
                  )}
                </div>

                <div className="flex flex-col gap-3 lg:flex-row">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleMicClick}
                      disabled={isConnecting}
                      className={clsx(
                        "relative flex h-16 w-16 items-center justify-center rounded-full border transition duration-300",
                        isConnecting && "cursor-not-allowed opacity-60",
                        isMuted && isConnected && "border-red-300/30 bg-red-400/15 text-red-100",
                        status === "listening" && "border-emerald-300/40 bg-emerald-400/15 text-emerald-100 shadow-[0_0_40px_rgba(16,185,129,0.16)]",
                        status === "speaking" && "border-cyan-300/40 bg-cyan-400/15 text-cyan-100 shadow-[0_0_40px_rgba(34,211,238,0.16)]",
                        (!isConnected || status === "connected" || status === "thinking") && !isMuted && "border-blue-300/25 bg-blue-400/10 text-blue-100"
                      )}
                    >
                      {isMuted || !isConnected ? <MicOff size={24} /> : <Mic size={24} />}
                    </button>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowTools(true)}
                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:border-cyan-300/20 hover:text-white"
                      >
                        Tools
                      </button>
                      <button
                        onClick={disconnect}
                        disabled={!isConnected}
                        className="rounded-2xl border border-red-300/15 bg-red-400/10 px-4 py-3 text-sm text-red-100 transition disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <span className="inline-flex items-center gap-2"><PhoneOff size={15} /> Fin</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex rounded-[1.4rem] border border-white/10 bg-slate-950/70 p-1.5 shadow-inner shadow-black/20">
                      <input
                        ref={textRef}
                        type="text"
                        value={textInput}
                        onChange={(event) => setTextInput(event.target.value)}
                        onKeyDown={(event) => event.key === "Enter" && handleSendText()}
                        placeholder="Tapez une instruction, une requête ou un briefing..."
                        className="flex-1 bg-transparent px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none"
                      />
                      <button
                        onClick={handleSendText}
                        disabled={!textInput.trim() || !isConnected}
                        className="inline-flex items-center gap-2 rounded-[1rem] border border-cyan-300/20 bg-cyan-400/15 px-4 py-3 text-sm text-cyan-100 transition disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Send size={15} />
                        Envoyer
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="order-3 grid gap-4 xl:grid-rows-[280px_minmax(0,1fr)]">
            <div className="panel-shell p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.32em] text-cyan-200/70">Dataviz preview</p>
                  <h2 className="mt-2 text-lg font-semibold text-white">Visualisation opérationnelle</h2>
                </div>
                <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-cyan-100">Gemini-ready</span>
              </div>

              <div className="viz-panel relative overflow-hidden rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(6,10,20,0.8),rgba(9,16,30,0.95))] p-4">
                <div className="grid grid-cols-8 gap-2">
                  {Array.from({ length: 24 }).map((_, index) => (
                    <div key={index} className="rounded-full bg-cyan-300/80" style={{ height: `${18 + ((index * 17) % 70)}px`, opacity: 0.28 + (index % 5) * 0.12 }} />
                  ))}
                </div>
                <div className="mt-5 grid grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                    <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500">Flux</p>
                    <p className="mt-2 text-xl font-semibold text-white">87%</p>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                    <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500">ETA</p>
                    <p className="mt-2 text-xl font-semibold text-white">+12m</p>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                    <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500">Node</p>
                    <p className="mt-2 text-xl font-semibold text-white">KRB</p>
                  </div>
                </div>
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_36%)]" />
              </div>
            </div>

            <div className="panel-shell flex min-h-[360px] flex-col overflow-hidden">
              <TranscriptPanel transcript={transcript} onClear={clearTranscript} />
            </div>
          </section>
        </main>
      </div>

      {showTools && (
        <>
          <button className="fixed inset-0 z-30 bg-slate-950/50 backdrop-blur-sm" onClick={() => setShowTools(false)} aria-label="Fermer le panneau outils" />
          <ToolsPanel tools={tools} onToggle={toggleTool} onClose={() => setShowTools(false)} />
        </>
      )}

      {showSettings && (
        <SettingsModal settings={settings} onSave={setSettings} onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}
