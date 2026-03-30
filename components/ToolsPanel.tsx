"use client";

import { X } from "lucide-react";
import type { Tool } from "@/lib/types";

interface Props {
  tools: Tool[];
  onToggle: (name: string) => void;
  onClose: () => void;
}

export default function ToolsPanel({ tools, onToggle, onClose }: Props) {
  return (
    <div className="slide-in-left fixed left-0 top-0 h-full w-72 z-40 glass-dark shadow-2xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
        <div>
          <h2 className="font-semibold text-white">Outils disponibles</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {tools.filter((t) => t.enabled).length}/{tools.length} activés
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Tools list */}
      <div className="flex-1 overflow-y-auto py-2">
        {tools.map((tool) => (
          <div
            key={tool.name}
            className="flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors group"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span className="text-xl">{tool.icon || "🔧"}</span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {tool.name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </p>
                <p className="text-xs text-gray-500 truncate">{tool.description}</p>
              </div>
            </div>

            {/* Toggle */}
            <button
              onClick={() => onToggle(tool.name)}
              className={`relative ml-3 flex-shrink-0 inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                tool.enabled ? "bg-blue-500" : "bg-gray-600"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                  tool.enabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <div className="px-4 py-3 border-t border-white/10">
        <p className="text-xs text-gray-600 leading-relaxed">
          Les outils activés sont disponibles pour l&apos;IA en temps réel. Connectez des serveurs MCP dans les paramètres pour plus d&apos;outils.
        </p>
      </div>
    </div>
  );
}
