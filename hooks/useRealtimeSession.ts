"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { SessionStatus, TranscriptItem, Settings } from "@/lib/types";
import { executeToolCall } from "@/lib/toolHandlers";
import { TOOL_DEFINITIONS } from "@/lib/tools";

export function useRealtimeSession(settings: Settings) {
  const [status, setStatus] = useState<SessionStatus>("idle");
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const micTrackRef = useRef<MediaStreamTrack | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);

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

  const handleServerEvent = useCallback(
    async (event: MessageEvent) => {
      let msg: Record<string, unknown>;
      try { msg = JSON.parse(event.data as string); } catch { return; }

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
          try { args = JSON.parse((msg.arguments as string) || "{}"); } catch { /* ignore */ }

          addTranscript({
            role: "tool",
            text: `🔧 ${fnName}(${JSON.stringify(args)})`,
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
      }
    },
    [addTranscript, sendEvent]
  );

  // Volume analyser
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const startVolumeAnalyser = useCallback((stream: MediaStream) => {
    try {
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const tick = () => {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setVolume(avg / 128);
        animFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch { /* ignore */ }
  }, []);

  const connect = useCallback(async () => {
    setStatus("connecting");
    try {
      // 1. Get ephemeral session token
      const res = await fetch("/api/realtime/session", { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to get session token");
      }
      const data = await res.json();
      const ephemeralKey: string = data.client_secret?.value;
      if (!ephemeralKey) throw new Error("No ephemeral key received");

      // 2. Create peer connection
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // 3. Audio output
      const audio = document.createElement("audio");
      audio.autoplay = true;
      audioRef.current = audio;
      pc.ontrack = (e) => { audio.srcObject = e.streams[0]; };

      // 4. Microphone input
      const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
      const track = ms.getTracks()[0];
      micTrackRef.current = track;
      pc.addTrack(track);
      startVolumeAnalyser(ms);

      // 5. Data channel for events
      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;
      dc.onmessage = handleServerEvent;
      dc.onopen = () => {
        // Configure session
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
            tools: TOOL_DEFINITIONS,
            tool_choice: "auto",
          },
        });
      };

      // 6. SDP offer/answer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpRes = await fetch(
        "https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${ephemeralKey}`,
            "Content-Type": "application/sdp",
          },
          body: offer.sdp,
        }
      );
      if (!sdpRes.ok) throw new Error("SDP negotiation failed");
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
  }, [settings, handleServerEvent, sendEvent, startVolumeAnalyser, addTranscript]);

  const disconnect = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    dcRef.current?.close();
    pcRef.current?.close();
    micTrackRef.current?.stop();
    if (audioRef.current) { audioRef.current.srcObject = null; }
    pcRef.current = null;
    dcRef.current = null;
    micTrackRef.current = null;
    setStatus("disconnected");
    setVolume(0);
  }, []);

  const toggleMute = useCallback(() => {
    if (micTrackRef.current) {
      micTrackRef.current.enabled = isMuted;
      setIsMuted(!isMuted);
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
  };
}
