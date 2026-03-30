"use client";

import { useEffect, useRef } from "react";
import clsx from "clsx";
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
      <div className="flex-1 flex items-center justify-center text-gray-600 text-sm italic px-4">
        La conversation apparaîtra ici...
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
      {transcript.length > 0 && (
        <button
          onClick={onClear}
          className="text-xs text-gray-600 hover:text-gray-400 transition-colors float-right"
        >
          Effacer
        </button>
      )}
      {transcript.map((item) => (
        <div
          key={item.id}
          className={clsx(
            "fade-in-up flex",
            item.role === "user" && "justify-end",
            item.role === "assistant" && "justify-start",
            item.role === "tool" && "justify-center"
          )}
        >
          {item.role === "user" && (
            <div className="max-w-[80%] px-4 py-2 rounded-2xl rounded-tr-sm text-sm bg-blue-600 text-white shadow-lg">
              <p>{item.text}</p>
              <p className="text-xs text-blue-200 mt-1 text-right">
                {item.timestamp.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          )}

          {item.role === "assistant" && (
            <div className="max-w-[80%] px-4 py-2 rounded-2xl rounded-tl-sm text-sm glass text-gray-100 shadow-lg">
              <div className="flex items-center gap-1 mb-1">
                <span className="text-xs text-blue-400 font-medium">🐬 PAKAZURE</span>
              </div>
              <p className="leading-relaxed">{item.text}</p>
              <p className="text-xs text-gray-500 mt-1">
                {item.timestamp.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          )}

          {item.role === "tool" && (
            <div className="max-w-[90%] px-3 py-1.5 rounded-lg text-xs bg-gray-800/60 border border-gray-700/50 text-gray-400 font-mono">
              <span className="text-yellow-500/80">{item.toolName && `[${item.toolName}]`} </span>
              <span className="break-all">{item.text.length > 120 ? item.text.slice(0, 120) + "..." : item.text}</span>
            </div>
          )}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
