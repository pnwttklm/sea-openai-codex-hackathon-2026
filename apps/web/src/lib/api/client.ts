const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000").replace(/\/$/, "");

export function isRemoteDemoPreview() {
  return process.env.NEXT_PUBLIC_SHARED_DEMO === "1" && typeof window !== "undefined"
    && !["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname);
}

export class ApiError extends Error {
  constructor(readonly status: number, message = `API request failed (${status})`) {
    super(message);
  }
}

/** Use agreed response types at call sites. Failed requests never resolve to fixtures. */
export async function apiGet<T>(path: `/${string}`, signal?: AbortSignal): Promise<T> {
  const sharedRead = /^\/api\/v1\/demo\/(portfolio|behavior|paper-account|stocks(?:\/[A-Z]{1,5})?)$/.test(path);
  const url = sharedRead && isRemoteDemoPreview() ? path.replace("/api/v1/", "/preview/") : baseUrl + path;
  const response = await fetch(url, { signal, cache: "no-store" });
  if (!response.ok) throw new ApiError(response.status);
  return response.json() as Promise<T>;
}

export async function apiPost<T>(path: `/${string}`, body: unknown, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  if (!response.ok) {
    const failure = await response.json().catch(() => null);
    throw new ApiError(response.status, typeof failure?.detail === "string" ? failure.detail : "Could not complete the order.");
  }
  return response.json() as Promise<T>;
}
