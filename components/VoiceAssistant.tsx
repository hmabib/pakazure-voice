"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import {
  Activity,
  Camera,
  ChevronRight,
  LineChart,
  Menu,
  Mic,
  MicOff,
  PhoneOff,
  Send,
  Settings,
  Sparkles,
  Waves,
  X,
} from "lucide-react";
import CamaraBotoAvatar from "./CamaraBotoAvatar";
import TranscriptPanel from "./TranscriptPanel";
import ToolsPanel from "./ToolsPanel";
import SettingsModal from "./SettingsModal";
import DatavizPanel from "./DatavizPanel";
import PortStatsPanel from "./PortStatsPanel";
import { useRealtimeSession } from "@/hooks/useRealtimeSession";
import { DEFAULT_TOOLS } from "@/lib/tools";
import { DEFAULT_SETTINGS } from "@/lib/types";
import type { PortDashboardPayload, Settings as SettingsType, Tool } from "@/lib/types";

const STATUS_LABELS: Record<string, { text: string; chip: string }> = {
  idle: { text: "Système prêt. Lancez une session pour commencer.", chip: "bg-slate-900/80 text-slate-300 border-white/10" },
  connecting: { text: "Ouverture du canal temps réel en cours.", chip: "bg-amber-400/10 text-amber-100 border-amber-300/20" },
  connected: { text: "Canal établi, en attente d'instruction vocale ou texte.", chip: "bg-cyan-400/10 text-cyan-100 border-cyan-300/20" },
  listening: { text: "Camara Boto écoute votre demande.", chip: "bg-emerald-400/10 text-emerald-100 border-emerald-300/20" },
  thinking: { text: "Analyse et orchestration en cours.", chip: "bg-amber-400/10 text-amber-100 border-amber-300/20" },
  speaking: { text: "Réponse audio en diffusion.", chip: "bg-cyan-400/10 text-cyan-100 border-cyan-300/20" },
  error: { text: "Incident détecté sur la session courante.", chip: "bg-red-400/10 text-red-100 border-red-300/20" },
  disconnected: { text: "Session arrêtée. Relancez quand vous voulez.", chip: "bg-slate-900/80 text-slate-300 border-white/10" },
};

const quickPrompts = [
  "Prépare un briefing opérationnel priorisé du jour.",
  "Donne-moi un briefing météo pour Kribi.",
  "Résume l'état opérationnel du port.",
  "Quelles actions prioritaires aujourd'hui ?",
];

function PakazureMark() {
  return (
    <div className="flex min-w-0 items-center gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://static.wixstatic.com/media/ccfac3_e82eb7f271cb42709c78ae85c0aaf01f~mv2.jpg/v1/fill/w_144,h_122,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/PAKAZURE_JPG.jpg"
        alt="PAKAZURE"
        className="h-11 w-11 shrink-0 rounded-2xl border border-cyan-300/20 object-cover shadow-[0_0_24px_rgba(34,211,238,0.12)]"
      />
      <div className="min-w-0">
        <p className="truncate text-[11px] uppercase tracking-[0.32em] text-cyan-200/75 sm:tracking-[0.42em]">PAKAZURE Voice Ops</p>
        <h1 className="mt-1 truncate text-base font-semibold text-white sm:text-xl">Camara Boto</h1>
      </div>
    </div>
  );
}

function SideSheet({
  open,
  onClose,
  title,
  subtitle,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <>
      <button className="fixed inset-0 z-30 bg-slate-950/55 backdrop-blur-sm" onClick={onClose} aria-label="Fermer" />
      <div className="slide-in-right fixed inset-y-0 right-0 z-40 flex h-full w-full max-w-full flex-col border-l border-white/10 bg-slate-950/96 shadow-[0_0_60px_rgba(8,15,34,0.75)] sm:max-w-xl xl:max-w-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-5 sm:py-5">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/70 sm:tracking-[0.34em]">PAKAZURE panel</p>
            <h2 className="mt-2 truncate text-lg font-semibold text-white sm:text-xl">{title}</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-400">{subtitle}</p>
          </div>
          <button onClick={onClose} className="shrink-0 rounded-2xl border border-white/10 bg-white/5 p-2 text-slate-400 transition hover:border-cyan-300/20 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-hidden p-4 sm:p-5">{children}</div>
      </div>
    </>
  );
}

function VideoPreviewCard({
  stream,
  mirrored,
  cameraError,
}: {
  stream: MediaStream | null;
  mirrored: boolean;
  cameraError: string | null;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="panel-shell flex min-h-[220px] w-full flex-col overflow-hidden rounded-[1.75rem] p-4 sm:min-h-[260px]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/70">Mode vision</p>
          <h3 className="mt-2 text-sm font-semibold text-white sm:text-base">Webcam active</h3>
        </div>
        <span className="rounded-full border border-white/10 bg-slate-950/60 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-slate-300">
          {stream ? "Live" : "En attente"}
        </span>
      </div>

      <div className="mt-4 flex-1 overflow-hidden rounded-2xl border border-white/8 bg-slate-950/60">
        {stream ? (
          <video ref={videoRef} autoPlay playsInline muted className={clsx("h-full min-h-[160px] w-full object-cover", mirrored && "scale-x-[-1]")} />
        ) : (
          <div className="flex h-full min-h-[160px] items-center justify-center px-4 text-center text-sm leading-6 text-slate-400">
            La webcam sera visible ici quand l’option est activée et que l’accès caméra est accordé.
          </div>
        )}
      </div>

      {cameraError && (
        <div className="mt-4 rounded-2xl border border-red-300/12 bg-red-400/[0.05] px-3 py-3 text-xs leading-6 text-red-100">
          <p className="break-words">{cameraError}</p>
        </div>
      )}
    </div>
  );
}

export default function VoiceAssistant() {
  const [settings, setSettings] = useState<SettingsType>({
    ...DEFAULT_SETTINGS,
    voice: "echo",
    systemPrompt:
      "Tu es Camara Boto, la voix opérationnelle de PAKAZURE pour le Port Autonome de Kribi. Tu réponds toujours en français, de manière naturelle, directe, calme et utile. Va droit au point, puis développe seulement si nécessaire. Si l'utilisateur pose une question sur les statistiques portuaires, utilise les informations disponibles des routes API stats portuaires pour répondre naturellement. Si l'utilisateur évoque Softis, utilise query_softis. Si l'utilisateur demande une visualisation, utilise generate_gemini_dataviz puis décris clairement ce qu'elle montre. Si une recherche web est utile, utilise search_web. Ton rôle est d'aider à décider, expliquer et synthétiser sans jargon inutile.",
  });
  const [tools, setTools] = useState<Tool[]>(DEFAULT_TOOLS);
  const [showTools, setShowTools] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCommandCenter, setShowCommandCenter] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [showPortStats, setShowPortStats] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [vizLoading, setVizLoading] = useState(false);
  const [vizData, setVizData] = useState<Record<string, unknown> | null>(null);
  const [portStats, setPortStats] = useState<PortDashboardPayload | null>(null);
  const [portStatsLoading, setPortStatsLoading] = useState(true);
  const textRef = useRef<HTMLInputElement>(null);

  const {
    status,
    transcript,
    isMuted,
    volume,
    connect,
    disconnect,
    toggleMute,
    sendText,
    clearTranscript,
    localVideoStream,
    cameraError,
  } = useRealtimeSession(settings, tools);

  const isConnected = ["connected", "listening", "thinking", "speaking"].includes(status);
  const isConnecting = status === "connecting";
  const statusInfo = STATUS_LABELS[status] || STATUS_LABELS.idle;
  const lastTranscript = transcript.at(-1);
  const isVisionMode = settings.realtimeVideo.enabled;
  const showVideoCard = isVisionMode || Boolean(localVideoStream) || Boolean(cameraError);
  const experienceModeLabel = isVisionMode ? "Mode vision" : "Mode voix";
  const experienceHeadline = isVisionMode ? "Camara Boto voit, écoute et guide l’action." : "Camara Boto écoute, répond et guide l’action.";
  const experienceDescription = isVisionMode
    ? localVideoStream
      ? "La webcam est prête. Vous pouvez parler ou montrer ce qu’il faut analyser."
      : "Activez la session puis autorisez la caméra pour passer en expérience vision."
    : statusInfo.text;

  const metrics = useMemo(
    () => [
      { label: "Mode", value: isVisionMode ? "Vision" : "Voix" },
      { label: "Session", value: isConnected ? "Active" : status === "error" ? "Erreur" : "Standby" },
      { label: "Volume", value: `${Math.round(Math.min(100, volume * 100))}%` },
      { label: "Messages", value: String(transcript.length).padStart(2, "0") },
      ...(isVisionMode
        ? [
            {
              label: "Caméra",
              value: localVideoStream ? "Active" : cameraError ? "Indisponible" : "Prête",
            },
          ]
        : []),
    ],
    [cameraError, isConnected, isVisionMode, localVideoStream, status, transcript.length, volume]
  );

  useEffect(() => {
    let cancelled = false;

    const loadPortStats = async () => {
      setPortStatsLoading(true);
      try {
        const response = await fetch("/api/port-stats/dashboard", { cache: "no-store" });
        if (!response.ok) throw new Error("Impossible de charger les stats portuaires");
        const payload = (await response.json()) as PortDashboardPayload;
        if (!cancelled) setPortStats(payload);
      } catch {
        if (!cancelled) setPortStats(null);
      } finally {
        if (!cancelled) setPortStatsLoading(false);
      }
    };

    loadPortStats();
    const interval = window.setInterval(loadPortStats, 120000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const handlePrimaryAction = () => {
    if (["idle", "disconnected", "error"].includes(status)) {
      connect();
      return;
    }

    if (isConnected && isMuted) {
      toggleMute();
      return;
    }

    sendText("Prépare un briefing opérationnel priorisé du jour.");
  };

  const handleSendText = () => {
    if (!textInput.trim() || !isConnected) return;
    sendText(textInput.trim());
    setTextInput("");
  };

  const queuePrompt = (prompt: string) => {
    setTextInput(prompt);
    setShowCommandCenter(false);
    setTimeout(() => textRef.current?.focus(), 0);
  };

  const runDataviz = async (prompt: string) => {
    setVizLoading(true);
    setShowCommandCenter(false);
    setShowInsights(true);
    try {
      const res = await fetch("/api/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "generate_gemini_dataviz", args: { prompt } }),
      });
      const data = await res.json();
      setVizData((data?.result?.visualization || null) as Record<string, unknown> | null);
      if (isConnected) {
        sendText(`J'ai généré une dataviz pour: ${prompt}. Résume-la, explique les points clés et relie-la au contexte opérationnel.`);
      }
    } catch {
      setVizData({
        title: "Dataviz indisponible",
        summary: "La génération Gemini a échoué ou n'est pas encore configurée.",
        chartType: "Fallback",
        series: [],
        insight: "Ajoute GEMINI_API_KEY dans Vercel pour activer cette fonction.",
      });
    } finally {
      setVizLoading(false);
    }
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
        setShowCommandCenter(false);
        setShowTranscript(false);
        setShowInsights(false);
        setShowPortStats(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="grid-bg relative min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,#020611_0%,#06101f_62%,#071424_100%)] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(79,226,255,0.08),transparent_24%),radial-gradient(circle_at_50%_55%,rgba(46,109,180,0.10),transparent_38%),radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.03),transparent_18%)]" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1480px] flex-col px-3 py-3 sm:px-6 sm:py-6 lg:px-8">
        <header className="panel-shell flex flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <PakazureMark />

          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            <div className={clsx("hidden rounded-full border px-3 py-2 text-[11px] uppercase tracking-[0.28em] md:inline-flex", statusInfo.chip)}>{status}</div>
            <button
              onClick={() => setShowTranscript(true)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-300 transition hover:border-cyan-300/20 hover:text-white"
              aria-label="Ouvrir le journal"
            >
              <Waves size={17} />
            </button>
            <button
              onClick={() => setShowPortStats(true)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-300 transition hover:border-cyan-300/20 hover:text-white"
              aria-label="Ouvrir les stats portuaires"
            >
              <LineChart size={17} />
            </button>
            <button
              onClick={() => setShowCommandCenter(true)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-100 transition hover:border-cyan-300/35"
              aria-label="Ouvrir le centre de commande"
            >
              <Menu size={18} />
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-300 transition hover:border-cyan-300/20 hover:text-white"
              aria-label="Ouvrir les paramètres"
            >
              <Settings size={17} />
            </button>
          </div>
        </header>

        <main className="flex flex-1 items-start justify-center py-3 sm:py-5">
          <section className="panel-shell w-full overflow-hidden px-4 py-5 sm:px-6 sm:py-8 lg:px-8 xl:px-10">
            <div className={clsx("grid gap-6 xl:gap-8", showVideoCard ? "xl:grid-cols-[minmax(0,1fr)_minmax(320px,380px)]" : "")}>
              <div className="min-w-0">
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,420px)] lg:items-center">
                  <div className="min-w-0 flex flex-col items-center text-center lg:items-start lg:text-left">
                    <div className="mb-4 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                      {metrics.map((metric) => (
                        <span
                          key={metric.label}
                          className="max-w-full rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-300 sm:tracking-[0.24em]"
                        >
                          <span className="break-words">{metric.label} · {metric.value}</span>
                        </span>
                      ))}
                    </div>

                    <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-400/[0.06] px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-cyan-100">
                      <Camera size={14} />
                      {experienceModeLabel}
                    </div>

                    <h2 className="mt-4 max-w-2xl text-2xl font-semibold leading-tight text-white sm:text-4xl">
                      {experienceHeadline}
                    </h2>
                    <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400">{experienceDescription}</p>

                    <div className="mt-6 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
                      <button
                        onClick={handlePrimaryAction}
                        disabled={isConnecting}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-300/25 bg-cyan-400/12 px-6 py-4 text-sm font-medium text-cyan-50 transition hover:border-cyan-300/45 hover:bg-cyan-400/18 disabled:cursor-not-allowed disabled:opacity-55"
                      >
                        {isConnected && !isMuted ? <Mic size={18} /> : <MicOff size={18} />}
                        {["idle", "disconnected", "error"].includes(status)
                          ? "Démarrer la session"
                          : isMuted
                          ? "Réactiver le micro"
                          : "Demander un briefing"}
                      </button>

                      <button
                        onClick={() => setShowInsights(true)}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm text-slate-200 transition hover:border-cyan-300/20 hover:text-white"
                      >
                        <Sparkles size={18} />
                        Dataviz
                      </button>

                      <button
                        onClick={() => setShowPortStats(true)}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm text-slate-200 transition hover:border-cyan-300/20 hover:text-white"
                      >
                        <LineChart size={18} />
                        Stats portuaires
                      </button>

                      {isConnected && (
                        <button
                          onClick={disconnect}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm text-slate-200 transition hover:border-red-300/20 hover:text-red-100"
                        >
                          <PhoneOff size={18} />
                          Arrêter
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="min-w-0 flex justify-center lg:justify-end">
                    <CamaraBotoAvatar
                      status={status}
                      volume={volume}
                      avatarSettings={settings.avatar}
                      transcriptText={lastTranscript?.text}
                    />
                  </div>
                </div>

                {isConnected && (
                  <div className="mt-5 w-full max-w-4xl">
                    <div className="flex flex-col gap-2 rounded-2xl border border-white/8 bg-slate-950/55 p-2 sm:flex-row">
                      <input
                        ref={textRef}
                        type="text"
                        value={textInput}
                        onChange={(event) => setTextInput(event.target.value)}
                        onKeyDown={(event) => event.key === "Enter" && handleSendText()}
                        placeholder="Ex: utilise Softis pour analyser les imports de la semaine"
                        className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-slate-600"
                      />
                      <button
                        onClick={handleSendText}
                        disabled={!textInput.trim() || !isConnected}
                        className="rounded-2xl border border-cyan-300/25 bg-cyan-400/10 px-4 py-3 text-cyan-100 transition hover:border-cyan-300/40 disabled:opacity-30"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-6 grid gap-3 lg:grid-cols-2">
                  <button
                    onClick={() => runDataviz("Génère une dataviz PAKAZURE sur les KPI opérationnels prioritaires du jour.")}
                    className="rounded-3xl border border-white/8 bg-white/[0.03] p-4 text-left transition hover:border-cyan-300/20"
                  >
                    <div className="mb-3 inline-flex rounded-2xl border border-cyan-300/15 bg-cyan-400/10 p-2.5 text-cyan-100">
                      <Sparkles size={18} />
                    </div>
                    <p className="text-sm font-semibold text-white">Session dataviz</p>
                    <p className="mt-2 break-words text-sm text-slate-400">Ouvrir la visualisation et générer un point clé en un clic.</p>
                  </button>

                  <button
                    onClick={() => setShowPortStats(true)}
                    className="rounded-3xl border border-white/8 bg-white/[0.03] p-4 text-left transition hover:border-cyan-300/20"
                  >
                    <div className="mb-3 inline-flex rounded-2xl border border-cyan-300/15 bg-cyan-400/10 p-2.5 text-cyan-100">
                      <LineChart size={18} />
                    </div>
                    <p className="text-sm font-semibold text-white">Lecture stats portuaires</p>
                    <p className="mt-2 break-words text-sm text-slate-400">Retrouver la vue hebdo, l’année et les détails métier sans quitter l’écran principal.</p>
                  </button>
                </div>
              </div>

              {showVideoCard && (
                <div className="min-w-0 xl:sticky xl:top-0 xl:self-start">
                  <VideoPreviewCard
                    stream={localVideoStream}
                    mirrored={settings.realtimeVideo.previewMirrored}
                    cameraError={cameraError}
                  />
                </div>
              )}
            </div>
          </section>
        </main>
      </div>

      {showTools && (
        <>
          <div className="fixed inset-0 z-30 bg-slate-950/40" onClick={() => setShowTools(false)} />
          <ToolsPanel tools={tools} onToggle={toggleTool} onClose={() => setShowTools(false)} />
        </>
      )}

      {showSettings && <SettingsModal settings={settings} onSave={setSettings} onClose={() => setShowSettings(false)} />}

      <SideSheet open={showCommandCenter} onClose={() => setShowCommandCenter(false)} title="Centre de commande" subtitle="Prompts rapides, visualisations et accès assistant">
        <div className="h-full overflow-y-auto pr-1">
          <div className="space-y-4">
            <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
              <p className="text-sm font-medium text-white">Prompts rapides</p>
              <div className="mt-3 grid gap-2">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => queuePrompt(prompt)}
                    className="flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-white/8 bg-slate-950/40 px-4 py-3 text-left text-sm text-slate-300 transition hover:border-cyan-300/20 hover:text-white"
                  >
                    <span className="min-w-0 break-words">{prompt}</span>
                    <ChevronRight size={15} className="shrink-0 text-slate-500" />
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                onClick={() => runDataviz("Génère une dataviz PAKAZURE sur les KPI opérationnels prioritaires du jour.")}
                className="rounded-3xl border border-white/8 bg-white/[0.03] p-4 text-left transition hover:border-cyan-300/20"
              >
                <div className="mb-3 inline-flex rounded-2xl border border-cyan-300/15 bg-cyan-400/10 p-2.5 text-cyan-100">
                  <Sparkles size={18} />
                </div>
                <p className="text-sm font-semibold text-white">Générer une dataviz</p>
                <p className="mt-2 break-words text-sm text-slate-400">Créer une vue graphique et l’expliquer naturellement.</p>
              </button>

              <button
                onClick={() => setShowTools(true)}
                className="rounded-3xl border border-white/8 bg-white/[0.03] p-4 text-left transition hover:border-cyan-300/20"
              >
                <div className="mb-3 inline-flex rounded-2xl border border-cyan-300/15 bg-cyan-400/10 p-2.5 text-cyan-100">
                  <Activity size={18} />
                </div>
                <p className="text-sm font-semibold text-white">Outils & actions</p>
                <p className="mt-2 break-words text-sm text-slate-400">Activer Softis, recherche web et autres modules métier.</p>
              </button>
            </div>
          </div>
        </div>
      </SideSheet>

      <SideSheet open={showTranscript} onClose={() => setShowTranscript(false)} title="Journal de session" subtitle="Transcript vocal, texte et appels outils">
        <div className="h-full overflow-hidden rounded-2xl border border-white/8 bg-slate-950/45">
          <TranscriptPanel transcript={transcript} onClear={clearTranscript} />
        </div>
      </SideSheet>

      <SideSheet open={showInsights} onClose={() => setShowInsights(false)} title="Visualisation & insights" subtitle="Lecture PAKAZURE des KPI générés à la demande">
        <div className="h-full overflow-y-auto pr-1">
          <DatavizPanel data={vizData as { title?: string; summary?: string; chartType?: string; series?: { label: string; value: number }[]; insight?: string } | null} loading={vizLoading} />
        </div>
      </SideSheet>

      <SideSheet open={showPortStats} onClose={() => setShowPortStats(false)} title="Stats portuaires" subtitle="Vue hebdo, annuelle et détails métier à la demande">
        <div className="h-full overflow-y-auto pr-1">
          <PortStatsPanel data={portStats} loading={portStatsLoading} />
        </div>
      </SideSheet>
    </div>
  );
}
