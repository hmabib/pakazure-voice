"use client";

import { useState } from "react";
import { Camera, Plus, Trash2, Video, X } from "lucide-react";
import type { MCPServer, Settings } from "@/lib/types";

interface Props {
  settings: Settings;
  onSave: (s: Settings) => void;
  onClose: () => void;
}

const VOICES = [
  { id: "echo", label: "Echo • premium FR" },
  { id: "shimmer", label: "Shimmer" },
  { id: "alloy", label: "Alloy" },
  { id: "onyx", label: "Onyx" },
  { id: "nova", label: "Nova" },
  { id: "coral", label: "Coral" },
];

const LANGUAGES = [
  { id: "fr", label: "Français" },
  { id: "en", label: "English" },
  { id: "ar", label: "العربية" },
];

function SliderField({
  label,
  description,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-white">{label}</p>
          <p className="mt-1 text-xs leading-5 text-slate-400">{description}</p>
        </div>
        <span className="shrink-0 rounded-full border border-white/10 bg-slate-950/50 px-3 py-1 text-xs text-cyan-100">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-4 h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-800 accent-cyan-300"
      />
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition ${
        checked ? "border-cyan-300/30 bg-cyan-400/15" : "border-white/10 bg-slate-800"
      }`}
    >
      <span className={`inline-block h-5 w-5 rounded-full bg-white transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}

export default function SettingsModal({ settings, onSave, onClose }: Props) {
  const [form, setForm] = useState<Settings>({ ...settings });
  const [newMcpUrl, setNewMcpUrl] = useState("");

  const addMcpServer = () => {
    if (!newMcpUrl.trim()) return;
    const server: MCPServer = {
      url: newMcpUrl.trim(),
      name: newMcpUrl.replace(/^wss?:\/\//, "").split("/")[0],
      connected: false,
    };
    setForm((current) => ({ ...current, mcpServers: [...current.mcpServers, server] }));
    setNewMcpUrl("");
  };

  const removeMcpServer = (url: string) => {
    setForm((current) => ({ ...current, mcpServers: current.mcpServers.filter((server) => server.url !== url) }));
  };

  const setAvatarNumber = (key: keyof Settings["avatar"], value: number) => {
    setForm((current) => ({ ...current, avatar: { ...current.avatar, [key]: value } }));
  };

  const setAvatarBoolean = (key: keyof Settings["avatar"], value: boolean) => {
    setForm((current) => ({ ...current, avatar: { ...current.avatar, [key]: value } }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <button className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onClose} aria-label="Fermer les paramètres" />

      <div className="panel-shell relative z-10 flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-[2rem]">
        <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.36em] text-cyan-200/70">Configuration</p>
            <h2 className="mt-2 text-lg font-semibold text-white sm:text-xl">Paramètres temps réel</h2>
          </div>
          <button onClick={onClose} className="rounded-2xl border border-white/10 bg-white/5 p-2 text-slate-400 transition hover:border-cyan-300/20 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="grid flex-1 gap-5 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.08fr)]">
          <section className="min-w-0 space-y-6">
            <div>
              <label className="mb-3 block text-sm font-medium text-slate-200">Voix</label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {VOICES.map((voice) => (
                  <button
                    key={voice.id}
                    onClick={() => setForm((current) => ({ ...current, voice: voice.id }))}
                    className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                      form.voice === voice.id
                        ? "border-cyan-300/30 bg-cyan-400/10 text-white"
                        : "border-white/10 bg-white/5 text-slate-400 hover:border-cyan-300/15 hover:text-white"
                    }`}
                  >
                    {voice.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-3 block text-sm font-medium text-slate-200">Langue</label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {LANGUAGES.map((language) => (
                  <button
                    key={language.id}
                    onClick={() => setForm((current) => ({ ...current, language: language.id }))}
                    className={`rounded-2xl border px-4 py-3 text-sm transition ${
                      form.language === language.id
                        ? "border-cyan-300/30 bg-cyan-400/10 text-white"
                        : "border-white/10 bg-white/5 text-slate-400 hover:border-cyan-300/15 hover:text-white"
                    }`}
                  >
                    {language.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">Mode microphone</p>
                  <p className="mt-1 text-xs text-slate-400">Basculer entre mode ouvert et push-to-talk futur.</p>
                </div>
                <Toggle checked={form.pushToTalk} onChange={() => setForm((current) => ({ ...current, pushToTalk: !current.pushToTalk }))} />
              </div>
            </div>

            <div className="space-y-4 rounded-3xl border border-cyan-300/12 bg-cyan-400/[0.04] p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-slate-950/40 px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-cyan-100">
                    <Video size={12} /> Realtime webcam
                  </div>
                  <p className="mt-3 text-sm font-medium text-white">Envoyer aussi la webcam au LLM</p>
                  <p className="mt-1 text-xs leading-5 text-slate-300">
                    Option facultative, désactivée par défaut. Prépare la session realtime, la capture locale et les garde-fous si la vision temps réel n’est pas encore pleinement activée côté modèle.
                  </p>
                </div>
                <Toggle
                  checked={form.realtimeVideo.enabled}
                  onChange={() => setForm((current) => ({ ...current, realtimeVideo: { ...current.realtimeVideo, enabled: !current.realtimeVideo.enabled } }))}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-3">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Statut</p>
                  <p className="mt-2 text-sm font-medium text-white">{form.realtimeVideo.enabled ? "Webcam demandée" : "Webcam désactivée"}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    {form.realtimeVideo.enabled
                      ? form.realtimeVideo.mode === "camera-feed"
                        ? "Le flux camera-feed sera tenté dans la session realtime."
                        : "Architecture prête avec fallback si l’injection vidéo au modèle n’est pas supportée."
                      : "Aucune capture vidéo ne sera demandée au device."}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white">Prévisualisation miroir</p>
                      <p className="mt-1 text-xs leading-5 text-slate-400">Confort visuel local sur le device.</p>
                    </div>
                    <Toggle
                      checked={form.realtimeVideo.previewMirrored}
                      onChange={() =>
                        setForm((current) => ({
                          ...current,
                          realtimeVideo: { ...current.realtimeVideo, previewMirrored: !current.realtimeVideo.previewMirrored },
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              {form.realtimeVideo.fallbackReason && (
                <div className="rounded-2xl border border-amber-300/12 bg-amber-400/[0.05] p-3">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-amber-100">Garde-fou / fallback</p>
                  <p className="mt-2 text-xs leading-6 text-slate-200">{form.realtimeVideo.fallbackReason}</p>
                </div>
              )}
            </div>
          </section>

          <section className="min-w-0 space-y-6">
            <div>
              <label className="mb-3 block text-sm font-medium text-slate-200">Prompt système</label>
              <textarea
                value={form.systemPrompt}
                onChange={(event) => setForm((current) => ({ ...current, systemPrompt: event.target.value }))}
                rows={10}
                className="min-h-[220px] w-full rounded-3xl border border-white/10 bg-slate-950/70 px-4 py-4 text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-300/25"
              />
            </div>

            <div>
              <label className="mb-3 block text-sm font-medium text-slate-200">Serveurs MCP</label>
              <div className="max-h-[280px] space-y-3 overflow-y-auto pr-1">
                {form.mcpServers.map((server) => (
                  <div key={server.url} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">{server.name}</p>
                      <p className="truncate font-mono text-xs text-slate-400">{server.url}</p>
                    </div>
                    <button onClick={() => removeMcpServer(server.url)} className="rounded-xl border border-red-300/15 bg-red-400/10 p-2 text-red-200 transition hover:border-red-300/30">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  value={newMcpUrl}
                  onChange={(event) => setNewMcpUrl(event.target.value)}
                  onKeyDown={(event) => event.key === "Enter" && addMcpServer()}
                  placeholder="wss://your-server.example/mcp"
                  className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-cyan-300/25"
                />
                <button onClick={addMcpServer} className="rounded-2xl border border-cyan-300/25 bg-cyan-400/10 px-4 py-3 text-cyan-100 transition hover:border-cyan-300/40">
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </section>

          <section className="min-w-0 space-y-4">
            <div>
              <p className="mb-3 text-sm font-medium text-slate-200">Avatar · micro-ajustements</p>
              <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1 xl:max-h-none xl:overflow-visible xl:pr-0">
                <SliderField
                  label="Position bouche · X"
                  description="Décalage horizontal fin de la bouche animée."
                  value={form.avatar.mouthX}
                  min={-10}
                  max={10}
                  step={0.5}
                  onChange={(value) => setAvatarNumber("mouthX", value)}
                />
                <SliderField
                  label="Position bouche · Y"
                  description="Affinage vertical pour coller au visage choisi."
                  value={form.avatar.mouthY}
                  min={-10}
                  max={10}
                  step={0.5}
                  onChange={(value) => setAvatarNumber("mouthY", value)}
                />
                <SliderField
                  label="Position yeux · X"
                  description="Décale les deux yeux en horizontal."
                  value={form.avatar.eyesX}
                  min={-8}
                  max={8}
                  step={0.5}
                  onChange={(value) => setAvatarNumber("eyesX", value)}
                />
                <SliderField
                  label="Position yeux · Y"
                  description="Décale les deux yeux en vertical."
                  value={form.avatar.eyesY}
                  min={-8}
                  max={8}
                  step={0.5}
                  onChange={(value) => setAvatarNumber("eyesY", value)}
                />
                <SliderField
                  label="Intensité des effets"
                  description="Réduit ou amplifie halo, lip-sync et énergie visuelle."
                  value={form.avatar.effectIntensity}
                  min={0.5}
                  max={1.8}
                  step={0.1}
                  onChange={(value) => setAvatarNumber("effectIntensity", value)}
                />
                <SliderField
                  label="Taille avatar / espace"
                  description="Ajuste la présence de l’avatar dans son cadre."
                  value={form.avatar.avatarScale}
                  min={0.82}
                  max={1.2}
                  step={0.01}
                  onChange={(value) => setAvatarNumber("avatarScale", value)}
                />
              </div>
            </div>

            <div className="space-y-3 rounded-3xl border border-white/8 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">Garder l’avatar centré en parole</p>
                  <p className="mt-1 text-xs text-slate-400">Évite le flottement vertical pendant le speaking.</p>
                </div>
                <Toggle
                  checked={form.avatar.keepCenteredWhileSpeaking}
                  onChange={() => setAvatarBoolean("keepCenteredWhileSpeaking", !form.avatar.keepCenteredWhileSpeaking)}
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">Afficher le transcript sous l’avatar</p>
                  <p className="mt-1 text-xs text-slate-400">Affiche le dernier texte sans ouvrir le journal complet.</p>
                </div>
                <Toggle
                  checked={form.avatar.showTranscriptBelowAvatar}
                  onChange={() => setAvatarBoolean("showTranscriptBelowAvatar", !form.avatar.showTranscriptBelowAvatar)}
                />
              </div>

              <div className="rounded-2xl border border-white/8 bg-slate-950/45 p-3">
                <div className="flex items-center gap-2 text-cyan-100">
                  <Camera size={15} />
                  <p className="text-xs uppercase tracking-[0.24em]">UI stable</p>
                </div>
                <p className="mt-2 text-xs leading-6 text-slate-400">
                  Les panneaux et modales restent bornés en hauteur/largeur et basculent sur scroll interne quand le contenu devient trop long, surtout sur mobile et tablette.
                </p>
              </div>
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 px-4 py-4 sm:flex-row sm:px-6 sm:py-5">
          <button onClick={onClose} className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300 transition hover:border-white/20 hover:text-white">
            Annuler
          </button>
          <button
            onClick={() => {
              onSave(form);
              onClose();
            }}
            className="flex-1 rounded-2xl border border-cyan-300/25 bg-cyan-400/12 px-4 py-3 text-sm font-medium text-cyan-100 transition hover:border-cyan-300/40"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
