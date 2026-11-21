"use client";

import { useEffect, useState, type ReactNode } from "react";
import { apiGet, ApiError } from "@/lib/api/client";
import type { components } from "@/lib/api/demo.generated";

type Schemas = components["schemas"];
export type PortfolioData = Schemas["Portfolio"];
export type BehaviorData = Schemas["Behavior"];
export type StockData = Schemas["Stock"];
export type Factor = Schemas["Factor"];
export type Range = keyof PortfolioData["history"];

export function DemoData<T>({ path, title, children }: {
  path: `/${string}`;
  title: string;
  children: (data: T) => ReactNode;
}) {
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState<{ data: T } | { error: unknown }>();

  useEffect(() => {
    const controller = new AbortController();
    apiGet<T>(path, controller.signal).then(
      (data) => { if (!controller.signal.aborted) setResult({ data }); },
      (error: unknown) => { if (!controller.signal.aborted) setResult({ error }); },
    );
    return () => controller.abort();
  }, [path, retry]);

  if (!result) return <p className="demo-state" role="status">Loading {title}…</p>;
  if ("data" in result) return children(result.data);

  const missing = result.error instanceof ApiError && result.error.status === 404;
  return (
    <section className="demo-state" role="alert">
      <h1>{missing ? "Stock not found" : `Could not load ${title}`}</h1>
      {!missing && <button type="button" onClick={() => { setResult(undefined); setRetry((n) => n + 1); }}>Try again</button>}
    </section>
  );
}

export const usd = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const thb = new Intl.NumberFormat("en-US", { style: "currency", currency: "THB", currencyDisplay: "code", maximumFractionDigits: 0 });
export function signed(value: number, digits = 2) {
  return new Intl.NumberFormat("en-US", { signDisplay: "exceptZero", maximumFractionDigits: digits }).format(value);
}

export const thbCash = new Intl.NumberFormat("en-US", { style: "currency", currency: "THB", currencyDisplay: "code", minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function toSatang(usdCents: number, fxRateMicros: number) {
  return Number((BigInt(usdCents) * BigInt(fxRateMicros) + BigInt(500_000)) / BigInt(1_000_000));
}
