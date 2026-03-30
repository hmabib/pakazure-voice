"use client";

import { useEffect, useRef } from "react";
import clsx from "clsx";
import { Bot, Trash2, User2, Wrench } from "lucide-react";
import type { TranscriptItem } from "@/lib/types";

interface Props {
  transcript: TranscriptItem[];
  onClear: () => void;
}

export default function TranscriptPanel({ transcript, onClear }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  if (transcript.length === 0) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-center text-sm text-slate-500">
        Le flux conversationnel, les appels outils et les réponses assistant apparaîtront ici en temps réel.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.32em] text-cyan-200/70">Transcript</p>
          <p className="mt-1 text-sm text-slate-400">Historique live de la session</p>
        </div>
        <button onClick={onClear} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 transition hover:border-red-300/20 hover:text-red-200">
          <Trash2 size={14} />
          Effacer
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {transcript.map((item) => {
          const isUser = item.role === "user";
          const isAssistant = item.role === "assistant";
          const isTool = item.role === "tool";

          return (
            <div key={item.id} className={clsx("fade-in-up flex", isUser ? "justify-end" : isTool ? "justify-center" : "justify-start")}>
              <div
                className={clsx(
                  "max-w-[92%] rounded-2xl border px-4 py-3 shadow-[0_12px_30px_rgba(2,6,23,0.28)]",
                  isUser && "border-blue-400/20 bg-blue-500/15 text-white",
                  isAssistant && "border-cyan-300/15 bg-cyan-400/[0.06] text-slate-100",
                  isTool && "w-full border-amber-300/10 bg-amber-400/[0.05] text-slate-200"
                )}
              >
                <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.28em]">
                  <span className="rounded-full border border-white/10 bg-slate-950/60 p-1.5">
                    {isUser ? <User2 size={12} /> : isAssistant ? <Bot size={12} /> : <Wrench size={12} />}
                  </span>
                  <span className={clsx(isUser && "text-blue-100", isAssistant && "text-cyan-100", isTool && "text-amber-100")}>{isUser ? "Utilisateur" : isAssistant ? "Camara Boto" : item.toolName || "Tool"}</span>
                  <span className="ml-auto text-slate-500">
                    {item.timestamp.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className={clsx("whitespace-pre-wrap break-words text-sm leading-relaxed", isTool && "font-mono text-[12px]")}>{item.text}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
