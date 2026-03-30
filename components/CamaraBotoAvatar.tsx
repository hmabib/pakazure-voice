"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import type { AvatarSettings, SessionStatus } from "@/lib/types";

interface Props {
  status: SessionStatus;
  volume?: number;
  compact?: boolean;
  avatarSettings?: AvatarSettings;
  transcriptText?: string;
}

const ACTIVE_STATUSES: SessionStatus[] = ["connected", "listening", "thinking", "speaking"];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function createMouthMetrics(status: SessionStatus, volume: number, phase: number, intensity: number) {
  const normalized = clamp(volume, 0, 1.2);
  const amp = clamp(intensity, 0.4, 1.8);

  if (status === "speaking") {
    const openness = clamp((7 + normalized * 14 + Math.sin(phase * 1.7) * 2.2) * amp, 7, 28);
    const width = clamp((16 + normalized * 8 + Math.cos(phase * 0.8) * 1.6) * (0.92 + amp * 0.08), 16, 30);
    const tilt = Math.sin(phase * 0.5) * 0.8 * amp;
    return { openness, width, tilt, glow: 0.5 + normalized * 0.3 * amp };
  }

  if (status === "listening") {
    return {
      openness: (4.8 + Math.sin(phase * 0.4) * 1.1) * (0.9 + amp * 0.1),
      width: 18,
      tilt: 0,
      glow: 0.34 * amp,
    };
  }

  if (status === "thinking") {
    return {
      openness: (3.4 + Math.sin(phase * 0.7) * 0.8) * (0.9 + amp * 0.08),
      width: 16,
      tilt: Math.sin(phase * 0.3) * 1 * amp,
      glow: 0.24 * amp,
    };
  }

  return {
    openness: 2.5 + Math.sin(phase * 0.2) * 0.3,
    width: 16,
    tilt: 0,
    glow: 0.1 * amp,
  };
}

export default function CamaraBotoAvatar({ status, volume = 0, compact = false, avatarSettings, transcriptText }: Props) {
  const [phase, setPhase] = useState(0);
  const [isBlinking, setIsBlinking] = useState(false);
  const blinkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isActive = ACTIVE_STATUSES.includes(status);
  const isSpeaking = status === "speaking";
  const isListening = status === "listening";
  const isThinking = status === "thinking";
  const config: AvatarSettings = {
    mouthX: 0,
    mouthY: 0,
    eyesX: 0,
    eyesY: 0,
    effectIntensity: 1,
    avatarScale: 1,
    keepCenteredWhileSpeaking: true,
    showTranscriptBelowAvatar: true,
    ...avatarSettings,
  };

  useEffect(() => {
    let frame = 0;
    let raf = 0;

    const loop = () => {
      frame += isSpeaking ? 0.24 : isListening ? 0.11 : 0.05;
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
        setTimeout(() => setIsBlinking(false), 110);
        scheduleBlink();
      }, delay);
    };

    scheduleBlink();

    return () => {
      cancelled = true;
      if (blinkTimeoutRef.current) clearTimeout(blinkTimeoutRef.current);
    };
  }, []);

  const intensity = clamp(config.effectIntensity, 0.5, 1.8);
  const metrics = useMemo(() => createMouthMetrics(status, volume, phase, intensity), [status, volume, phase, intensity]);
  const mouthX = 50 + clamp(config.mouthX, -10, 10);
  const mouthY = 58.8 + metrics.tilt + clamp(config.mouthY, -10, 10);
  const leftEye = { x: 41.6 + clamp(config.eyesX, -8, 8), y: 32.8 + clamp(config.eyesY, -8, 8) };
  const rightEye = { x: 58.1 + clamp(config.eyesX, -8, 8), y: 32.9 + clamp(config.eyesY, -8, 8) };
  const upperLip = `M ${mouthX - metrics.width / 2} ${mouthY} Q ${mouthX} ${mouthY - metrics.openness * 0.42} ${mouthX + metrics.width / 2} ${mouthY}`;
  const lowerLip = `M ${mouthX - metrics.width / 2} ${mouthY} Q ${mouthX} ${mouthY + metrics.openness * 0.74} ${mouthX + metrics.width / 2} ${mouthY}`;
  const speakingFloat = config.keepCenteredWhileSpeaking && isSpeaking ? 0 : Math.sin(phase * 0.18) * (compact ? 2 : 4) * intensity;
  const subtleFloat = isActive ? speakingFloat : 0;
  const portraitScale = clamp(config.avatarScale, 0.82, 1.2) * (isSpeaking ? 1.01 + clamp(volume, 0, 0.6) * 0.02 * intensity : 1);
  const bars = Array.from({ length: compact ? 7 : 9 }, (_, index) => {
    const base = compact ? 10 : 14;
    const dynamic = isSpeaking ? clamp(volume * (compact ? 22 : 30), 0, compact ? 18 : 24) * intensity : isListening ? 6 : 2;
    return base + dynamic + Math.abs(Math.sin(phase + index * 0.35)) * (compact ? 5 : 7) * (0.8 + intensity * 0.2);
  });

  return (
    <div className={clsx("relative flex w-full flex-col items-center justify-center select-none", compact ? "max-w-[280px]" : "max-w-[520px]")}>
      <div
        className={clsx(
          "avatar-shell relative flex items-center justify-center transition-transform duration-300",
          compact ? "h-[250px] w-[250px]" : "h-[360px] w-[360px] sm:h-[420px] sm:w-[420px]"
        )}
        style={{ transform: `translateY(${subtleFloat}px)` }}
      >
        <div className="avatar-orbit avatar-orbit-slow absolute inset-3 rounded-full border border-cyan-300/12" style={{ opacity: 0.7 * intensity }} />
        <div className="avatar-orbit avatar-orbit-fast absolute inset-9 rounded-full border border-cyan-300/8" style={{ opacity: 0.5 * intensity }} />

        <div
          className={clsx(
            "avatar-core relative overflow-hidden rounded-[2rem] border transition-all duration-300",
            compact ? "h-[190px] w-[190px]" : "h-[240px] w-[240px] sm:h-[300px] sm:w-[300px]",
            isSpeaking && "border-cyan-300/45 shadow-[0_0_55px_rgba(34,211,238,0.16)]",
            isListening && "border-emerald-300/35 shadow-[0_0_45px_rgba(16,185,129,0.12)]",
            isThinking && "border-amber-300/28 shadow-[0_0_45px_rgba(251,191,36,0.1)]",
            !isActive && "border-slate-700/70"
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/camara-boto.jpg"
            alt="Camara Boto"
            className={clsx("absolute inset-0 h-full w-full object-cover transition-all duration-300", !isActive && "grayscale opacity-72")}
            style={{
              objectPosition: "50% 18%",
              transform: `scale(${portraitScale}) translateY(${config.keepCenteredWhileSpeaking && isSpeaking ? 0 : Math.sin(phase * 0.16) * 1.2}px)`,
            }}
          />

          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,10,25,0.04),rgba(5,10,25,0.42))]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.18),transparent_32%)]" />
          <div className="hud-scanlines absolute inset-0 opacity-20" style={{ opacity: 0.12 + intensity * 0.08 }} />

          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <filter id="mouthGlow">
                <feGaussianBlur stdDeviation="1.1" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <g opacity={isBlinking ? 1 : 0}>
              <rect x={leftEye.x - 4.2} y={leftEye.y} width="8.4" height="1.8" rx="2" fill="rgba(5,10,25,0.92)" />
              <rect x={rightEye.x - 4.2} y={rightEye.y} width="8.4" height="1.8" rx="2" fill="rgba(5,10,25,0.92)" />
            </g>

            <g opacity={isBlinking ? 0 : 0.1 + metrics.glow * 0.26}>
              <circle cx={leftEye.x} cy={leftEye.y + 0.2} r="4.8" fill="rgba(34,211,238,0.14)" />
              <circle cx={rightEye.x} cy={rightEye.y + 0.2} r="4.8" fill="rgba(34,211,238,0.14)" />
            </g>

            <g filter="url(#mouthGlow)">
              <path d={upperLip} stroke={`rgba(255,255,255,${0.28 + metrics.glow * 0.2})`} strokeWidth="1.1" fill="none" strokeLinecap="round" />
              <path d={lowerLip} stroke={`rgba(34,211,238,${0.35 + metrics.glow * 0.3})`} strokeWidth="1.8" fill={`rgba(7,14,32,${0.28 + metrics.glow * 0.18})`} strokeLinecap="round" />
              <ellipse
                cx={mouthX}
                cy={mouthY + metrics.openness * 0.32}
                rx={Math.max(2.6, metrics.width * 0.13)}
                ry={Math.max(1.2, metrics.openness * 0.14)}
                fill={`rgba(255,255,255,${isSpeaking ? 0.42 : 0.12})`}
                opacity={isSpeaking ? 0.82 : 0.35}
              />
            </g>
          </svg>

          <div className="absolute inset-x-4 top-3 flex items-center justify-between text-[9px] uppercase tracking-[0.3em] text-cyan-100/65">
            <span>PAKAZURE</span>
            <span>{status}</span>
          </div>
        </div>

        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.06),transparent_60%)] blur-2xl" style={{ opacity: 0.8 * intensity }} />
      </div>

      <div className={clsx("mt-3 flex items-end gap-1.5", compact && "mt-2 gap-1")}>
        {bars.map((height, index) => (
          <span
            key={index}
            className={clsx("visual-bar rounded-full", isSpeaking ? "bg-cyan-300" : isListening ? "bg-emerald-300" : "bg-slate-500")}
            style={{ height, width: compact ? 4 : 5, opacity: isActive ? 0.8 : 0.26 }}
          />
        ))}
      </div>

      <div className={clsx("mt-3 rounded-full border border-cyan-300/15 bg-slate-950/70 px-4 py-2 text-center", compact ? "shadow-none" : "shadow-[0_0_30px_rgba(15,23,42,0.35)]")}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-cyan-100">Camara Boto</p>
        <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-slate-400">Signature vocale PAKAZURE</p>
      </div>

      {config.showTranscriptBelowAvatar && transcriptText && (
        <div className="mt-4 w-full max-w-2xl rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-left">
          <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/70">Transcript live</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">{transcriptText}</p>
        </div>
      )}
    </div>
  );
}
