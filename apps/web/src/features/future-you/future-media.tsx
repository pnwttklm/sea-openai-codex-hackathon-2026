"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { type Plan, requestFutureVideo, requestFuturePortrait } from "./scenarios";
import { prepareSelfie } from "./prepare-selfie";
import styles from "./future-you.module.css";

type GeneratedImage = { data: Blob; url: string };
type MediaJob = { kind: "image"; file: File } | { kind: "video"; image: Blob };

export function FutureMedia({ plan, available, children }: { plan: Plan; available: boolean; children: ReactNode }) {
  const [selfie, setSelfie] = useState<File | null>(null);
  const [image, setImage] = useState<GeneratedImage | null>(null);
  const [video, setVideo] = useState<string | null>(null);
  const [pending, setPending] = useState<"image" | "video" | null>(null);
  const [error, setError] = useState("");
  const request = useRef<AbortController | null>(null);
  const urls = useRef<string[]>([]);

  useEffect(() => {
    const objectUrls = urls.current;
    return () => {
      request.current?.abort();
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
      objectUrls.length = 0;
    };
  }, []);

  async function create(job: MediaJob) {
    if (!available || request.current) return;
    const { kind } = job;
    const controller = new AbortController();
    request.current = controller;
    setPending(kind);
    setError("");

    try {
      const source = job.kind === "image" ? await prepareSelfie(job.file) : job.image;
      if (controller.signal.aborted) return;
      const response = kind === "image"
        ? await requestFuturePortrait(source, plan, controller.signal)
        : await requestFutureVideo(source, controller.signal);
      const data = await response.blob();
      if (controller.signal.aborted) return;
      const expectedType = kind === "image" ? "image/png" : "video/mp4";
      if (!data.size || data.type !== expectedType) throw new Error(`The service returned an invalid ${kind}. Try again.`);
      const url = URL.createObjectURL(data);
      urls.current.push(url);
      if (kind === "image") {
        setImage({ data, url });
        setSelfie(null);
      } else {
        setVideo(url);
      }
    } catch (cause) {
      if (!controller.signal.aborted) {
        setError(cause instanceof Error ? cause.message : `Could not create your ${kind}. Try again.`);
      }
    } finally {
      request.current = null;
      if (!controller.signal.aborted) setPending(null);
    }
  }

  return (
    <div className={styles.media}>
      <h3>Picture your future self</h3>
      {available ? (
        <>
          {!image && (
            <>
              <p id="future-photo-help">Choose a clear photo of your own face. We send it to OpenAI as soon as you select it to create your future portrait.</p>
              <label>
                Your photo
                <input className={styles.selfieInput} type="file" accept="image/jpeg,image/png,image/webp" disabled={pending !== null}
                  aria-describedby="future-photo-help"
                  onChange={(event) => {
                    const file = event.currentTarget.files?.[0];
                    if (!file) return;
                    setSelfie(file);
                    void create({ kind: "image", file });
                  }} />
              </label>
              {selfie && error && !pending && (
                <button className={styles.primary} onClick={() => void create({ kind: "image", file: selfie })}>
                  Retry portrait
                </button>
              )}
            </>
          )}
          {image && (
            <>
              <img className={styles.preview} src={image.url} alt="AI-generated portrait of an imagined future self" />
              {children}
              <a className={styles.download} href={image.url} download={`future-you-${plan.goal}.png`}>Download image</a>
              {!video && (
                <button className={styles.secondary} disabled={pending !== null} onClick={() => void create({ kind: "video", image: image.data })}>
                  Animate this image
                </button>
              )}
            </>
          )}
          {video && (
            <>
              <video className={styles.preview} src={video} poster={image?.url} controls playsInline aria-label="Silent video of the generated image" />
              <a className={styles.download} href={video} download={`future-you-${plan.goal}.mp4`}>Download video</a>
            </>
          )}
          <div role="status">
            {pending === "image" && <p>Generating your future image…</p>}
            {pending === "video" && <p>Generating a silent video from your image…</p>}
            {!pending && video && <p>Your silent video is ready.</p>}
            {!pending && !video && image && !error && <p>Your future image is ready.</p>}
          </div>
          {error && <p role="alert">{error}</p>}
        </>
      ) : <p>Image and video generation are unavailable in this browser session.</p>}
    </div>
  );
}
