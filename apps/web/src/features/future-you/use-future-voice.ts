"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getAudioContext } from "voice-glow";
import { type VoiceStyle, requestFutureVoice } from "./scenarios";

type Call = {
  controller: AbortController;
  peer?: RTCPeerConnection;
  stream?: MediaStream;
  timer?: number;
  reconnectTimer?: number;
};

export function useFutureVoice() {
  const audio = useRef<HTMLAudioElement>(null);
  const current = useRef<Call | null>(null);
  const [status, setStatus] = useState<"idle" | "connecting" | "live">("idle");
  const [error, setError] = useState("");
  const [caption, setCaption] = useState("");
  const [heard, setHeard] = useState("");
  const [muted, setMuted] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [needsPlayback, setNeedsPlayback] = useState(false);

  const release = useCallback(() => {
    const call = current.current;
    current.current = null;
    if (!call) return;
    window.clearTimeout(call.timer);
    window.clearTimeout(call.reconnectTimer);
    call.controller.abort();
    call.peer?.close();
    call.stream?.getTracks().forEach((track) => track.stop());
    if (audio.current) audio.current.srcObject = null;
  }, []);

  useEffect(() => release, [release]);

  const stop = useCallback(() => {
    release();
    setStatus("idle");
    setNeedsPlayback(false);
    setError("");
    setCaption("");
    setHeard("");
    setMuted(false);
    setSpeaking(false);
    setProcessing(false);
    setRemoteStream(null);
  }, [release]);

  function toggleMute() {
    const tracks = current.current?.stream?.getAudioTracks();
    if (!tracks?.length) return;
    const enabled = !tracks[0].enabled;
    tracks.forEach((track) => { track.enabled = enabled; });
    setMuted(!enabled);
  }

  async function play() {
    const call = current.current;
    const player = audio.current;
    if (!call || !player?.srcObject) return;
    try {
      await player.play();
      if (current.current === call) setNeedsPlayback(false);
    } catch {
      if (current.current === call) setNeedsPlayback(true);
    }
  }

  async function start(voiceStyle?: VoiceStyle) {
    if (current.current) return;
    setError("");
    setCaption("");
    setNeedsPlayback(false);
    if (!navigator.mediaDevices?.getUserMedia || !window.RTCPeerConnection) {
      setError("Live voice needs a supported browser on HTTPS or localhost.");
      return;
    }
    try {
      getAudioContext();
    } catch {
      // The voice call can still play when the glow's audio analyser is unavailable.
    }
    const call: Call = { controller: new AbortController() };
    current.current = call;
    setStatus("connecting");
    const fail = (message: string) => {
      if (current.current !== call) return;
      stop();
      setError(message);
    };
    call.timer = window.setTimeout(() => fail("Voice setup timed out. Try again."), 30_000);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (current.current !== call) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      call.stream = stream;
      const peer = new RTCPeerConnection();
      call.peer = peer;
      peer.ontrack = ({ track, streams }) => {
        const player = audio.current;
        if (!player || current.current !== call) return;
        const incoming = streams[0] ?? new MediaStream([track]);
        player.srcObject = incoming;
        setRemoteStream(incoming);
        void play();
      };
      peer.onconnectionstatechange = () => {
        if (current.current !== call) return;
        window.clearTimeout(call.reconnectTimer);
        if (peer.connectionState === "failed" || peer.connectionState === "closed") {
          fail("The voice connection ended. Start a new conversation to reconnect.");
        } else if (peer.connectionState === "disconnected") {
          call.reconnectTimer = window.setTimeout(() => {
            fail("The voice connection was lost. Start a new conversation to reconnect.");
          }, 5_000);
        }
      };
      stream.getAudioTracks().forEach((track) => {
        track.enabled = false;
        peer.addTrack(track, stream);
      });
      const events = peer.createDataChannel("oai-events");
      events.onopen = () => {
        if (current.current !== call) return;
        window.clearTimeout(call.timer);
        setStatus("live");
        setProcessing(true);
        stream.getAudioTracks().forEach((track) => { track.enabled = true; });
        events.send(JSON.stringify({ type: "response.create" }));
      };
      events.onclose = () => fail("The voice session ended. Start a new conversation to reconnect.");
      events.onmessage = ({ data }) => {
        if (current.current !== call || typeof data !== "string") return;
        let event: { type?: unknown; transcript?: unknown } | null;
        try {
          event = JSON.parse(data);
        } catch {
          return;
        }
        if (event?.type === "response.output_audio_transcript.done" && typeof event.transcript === "string") {
          setCaption(event.transcript);
        }
        if (event?.type === "conversation.item.input_audio_transcription.completed" && typeof event.transcript === "string") {
          setHeard(event.transcript);
        }
        if (event?.type === "response.created") setProcessing(true);
        if (event?.type === "response.done") setProcessing(false);
        if (event?.type === "output_audio_buffer.started") {
          setSpeaking(true);
          setProcessing(false);
        }
        if (event?.type === "output_audio_buffer.stopped" || event?.type === "output_audio_buffer.cleared") setSpeaking(false);
        if (event?.type === "error") fail("The voice service reported an error. Try again.");
      };
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      if (current.current !== call) return;
      const sdp = peer.localDescription?.sdp;
      if (!sdp) throw new Error("Could not prepare the voice connection. Try again.");
      const response = await requestFutureVoice(sdp, call.controller.signal, voiceStyle);
      const answer = await response.text();
      if (current.current === call) await peer.setRemoteDescription({ type: "answer", sdp: answer });
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "NotAllowedError") {
        fail("Allow microphone access in your browser to start a conversation.");
      } else if (cause instanceof DOMException && cause.name === "NotFoundError") {
        fail("Connect a microphone and try again.");
      } else {
        fail(cause instanceof Error ? cause.message : "Could not connect to Future You.");
      }
    }
  }

  return { audio, status, error, caption, heard, muted, speaking, processing, remoteStream, needsPlayback, play, start, stop, toggleMute };
}
