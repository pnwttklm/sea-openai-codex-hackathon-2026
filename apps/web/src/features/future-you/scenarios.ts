export type Plan = {
  goal: "wedding" | "retirement" | "time-machine" | "home";
  years: number;
};

export type SavedGoal = {
  id: string;
  name: string;
  saved: number;
  target: number;
  years: number;
  future_age: number | null;
};

export const voiceStyles = ["masculine", "feminine", "neutral"] as const;
export type VoiceStyle = (typeof voiceStyles)[number];

export type FutureContext = {
  profile_name: string | null;
  profile_available: boolean;
  years_from_now: number;
  future_age: number | null;
  voice_available: boolean;
  media_available: boolean;
  is_demo: boolean;
  goals: SavedGoal[];
};

export const money = (amount: number) =>
  `THB ${amount.toLocaleString("en", { maximumFractionDigits: 2 })}`;

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export async function requestFutureContext(signal: AbortSignal): Promise<FutureContext> {
  const response = await fetch(`${apiBase}/api/v1/future-you/context`, { signal, cache: "no-store" });
  return (await requireSuccess(response)).json();
}

export function requestFutureVoice(sdp: string, signal: AbortSignal, voiceStyle?: VoiceStyle) {
  return postFutureYou("voice", JSON.stringify({ sdp, voice_style: voiceStyle }), "application/json", signal);
}

export function requestOverviewPortrait(photo: Blob, signal: AbortSignal) {
  return postFutureYou("portrait", photo, "image/png", signal);
}

export function requestFuturePortrait(photo: Blob, plan: Plan, signal?: AbortSignal) {
  const query = new URLSearchParams({ goal: plan.goal, years: String(plan.years) });
  return postFutureYou(`image?${query}`, photo, "image/png", signal);
}

export function requestFutureVideo(image: Blob, signal?: AbortSignal) {
  return postFutureYou("video", image, "image/png", signal);
}

async function postFutureYou(
  action: "voice" | "video" | `image?${string}` | "portrait",
  content: BodyInit,
  contentType: string,
  signal?: AbortSignal,
) {
  const response = await fetch(`${apiBase}/api/v1/future-you/${action}`, {
    method: "POST",
    headers: { "Content-Type": contentType },
    body: content,
    signal,
  });
  return requireSuccess(response);
}

async function requireSuccess(response: Response) {
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(typeof body?.detail === "string" ? body.detail : "Could not process this scenario.");
  }
  return response;
}
