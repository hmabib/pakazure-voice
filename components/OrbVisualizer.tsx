"use client";

import clsx from "clsx";
import type { SessionStatus } from "@/lib/types";

interface Props {
  status: SessionStatus;
  volume?: number;
}

export default function OrbVisualizer({ status, volume = 0 }: Props) {
  const isActive = !["idle", "disconnected"].includes(status);
  const scale = status === "speaking" ? 1 + volume * 0.3 : 1;

  return (
    <div className="relative flex items-center justify-center w-56 h-56 select-none">
      {/* Pulse rings when active */}
      {isActive && (
        <>
          <div className="absolute inset-0 rounded-full border border-blue-400/20 pulse-ring" />
          <div className="absolute inset-0 rounded-full border border-blue-400/10 pulse-ring-delay" />
        </>
      )}

      {/* Outer glow ring */}
      <div
        className={clsx(
          "absolute inset-2 rounded-full transition-all duration-500",
          "border border-blue-500/20",
          status === "listening" && "border-green-400/40 shadow-[0_0_30px_rgba(74,222,128,0.2)]",
          status === "speaking" && "border-blue-300/50 shadow-[0_0_40px_rgba(96,165,250,0.3)]",
          status === "error" && "border-red-400/40"
        )}
      />

      {/* Mid ring */}
      <div
        className={clsx(
          "absolute inset-6 rounded-full transition-all duration-300",
          "border border-blue-600/30",
          isActive && "opacity-100",
          !isActive && "opacity-20"
        )}
      />

      {/* Core orb */}
      <div
        className={clsx(
          "w-36 h-36 rounded-full transition-all duration-200 cursor-pointer",
          "relative overflow-hidden",
          // Status animations
          status === "idle" && "orb-idle",
          status === "connecting" && "orb-thinking opacity-60",
          status === "connected" && "orb-idle",
          status === "listening" && "orb-listening",
          status === "thinking" && "orb-thinking",
          status === "speaking" && "orb-speaking",
          status === "error" && "opacity-80",
          status === "disconnected" && "opacity-30"
        )}
        style={{
          transform: `scale(${scale})`,
          background:
            status === "error"
              ? "radial-gradient(circle at 35% 35%, #f87171, #991b1b)"
              : status === "listening"
              ? "radial-gradient(circle at 35% 35%, #34d399, #059669, #064e3b)"
              : "radial-gradient(circle at 35% 35%, #60a5fa, #2563eb, #1A3C6E)",
          boxShadow:
            status === "speaking"
              ? `0 0 ${40 + volume * 60}px rgba(37,99,235,${0.5 + volume * 0.4})`
              : status === "listening"
              ? "0 0 50px rgba(52,211,153,0.5)"
              : status === "error"
              ? "0 0 40px rgba(248,113,113,0.5)"
              : "0 0 40px rgba(37,99,235,0.4)",
        }}
      >
        {/* Inner highlight */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/25 via-transparent to-transparent" />
        {/* Center shine */}
        <div className="absolute top-4 left-6 w-8 h-8 rounded-full bg-white/20 blur-sm" />
      </div>

      {/* Dolphin emoji center */}
      <div className="absolute text-2xl pointer-events-none select-none" style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }}>
        🐬
      </div>
    </div>
  );
}
