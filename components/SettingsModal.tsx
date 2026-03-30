"use client";

import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import type { Settings, MCPServer } from "@/lib/types";

interface Props {
  settings: Settings;
  onSave: (s: Settings) => void;
  onClose: () => void;
}

const VOICES = [
  { id: "shimmer", label: "Shimmer (FR recommandé)" },
  { id: "alloy", label: "Alloy" },
  { id: "echo", label: "Echo" },
  { id: "nova", label: "Nova" },
  { id: "onyx", label: "Onyx" },
  { id: "coral", label: "Coral" },
];

const LANGUAGES = [
  { id: "fr", label: "🇫🇷 Français" },
  { id: "en", label: "🇬🇧 English" },
  { id: "ar", label: "🇸🇦 العربية" },
];

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
    setForm((f) => ({ ...f, mcpServers: [...f.mcpServers, server] }));
    setNewMcpUrl("");
  };

  const removeMcpServer = (url: string) => {
    setForm((f) => ({ ...f, mcpServers: f.mcpServers.filter((s) => s.url !== url) }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg glass-dark rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-lg font-semibold">Paramètres</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Voice */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Voix</label>
            <div className="grid grid-cols-2 gap-2">
              {VOICES.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setForm((f) => ({ ...f, voice: v.id }))}
                  className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                    form.voice === v.id
                      ? "bg-blue-600 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Langue</label>
            <div className="flex gap-2">
              {LANGUAGES.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setForm((f) => ({ ...f, language: l.id }))}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                    form.language === l.id
                      ? "bg-blue-600 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mode */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-300">Mode microphone</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {form.pushToTalk ? "Maintenir pour parler" : "Bascule marche/arrêt"}
              </p>
            </div>
            <button
              onClick={() => setForm((f) => ({ ...f, pushToTalk: !f.pushToTalk }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                form.pushToTalk ? "bg-blue-500" : "bg-gray-600"
              }`}
            >
              <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${form.pushToTalk ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>

          {/* System Prompt */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Prompt système</label>
            <textarea
              value={form.systemPrompt}
              onChange={(e) => setForm((f) => ({ ...f, systemPrompt: e.target.value }))}
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* MCP Servers */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Serveurs MCP</label>
            {form.mcpServers.length > 0 && (
              <div className="space-y-1 mb-2">
                {form.mcpServers.map((s) => (
                  <div key={s.url} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                    <div>
                      <p className="text-xs font-medium text-white">{s.name}</p>
                      <p className="text-xs text-gray-500 font-mono truncate max-w-[260px]">{s.url}</p>
                    </div>
                    <button onClick={() => removeMcpServer(s.url)} className="text-red-400 hover:text-red-300 ml-2">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={newMcpUrl}
                onChange={(e) => setNewMcpUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addMcpServer()}
                placeholder="ws://localhost:3001/mcp"
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500 font-mono"
              />
              <button
                onClick={addMcpServer}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-white/10">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-sm transition-colors">
            Annuler
          </button>
          <button
            onClick={() => { onSave(form); onClose(); }}
            className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
