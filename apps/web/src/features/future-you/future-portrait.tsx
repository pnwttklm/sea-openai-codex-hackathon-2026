"use client";

import Image from "next/image";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { prepareSelfie } from "./prepare-selfie";
import { type VoiceStyle, requestOverviewPortrait, voiceStyles } from "./scenarios";
import styles from "./future-you.module.css";

export function FuturePortrait({ demo, available, speaking, callActive, pending, onPending, onVoiceMatch, children }: {
  children: ReactNode;
  demo: boolean;
  available: boolean;
  speaking: boolean;
  callActive: boolean;
  pending: boolean;
  onPending: (pending: boolean) => void;
  onVoiceMatch: (style: VoiceStyle | undefined) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [portrait, setPortrait] = useState("");
  const [error, setError] = useState("");
  const picker = useRef<HTMLInputElement>(null);
  const request = useRef<AbortController | null>(null);
  const imageUrl = useRef("");

  useEffect(() => () => {
    request.current?.abort();
    if (imageUrl.current) URL.revokeObjectURL(imageUrl.current);
  }, []);

  async function generate() {
    if (!file || request.current || callActive) return;
    const controller = new AbortController();
    request.current = controller;
    setError("");
    onPending(true);
    try {
      const png = await prepareSelfie(file);
      const response = await requestOverviewPortrait(png, controller.signal);
      const image = await response.blob();
      if (controller.signal.aborted) return;
      if (image.type !== "image/png" || !image.size) throw new Error("The portrait service returned an invalid image.");
      if (imageUrl.current) URL.revokeObjectURL(imageUrl.current);
      imageUrl.current = URL.createObjectURL(image);
      setPortrait(imageUrl.current);
      const match = response.headers.get("X-Future-Voice-Style");
      onVoiceMatch(voiceStyles.find((style) => style === match));
      setFile(null);
    } catch (cause) {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Could not create the portrait.");
    } finally {
      request.current = null;
      if (!controller.signal.aborted) onPending(false);
    }
  }

  return (
    <div>
      <div className={styles.orbit} data-speaking={speaking}>
        <div className={styles.portraitFrame}>
          {portrait ? (
            <Image src={portrait} alt="AI-generated older portrait of you" width={480} height={480} unoptimized />
          ) : demo ? (
            <Image src="/future-you/adult-nobita.webp" alt="Adult Nobita holding a book" width={1920} height={1080} sizes="220px" priority />
          ) : (
            <div className={styles.avatarPlaceholder} aria-hidden="true" />
          )}
        </div>
      </div>
      {children}
      {available && (
        <>
          <input ref={picker} type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={(event) => {
            setFile(event.currentTarget.files?.[0] ?? null);
            setError("");
            event.currentTarget.value = "";
          }} />
          <button className={styles.photoButton} type="button" disabled={pending || callActive} onClick={() => picker.current?.click()}>
            {portrait ? "Change photo" : "Use my photo"}
          </button>
          {file && (
            <div className={styles.photoSelection}>
              <p>{file.name}</p>
              <p className={styles.note}>Generate uses OpenAI to age your photo and match a voice to the portrait.</p>
              <button className={styles.secondary} type="button" disabled={pending || callActive} onClick={() => void generate()}>
                {pending ? "Creating your portrait…" : "Generate older portrait"}
              </button>
            </div>
          )}
          {error && <p role="alert">{error}</p>}
        </>
      )}
      <p className={styles.srOnly} role="status">
        {pending ? "Creating your portrait" : portrait ? "Your older portrait is ready" : ""}
      </p>
    </div>
  );
}
