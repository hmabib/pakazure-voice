"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Settings, Wrench, PhoneOff, Send, Wifi, WifiOff, AlertCircle } from "lucide-react";
import clsx from "clsx";
import OrbVisualizer from "./OrbVisualizer";
import TranscriptPanel from "./TranscriptPanel";
import ToolsPanel from "./ToolsPanel";
import SettingsModal from "./SettingsModal";
import { useRealtimeSession } from "@/hooks/useRealtimeSession";
import { DEFAULT_TOOLS } from "@/lib/tools";
import { DEFAULT_SETTINGS } from "@/lib/types";
import type { Settings as SettingsType, Tool } from "@/lib/types";

const STATUS_LABELS: Record<string, string> = {
  idle: "Appuyez pour démarrer",
  connecting: "Connexion en cours...",
  connected: "Connecté — Parlez maintenant",
  listening: "Écoute...",
  thinking: "Réflexion en cours...",
  speaking: "PAKAZURE parle...",
  error: "Erreur de connexion",
  disconnected: "Déconnecté",
};

export default function VoiceAssistant() {
  const [settings, setSettings] = useState<SettingsType>(DEFAULT_SETTINGS);
  const [tools, setTools] = useState<Tool[]>(DEFAULT_TOOLS);
  const [showTools, setShowTools] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [textInput, setTextInput] = useState("");
  const textRef = useRef<HTMLInputElement>(null);

  const { status, transcript, isMuted, volume, connect, disconnect, toggleMute, sendText, clearTranscript } =
    useRealtimeSession(settings);

  const isConnected = ["connected", "listening", "thinking", "speaking"].includes(status);
  const isConnecting = status === "connecting";

  const handleMicClick = () => {
    if (status === "idle" || status === "disconnected" || status === "error") {
      connect();
    } else if (isConnected) {
      toggleMute();
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setShowTools(false);
  };

  const handleSendText = () => {
    if (textInput.trim() && isConnected) {
      sendText(textInput.trim());
      setTextInput("");
    }
  };

  const toggleTool = (name: string) => {
    setTools((prev) => prev.map((t) => (t.name === name ? { ...t, enabled: !t.enabled } : t)));
  };

  // Keyboard shortcut: Space to toggle mic, Escape to close panels
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Escape") { setShowTools(false); setShowSettings(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-[#0a0f1e] overflow-hidden">
      {/* ── HEADER ── */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/8 glass-dark z-10 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🐬</span>
          <div>
            <h1 className="font-bold text-white text-base leading-tight">PAKAZURE Voice</h1>
            <p className="text-xs text-gray-500">Real-Time AI Assistant</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Connection status */}
          <div className="flex items-center gap-1.5">
            {isConnected ? (
              <Wifi size={14} className="text-green-400" />
            ) : status === "connecting" ? (
              <Wifi size={14} className="text-yellow-400 animate-pulse" />
            ) : status === "error" ? (
              <AlertCircle size={14} className="text-red-400" />
            ) : (
              <WifiOff size={14} className="text-gray-600" />
            )}
            <span
              className={clsx(
                "text-xs font-medium",
                isConnected && "text-green-400",
                isConnecting && "text-yellow-400",
                status === "error" && "text-red-400",
                !isConnected && !isConnecting && status !== "error" && "text-gray-600"
              )}
            >
              {isConnected ? "En ligne" : isConnecting ? "Connexion..." : status === "error" ? "Erreur" : "Hors ligne"}
            </span>
          </div>

          {/* Settings */}
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            title="Paramètres"
          >
            <Settings size={18} />
          </button>
        </div>
      </header>

      {/* ── MAIN AREA ── */}
      <main className="flex-1 flex flex-col items-center justify-between overflow-hidden py-4 px-4">
        {/* Orb + status */}
        <div className="flex flex-col items-center gap-4 pt-4">
          <OrbVisualizer status={status} volume={volume} />

          {/* Status label */}
          <div className="text-center">
            <p
              className={clsx(
                "text-sm font-medium transition-colors",
                status === "listening" && "text-green-400",
                status === "speaking" && "text-blue-300",
                status === "thinking" && "text-yellow-400",
                status === "error" && "text-red-400",
                status === "connecting" && "text-yellow-400 animate-pulse",
                !["listening","speaking","thinking","error","connecting"].includes(status) && "text-gray-400"
              )}
            >
              {STATUS_LABELS[status] || ""}
            </p>
            {isMuted && isConnected && (
              <p className="text-xs text-red-400 mt-1">🔇 Microphone en sourdine</p>
            )}
          </div>
        </div>

        {/* Transcript */}
        <div className="w-full max-w-2xl flex-1 flex flex-col min-h-0 my-4 glass rounded-2xl overflow-hidden">
          <TranscriptPanel transcript={transcript} onClear={clearTranscript} />
        </div>

        {/* Text input (when connected) */}
        {isConnected && (
          <div className="w-full max-w-2xl mb-2 fade-in-up">
            <div className="flex gap-2 glass rounded-xl p-1">
              <input
                ref={textRef}
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendText()}
                placeholder="Ou tapez votre message..."
                className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none"
              />
              <button
                onClick={handleSendText}
                disabled={!textInput.trim()}
                className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ── BOTTOM TOOLBAR ── */}
      <div className="shrink-0 flex items-center justify-center gap-6 py-4 px-6 border-t border-white/8 glass-dark">
        {/* Tools toggle */}
        <button
          onClick={() => setShowTools(!showTools)}
          className={clsx(
            "p-3 rounded-2xl transition-all",
            showTools
              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
              : "bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
          )}
          title="Outils"
        >
          <Wrench size={20} />
        </button>

        {/* Main mic / connect button */}
        <button
          onClick={handleMicClick}
          disabled={isConnecting}
          className={clsx(
            "relative w-16 h-16 rounded-full transition-all duration-200 shadow-xl focus:outline-none",
            "flex items-center justify-center",
            isConnecting && "opacity-60 cursor-not-allowed",
            isMuted && isConnected
              ? "bg-red-600 hover:bg-red-700 shadow-red-600/40"
              : isConnected
              ? "bg-blue-600 hover:bg-blue-700 shadow-blue-600/40"
              : "bg-blue-700 hover:bg-blue-600 shadow-blue-700/40",
            // Ripple when listening
            status === "listening" && "ring-4 ring-green-400/30"
          )}
          title={isConnected ? (isMuted ? "Réactiver le micro" : "Couper le micro") : "Démarrer"}
        >
          {status === "listening" && (
            <div className="absolute inset-0 rounded-full bg-green-400/20 mic-ripple" />
          )}
          {isMuted || !isConnected ? (
            <MicOff size={24} className="text-white" />
          ) : (
            <Mic size={24} className="text-white" />
          )}
        </button>

        {/* Disconnect or Settings */}
        {isConnected ? (
          <button
            onClick={handleDisconnect}
            className="p-3 rounded-2xl bg-red-900/40 hover:bg-red-900/60 text-red-400 hover:text-red-300 transition-all"
            title="Terminer la session"
          >
            <PhoneOff size={20} />
          </button>
        ) : (
          <button
            onClick={() => setShowSettings(true)}
            className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
            title="Paramètres"
          >
            <Settings size={20} />
          </button>
        )}
      </div>

      {/* ── OVERLAYS ── */}
      {showTools && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setShowTools(false)} />
          <ToolsPanel tools={tools} onToggle={toggleTool} onClose={() => setShowTools(false)} />
        </>
      )}

      {showSettings && (
        <SettingsModal
          settings={settings}
          onSave={setSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
