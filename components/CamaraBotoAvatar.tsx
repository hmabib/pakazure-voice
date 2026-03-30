"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import type { SessionStatus } from "@/lib/types";

interface Props {
  status: SessionStatus;
  volume?: number;
}

const ACTIVE_STATUSES: SessionStatus[] = ["connected", "listening", "thinking", "speaking"];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function createMouthMetrics(status: SessionStatus, volume: number, phase: number) {
  const normalized = clamp(volume, 0, 1.2);

  if (status === "speaking") {
    const openness = clamp(8 + normalized * 18 + Math.sin(phase * 1.7) * 3, 8, 28);
    const width = clamp(20 + normalized * 10 + Math.cos(phase * 0.8) * 2, 18, 34);
    const tilt = Math.sin(phase * 0.5) * 1.2;
    return { openness, width, tilt, glow: 0.55 + normalized * 0.35 };
  }

  if (status === "listening") {
    return {
      openness: 6 + Math.sin(phase * 0.4) * 1.5,
      width: 22,
      tilt: 0,
      glow: 0.4,
    };
  }

  if (status === "thinking") {
    return {
      openness: 4 + Math.sin(phase * 0.7) * 1,
      width: 18,
      tilt: Math.sin(phase * 0.3) * 1.5,
      glow: 0.3,
    };
  }

  return {
    openness: 3 + Math.sin(phase * 0.2) * 0.4,
    width: 18,
    tilt: 0,
    glow: 0.12,
  };
}

export default function CamaraBotoAvatar({ status, volume = 0 }: Props) {
  const [phase, setPhase] = useState(0);
  const [isBlinking, setIsBlinking] = useState(false);
  const blinkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isActive = ACTIVE_STATUSES.includes(status);
  const isSpeaking = status === "speaking";
  const isListening = status === "listening";
  const isThinking = status === "thinking";

  useEffect(() => {
    let frame = 0;
    let raf = 0;

    const loop = () => {
      frame += isSpeaking ? 0.26 : isListening ? 0.12 : 0.06;
      setPhase(frame);
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [isListening, isSpeaking]);

  useEffect(() => {
    let cancelled = false;

    const scheduleBlink = () => {
      const delay = 1800 + Math.random() * 3200;
      blinkTimeoutRef.current = setTimeout(() => {
        if (cancelled) return;
        setIsBlinking(true);
        setTimeout(() => setIsBlinking(false), 120);
        scheduleBlink();
      }, delay);
    };

    scheduleBlink();

    return () => {
      cancelled = true;
      if (blinkTimeoutRef.current) clearTimeout(blinkTimeoutRef.current);
    };
  }, []);

  const metrics = useMemo(() => createMouthMetrics(status, volume, phase), [status, volume, phase]);
  const mouthY = 67 + metrics.tilt;
  const upperLip = `M ${50 - metrics.width / 2} ${mouthY} Q 50 ${mouthY - metrics.openness * 0.52} ${50 + metrics.width / 2} ${mouthY}`;
  const lowerLip = `M ${50 - metrics.width / 2} ${mouthY} Q 50 ${mouthY + metrics.openness} ${50 + metrics.width / 2} ${mouthY}`;
  const subtleFloat = isActive ? Math.sin(phase * 0.18) * 5 : 0;
  const portraitScale = isSpeaking ? 1.03 + clamp(volume, 0, 0.6) * 0.05 : 1.01;
  const bars = Array.from({ length: 9 }, (_, index) => {
    const base = 16 + (index % 3) * 8;
    const dynamic = isSpeaking ? clamp(volume * 34, 0, 28) : isListening ? 8 : 2;
    return base + dynamic + Math.abs(Math.sin(phase + index * 0.35)) * 9;
  });

  return (
    <div className="relative flex w-full max-w-[520px] flex-col items-center justify-center select-none">
      <div className="avatar-shell relative flex h-[360px] w-[360px] items-center justify-center sm:h-[420px] sm:w-[420px]" style={{ transform: `translateY(${subtleFloat}px)` }}>
        <div className="avatar-orbit avatar-orbit-slow absolute inset-2 rounded-full border border-cyan-300/15" />
        <div className="avatar-orbit avatar-orbit-fast absolute inset-8 rounded-full border border-cyan-300/10" />
        <div className="absolute inset-[18%] rounded-full border border-white/8" />

        <div className="absolute left-2 top-14 hidden rounded-full border border-cyan-300/20 bg-slate-950/70 px-3 py-1 text-[10px] uppercase tracking-[0.35em] text-cyan-200/70 sm:block">
          Avatar Sync
        </div>
        <div className="absolute right-2 top-24 hidden rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-[10px] uppercase tracking-[0.35em] text-slate-300/70 sm:block">
          Live portrait
        </div>
        <div className="absolute bottom-16 left-0 hidden rounded-full border border-cyan-300/20 bg-slate-950/70 px-3 py-1 text-[10px] uppercase tracking-[0.35em] text-cyan-200/70 sm:block">
          Audio-reactive
        </div>

        <div
          className={clsx(
            "avatar-core relative h-[240px] w-[240px] overflow-hidden rounded-[2.5rem] border transition-all duration-300 sm:h-[300px] sm:w-[300px]",
            isSpeaking && "border-cyan-300/60 shadow-[0_0_80px_rgba(34,211,238,0.28)]",
            isListening && "border-emerald-300/50 shadow-[0_0_60px_rgba(16,185,129,0.18)]",
            isThinking && "border-amber-300/40 shadow-[0_0_60px_rgba(251,191,36,0.14)]",
            !isActive && "border-slate-700/70"
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/camara-boto.jpg"
            alt="Camara Boto"
            className={clsx(
              "absolute inset-0 h-full w-full object-cover object-top transition-all duration-300",
              !isActive && "grayscale opacity-70"
            )}
            style={{ transform: `scale(${portraitScale}) translateY(${Math.sin(phase * 0.16) * 2}px)` }}
          />

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.24),transparent_35%),linear-gradient(180deg,rgba(7,14,32,0.02),rgba(7,14,32,0.62))]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(34,211,238,0.12),transparent_20%,transparent_75%,rgba(59,130,246,0.18))]" />
          <div className="hud-scanlines absolute inset-0 opacity-40" />

          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <filter id="mouthGlow">
                <feGaussianBlur stdDeviation="1.2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <g opacity={isBlinking ? 1 : 0}>
              <rect x="30" y="31.5" width="12" height="2.2" rx="2" fill="rgba(5,10,25,0.92)" />
              <rect x="58" y="31.5" width="12" height="2.2" rx="2" fill="rgba(5,10,25,0.92)" />
            </g>

            <g opacity={isBlinking ? 0 : 0.16 + metrics.glow * 0.35}>
              <circle cx="36" cy="35" r="6.5" fill="rgba(34,211,238,0.18)" />
              <circle cx="64" cy="35" r="6.5" fill="rgba(34,211,238,0.18)" />
            </g>

            <g filter="url(#mouthGlow)">
              <path d={upperLip} stroke={`rgba(255,255,255,${0.35 + metrics.glow * 0.25})`} strokeWidth="1.4" fill="none" strokeLinecap="round" />
              <path d={lowerLip} stroke={`rgba(34,211,238,${0.45 + metrics.glow * 0.35})`} strokeWidth="2.2" fill={`rgba(7,14,32,${0.35 + metrics.glow * 0.2})`} strokeLinecap="round" />
              <ellipse cx="50" cy={mouthY + metrics.openness * 0.48} rx={Math.max(3, metrics.width * 0.16)} ry={Math.max(1.8, metrics.openness * 0.18)} fill={`rgba(255,255,255,${isSpeaking ? 0.55 : 0.16})`} opacity={isSpeaking ? 0.9 : 0.4} />
            </g>

            {isSpeaking && (
              <rect
                x="0"
                y="0"
                width="100"
                height="5"
                fill="rgba(34,211,238,0.16)"
                style={{ transform: `translateY(${(phase * 3.6) % 100}px)`, transition: "transform 70ms linear" }}
              />
            )}
          </svg>

          <div className="absolute inset-x-5 top-4 flex items-center justify-between text-[10px] uppercase tracking-[0.35em] text-cyan-100/65">
            <span>PAKAZURE</span>
            <span>{status}</span>
          </div>
          <div className="absolute inset-x-5 bottom-4 flex items-center justify-between text-[10px] uppercase tracking-[0.28em] text-slate-300/65">
            <span>Voice persona</span>
            <span>Kribi node</span>
          </div>
        </div>

        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.08),transparent_58%)] blur-2xl" />
      </div>

      <div className="mt-4 flex items-end gap-1.5">
        {bars.map((height, index) => (
          <span
            key={index}
            className={clsx("visual-bar rounded-full", isSpeaking ? "bg-cyan-300" : isListening ? "bg-emerald-300" : "bg-slate-500")}
            style={{ height, width: 5, opacity: isActive ? 0.88 : 0.26 }}
          />
        ))}
      </div>

      <div className="mt-4 rounded-full border border-cyan-300/20 bg-slate-950/70 px-5 py-2 text-center shadow-[0_0_30px_rgba(15,23,42,0.35)]">
        <p className="text-xs font-semibold uppercase tracking-[0.42em] text-cyan-100">Camara Boto</p>
        <p className="mt-1 text-[11px] uppercase tracking-[0.28em] text-slate-400">Realtime avatar • PAKAZURE core</p>
      </div>
    </div>
  );
}
