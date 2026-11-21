"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FuturePortrait } from "./future-portrait";
import { type FutureContext, type VoiceStyle, money, requestFutureContext } from "./scenarios";
import { useFutureVoice } from "./use-future-voice";
import styles from "./future-you.module.css";

export function FutureYou() {
  const [context, setContext] = useState<FutureContext | null>(null);
  const [meeting, setMeeting] = useState(false);
  const [portraitVoice, setPortraitVoice] = useState<VoiceStyle>();
  const [portraitPending, setPortraitPending] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const enter = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef(false);
  const conversationTitle = useRef<HTMLHeadingElement>(null);
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

  useEffect(() => {
    if (meeting) conversationTitle.current?.focus();
    else if (returnFocus.current) {
      enter.current?.focus();
      returnFocus.current = false;
    }
  }, [meeting]);

  function leaveConversation() {
    voice.stop();
    returnFocus.current = true;
    setMeeting(false);
    setPortraitVoice(undefined);
    setPortraitPending(false);
  }

  if (meeting && context) {
    return (
      <div className={styles.screen}>
        <section className={styles.conversation} aria-labelledby="conversation-title">
          <div className={styles.topBar}>
            <button className={styles.back} onClick={leaveConversation}>‹ Back to Future You</button>
            {context.is_demo && <span className={styles.demo}>Demo</span>}
          </div>
          <div className={styles.intro}>
            <h1 id="conversation-title" ref={conversationTitle} tabIndex={-1}>Talk to your future self</h1>
            <p className={styles.meetingGoal}>{context.years_from_now} years from now</p>
          </div>
          <FuturePortrait
            demo={context.is_demo}
            available={context.media_available}
            speaking={voice.speaking}
            callActive={voice.status !== "idle"}
            pending={portraitPending}
            onPending={setPortraitPending}
            onVoiceMatch={setPortraitVoice}
          />
          <p className={styles.portraitLabel}>
            {context.profile_name ? `Future ${context.profile_name}` : "Future You"}
            {context.future_age !== null && ` · Age ${context.future_age}`}
          </p>
          {context.voice_available ? (
            <div className={styles.voiceControls}>
              <audio ref={voice.audio} autoPlay playsInline />
              <p className={styles.callStatus} data-connecting={voice.status === "connecting"} role="status">
                {voice.status === "connecting" && "Connecting voice…"}
                {voice.status === "live" && (voice.speaking ? "Future You is speaking" : voice.muted ? "Microphone muted" : "Live · Microphone on")}
              </p>
              {voice.error && <p role="alert">{voice.error}</p>}
              {voice.status === "idle" ? (
                <button className={styles.primary} disabled={portraitPending} onClick={() => void voice.start(portraitVoice)}>
                  Start live conversation
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
          ) : <p role="status">Live voice is unavailable in this dev session.</p>}
          <p className={styles.conversationHint}>Try asking, “What should I focus on with my portfolio today?”</p>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.screen}>
      <div className={styles.dashboard}>
        <div className={styles.topBar}>
          <Link className={styles.back} href="/">‹ Prik Thai AI</Link>
          {context?.is_demo && <span className={styles.demo}>Demo</span>}
        </div>
        <section className={styles.hero} aria-labelledby="future-you-title">
          <h1 id="future-you-title">Future You</h1>
          <Image src="/future-you-family.png" alt="" width={295} height={159} priority />
          <div className={styles.heroPlan}>
            {context?.profile_available ? (
              <>
                <p>See the big picture across your goals and portfolio.</p>
                <button className={styles.primary} ref={enter} onClick={() => setMeeting(true)}>Meet future me</button>
              </>
            ) : error ? (
              <>
                <p role="alert">{error}</p>
                <button className={styles.secondary} onClick={() => {
                  setError("");
                  setAttempt((value) => value + 1);
                }}>Try again</button>
              </>
            ) : context ? (
              <p role="status">No saved profile is available.</p>
            ) : (
              <p className={styles.loading} role="status">Loading your profile…</p>
            )}
          </div>
        </section>

        {!!context?.goals.length && (
          <section className={styles.goals} aria-label="Saved goals">
            {context.goals.map((goal) => (
              <article className={styles.goal} key={goal.id}>
                <span>{goal.name}</span>
                <strong>{money(goal.saved)}</strong>
                <small>of {money(goal.target)} saved</small>
                <progress aria-label={`${goal.name} savings progress`} value={goal.saved} max={goal.target} />
                <small>{goal.years} {goal.years === 1 ? "year" : "years"} left</small>
              </article>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
