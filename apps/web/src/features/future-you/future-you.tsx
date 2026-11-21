"use client";

import { faChevronLeft, faMicrophone } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useEffect, useState } from "react";
import { VoiceBeam } from "voice-glow";
import { FuturePortrait } from "./future-portrait";
import { type FutureContext, type VoiceStyle, requestFutureContext } from "./scenarios";
import { useFutureVoice } from "./use-future-voice";
import styles from "./future-you.module.css";

function pendingVoiceMotion() {
  return { gather: 1, offset: Math.sin(performance.now() / 450) * .68, heldLevel: .48 };
}

export function FutureYou() {
  const [context, setContext] = useState<FutureContext | null>(null);
  const [portraitVoice, setPortraitVoice] = useState<VoiceStyle>();
  const [portraitPending, setPortraitPending] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const voice = useFutureVoice();

  useEffect(() => {
    const request = new AbortController();
    requestFutureContext(request.signal).then((savedContext) => {
      if (request.signal.aborted) return;
      setContext(savedContext);
    }).catch((cause) => {
      if (!request.signal.aborted) setError(cause instanceof Error ? cause.message : "Could not load your saved goals.");
    });
    return () => request.abort();
  }, [attempt]);

  return (
    <main id="main" tabIndex={-1} className={styles.screen}>
      <div className={styles.topBar}>
        <Link className={styles.back} href="/goals">
          <FontAwesomeIcon icon={faChevronLeft} /> Future You
        </Link>
        {context?.is_demo && <span className={styles.demo}>Demo</span>}
      </div>
      <section className={styles.conversation} aria-labelledby="conversation-title">
        <h1 id="conversation-title">Talk to your future self</h1>
        {context?.profile_available ? (
          <>
            <p className={styles.meetingGoal}>{context.years_from_now} years from now</p>
            <FuturePortrait
              demo={context.is_demo}
              available={context.media_available}
              speaking={voice.speaking}
              callActive={voice.status !== "idle"}
              pending={portraitPending}
              onPending={setPortraitPending}
              onVoiceMatch={setPortraitVoice}
            >
              <p className={styles.portraitLabel}>
                {context.profile_name ? `Future ${context.profile_name}` : "Future You"}
                {context.future_age !== null && ` · Age ${context.future_age}`}
              </p>
            </FuturePortrait>
            {context.voice_available ? (
              <VoiceBeam className={styles.voiceBeam} theme="dark" colorVariant="ice"
                stream={voice.remoteStream}
                motion={voice.status === "connecting" || voice.processing ? pendingVoiceMotion : undefined}
                idle={.2} strength={.8}>
                <div className={styles.voiceControls}>
                  <audio ref={voice.audio} autoPlay playsInline />
                  <p className={styles.callStatus} data-connecting={voice.status === "connecting"} role="status">
                    {voice.status === "connecting" && "Connecting voice…"}
                    {voice.status === "live" && (voice.speaking ? "Future You is speaking" : voice.muted ? "Microphone muted" : "Live · Microphone on")}
                  </p>
                  {voice.error && <p role="alert">{voice.error}</p>}
                  {voice.status === "idle" ? (
                    <button className={styles.primary} disabled={portraitPending} onClick={() => void voice.start(portraitVoice)}>
                      <FontAwesomeIcon icon={faMicrophone} /> Start live conversation
                    </button>
                  ) : (
                    <div className={styles.callActions}>
                      {voice.status === "live" && (
                        <button className={styles.secondary} aria-pressed={voice.muted} onClick={voice.toggleMute}>
                          {voice.muted ? "Unmute" : "Mute"}
                        </button>
                      )}
                      <button className={`${styles.secondary} ${styles.endCall}`} onClick={voice.stop}>
                        {voice.status === "connecting" ? "Cancel connection" : "End conversation"}
                      </button>
                    </div>
                  )}
                  {voice.needsPlayback && (
                    <button className={styles.primary} onClick={() => void voice.play()}>Play voice audio</button>
                  )}
                  {(voice.heard || voice.caption) && (
                    <div className={styles.captions} aria-live="polite">
                      {voice.heard && <p><strong>You</strong>{voice.heard}</p>}
                      {voice.caption && <p><strong>Future You</strong>{voice.caption}</p>}
                    </div>
                  )}
                </div>
              </VoiceBeam>
            ) : <p role="status">Live voice is unavailable in this dev session.</p>}
          </>
        ) : error ? (
          <div role="alert">
            <p>{error}</p>
            <button className={styles.secondary} onClick={() => {
              setError("");
              setAttempt((value) => value + 1);
            }}>Try again</button>
          </div>
        ) : (
          <p role="status">{context ? "No saved profile is available." : "Loading your profile…"}</p>
        )}
      </section>
    </main>
  );
}
