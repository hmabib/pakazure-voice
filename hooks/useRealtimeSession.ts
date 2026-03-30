"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import type { SessionStatus, TranscriptItem, Settings, Tool } from "@/lib/types";
import { executeToolCall } from "@/lib/toolHandlers";
import { TOOL_DEFINITIONS } from "@/lib/tools";

interface RealtimeSessionRequest {
  enableVideo?: boolean;
}

interface RealtimeSessionBootstrap {
  client_secret?: { value?: string };
  capabilities?: {
    videoInput?: boolean;
    videoMode?: string;
    fallbackReason?: string;
  };
}

export function useRealtimeSession(settings: Settings, tools: Tool[]) {
  const [status, setStatus] = useState<SessionStatus>("idle");
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0);
  const [videoEnabledInSession, setVideoEnabledInSession] = useState(false);
  const [videoSupportMode, setVideoSupportMode] = useState<"camera-feed" | "architecture-only">("architecture-only");
  const [videoFallbackReason, setVideoFallbackReason] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [localVideoStream, setLocalVideoStream] = useState<MediaStream | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const micTrackRef = useRef<MediaStreamTrack | null>(null);
  const videoTrackRef = useRef<MediaStreamTrack | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number>(0);

  const enabledToolDefinitions = useMemo(() => {
    const enabled = new Set(tools.filter((tool) => tool.enabled).map((tool) => tool.name));
    return TOOL_DEFINITIONS.filter((tool) => enabled.has(tool.name));
  }, [tools]);

  const addTranscript = useCallback((item: Omit<TranscriptItem, "id" | "timestamp">) => {
    setTranscript((prev) => [
      ...prev,
      { ...item, id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, timestamp: new Date() },
    ]);
  }, []);

  const sendEvent = useCallback((event: Record<string, unknown>) => {
    if (dcRef.current?.readyState === "open") {
      dcRef.current.send(JSON.stringify(event));
    }
  }, []);

  const cleanupLocalVideo = useCallback(() => {
    videoTrackRef.current?.stop();
    videoTrackRef.current = null;
    setLocalVideoStream((current) => {
      current?.getTracks().forEach((track) => track.stop());
      return null;
    });
  }, []);

  const handleServerEvent = useCallback(
    async (event: MessageEvent) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(event.data as string);
      } catch {
        return;
      }

      const type = msg.type as string;

      switch (type) {
        case "session.created":
        case "session.updated":
          setStatus("connected");
          break;
        case "input_audio_buffer.speech_started":
          setStatus("listening");
          break;
        case "input_audio_buffer.speech_stopped":
          setStatus("thinking");
          break;
        case "response.created":
          setStatus("thinking");
          break;
        case "response.audio.delta":
          setStatus("speaking");
          break;
        case "response.audio_transcript.done": {
          const text = (msg.transcript as string) || "";
          if (text.trim()) addTranscript({ role: "assistant", text });
          break;
        }
        case "conversation.item.input_audio_transcription.completed": {
          const text = (msg.transcript as string) || "";
          if (text.trim()) addTranscript({ role: "user", text });
          break;
        }
        case "response.done":
          setStatus("connected");
          break;
        case "response.function_call_arguments.done": {
          const callId = msg.call_id as string;
          const fnName = msg.name as string;
          let args: Record<string, unknown> = {};
          try {
            args = JSON.parse((msg.arguments as string) || "{}");
          } catch {
            args = {};
          }

          addTranscript({
            role: "tool",
            text: `CALL ${fnName}(${JSON.stringify(args)})`,
            toolName: fnName,
          });

          const result = await executeToolCall(fnName, args);

          addTranscript({
            role: "tool",
            text: result,
            toolName: fnName,
            toolResult: result,
          });

          sendEvent({
            type: "conversation.item.create",
            item: { type: "function_call_output", call_id: callId, output: result },
          });
          sendEvent({ type: "response.create" });
          break;
        }
        case "error": {
          const errMsg = (msg.error as Record<string, unknown>)?.message || "Erreur inconnue";
          console.error("Realtime API error:", msg);
          addTranscript({ role: "tool", text: `❌ Erreur: ${errMsg}`, toolName: "system" });
          setStatus("error");
          break;
        }
        default:
          break;
      }
    },
    [addTranscript, sendEvent]
  );

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      audioContextRef.current?.close().catch(() => undefined);
      cleanupLocalVideo();
    };
  }, [cleanupLocalVideo]);

  const startVolumeAnalyser = useCallback((stream: MediaStream) => {
    try {
      audioContextRef.current?.close().catch(() => undefined);
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      audioContextRef.current = ctx;

      const tick = () => {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / Math.max(1, data.length);
        setVolume(Math.min(1.2, avg / 110));
        animFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      // ignore analyser failures
    }
  }, []);

  const connect = useCallback(async () => {
    setStatus("connecting");
    setIsMuted(false);
    setCameraError(null);

    try {
      const wantsVideo = settings.realtimeVideo.enabled;
      const res = await fetch("/api/realtime/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enableVideo: wantsVideo } satisfies RealtimeSessionRequest),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to get session token" }));
        throw new Error(err.error || "Failed to get session token");
      }
      const data = (await res.json()) as RealtimeSessionBootstrap;
      const ephemeralKey: string | undefined = data.client_secret?.value;
      if (!ephemeralKey) throw new Error("Aucune clé de session reçue");

      const serverVideoCapable = Boolean(data.capabilities?.videoInput);
      const resolvedVideoMode = data.capabilities?.videoMode === "camera-feed" && wantsVideo ? "camera-feed" : "architecture-only";
      const resolvedFallbackReason =
        data.capabilities?.fallbackReason ||
        settings.realtimeVideo.fallbackReason ||
        "Le flux webcam temps réel n’est pas pleinement supporté par la session courante.";

      setVideoEnabledInSession(wantsVideo && serverVideoCapable);
      setVideoSupportMode(resolvedVideoMode);
      setVideoFallbackReason(wantsVideo && !serverVideoCapable ? resolvedFallbackReason : null);

      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      const audio = document.createElement("audio");
      audio.autoplay = true;
      audioRef.current = audio;
      pc.ontrack = (e) => {
        audio.srcObject = e.streams[0];
        audio.play().catch(() => undefined);
      };

      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      const audioTrack = audioStream.getTracks()[0];
      micTrackRef.current = audioTrack;
      pc.addTrack(audioTrack, audioStream);
      startVolumeAnalyser(audioStream);

      if (wantsVideo) {
        try {
          const videoStream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: "user",
            },
          });
          const videoTrack = videoStream.getVideoTracks()[0] || null;
          videoTrackRef.current = videoTrack;
          setLocalVideoStream(videoStream);

          if (videoTrack && serverVideoCapable) {
            pc.addTrack(videoTrack, videoStream);
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : "Accès webcam refusé ou indisponible";
          console.warn("Webcam non disponible:", message);
          setCameraError("Impossible d’accéder à la caméra pour le moment.");
        }
      } else {
        cleanupLocalVideo();
        setCameraError(null);
        setVideoEnabledInSession(false);
        setVideoSupportMode("architecture-only");
        setVideoFallbackReason(null);
      }

      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;
      dc.onmessage = handleServerEvent;
      dc.onopen = () => {
        sendEvent({
          type: "session.update",
          session: {
            modalities: ["audio", "text"],
            instructions: settings.systemPrompt,
            voice: settings.voice || "shimmer",
            input_audio_transcription: { model: "whisper-1" },
            turn_detection: {
              type: "server_vad",
              silence_duration_ms: 600,
              threshold: 0.5,
              prefix_padding_ms: 300,
            },
            tools: enabledToolDefinitions,
            tool_choice: enabledToolDefinitions.length > 0 ? "auto" : "none",
          },
        });
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpRes = await fetch("https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ephemeralKey}`,
          "Content-Type": "application/sdp",
        },
        body: offer.sdp,
      });
      if (!sdpRes.ok) throw new Error("Échec de la négociation audio temps réel");

      const answer: RTCSessionDescriptionInit = {
        type: "answer",
        sdp: await sdpRes.text(),
      };
      await pc.setRemoteDescription(answer);
      setStatus("connected");
    } catch (err) {
      console.error("Connection error:", err);
      addTranscript({
        role: "tool",
        text: `❌ ${err instanceof Error ? err.message : "Erreur de connexion"}`,
        toolName: "system",
      });
      setStatus("error");
    }
  }, [settings, handleServerEvent, sendEvent, startVolumeAnalyser, addTranscript, enabledToolDefinitions, cleanupLocalVideo]);

  const disconnect = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    dcRef.current?.close();
    pcRef.current?.close();
    micTrackRef.current?.stop();
    cleanupLocalVideo();
    if (audioRef.current) audioRef.current.srcObject = null;
    analyserRef.current = null;
    audioContextRef.current?.close().catch(() => undefined);
    audioContextRef.current = null;
    pcRef.current = null;
    dcRef.current = null;
    micTrackRef.current = null;
    setStatus("disconnected");
    setVolume(0);
    setCameraError(null);
    setVideoEnabledInSession(false);
  }, [cleanupLocalVideo]);

  const toggleMute = useCallback(() => {
    if (micTrackRef.current) {
      const nextMuted = !isMuted;
      micTrackRef.current.enabled = !nextMuted;
      setIsMuted(nextMuted);
    }
  }, [isMuted]);

  const sendText = useCallback(
    (text: string) => {
      if (dcRef.current?.readyState === "open" && text.trim()) {
        sendEvent({
          type: "conversation.item.create",
          item: {
            type: "message",
            role: "user",
            content: [{ type: "input_text", text }],
          },
        });
        sendEvent({ type: "response.create" });
        addTranscript({ role: "user", text });
      }
    },
    [sendEvent, addTranscript]
  );

  const clearTranscript = useCallback(() => setTranscript([]), []);

  return {
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
    videoEnabledInSession,
    videoSupportMode,
    videoFallbackReason,
    cameraError,
  };
}
