"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCommentDots, faXmark } from "@fortawesome/free-solid-svg-icons";
import { apiGet, apiPost } from "@/lib/api/client";
import type { components } from "@/lib/api/demo.generated";
import { signed, usd, type StockData } from "./data";
import { ResearchPanel } from "./research-chat";

type Schemas = components["schemas"];
type Side = Schemas["PaperOrder"]["side"];
type Reflection = Schemas["SellReflection"];
type PaperFill = Schemas["PaperFill"];
export type PaperAccount = Schemas["PaperAccount"];

export function PaperTrade({ stock }: { stock: StockData }) {
  const [side, setSide] = useState<Side>();
  const [research, setResearch] = useState(false);
  const [fill, setFill] = useState<PaperFill>();
  const trigger = useRef<HTMLButtonElement>(null);

  function start(side: Side, button: HTMLButtonElement) {
    trigger.current = button;
    setResearch(false);
    setSide(side);
  }

  function dismiss() {
    setSide(undefined);
    setResearch(false);
    requestAnimationFrame(() => trigger.current?.focus());
  }

  return (
    <>
      <div className="trade-preview" aria-label="Paper trading">
        <button type="button" onClick={(event) => start("buy", event.currentTarget)}>Buy</button>
        <button type="button" onClick={(event) => start("sell", event.currentTarget)}>Sell</button>
        <small>Paper trading</small>
      </div>
      <button className="stock-research" type="button" aria-expanded={research} onClick={(event) => {
        trigger.current = event.currentTarget;
        setSide(undefined);
        setResearch(true);
      }}><FontAwesomeIcon icon={faCommentDots} /> Ask Agent</button>
      {research && <ResearchPanel symbol={stock.symbol} onDismiss={() => {
        if (side) setResearch(false);
        else dismiss();
      }} />}
      {fill && (
        <p className="paper-receipt" role="status">
          Paper order filled · {fill.side === "buy" ? "Bought" : "Sold"} {fill.quantity} {fill.symbol} at USD {usd.format(fill.price_cents / 100)}.
          {" "}Cash after this fill: USD {usd.format(fill.account.cash_cents / 100)}.
        </p>
      )}
      {side && <OrderSheet key={side} stock={stock} side={side} onDismiss={dismiss} onFill={setFill} obscured={research} onResearch={() => setResearch(true)} />}
    </>
  );
}

function OrderSheet({ stock, side, onDismiss, onFill, onResearch, obscured }: {
  stock: StockData;
  side: Side;
  onDismiss: () => void;
  onFill: (fill: PaperFill) => void;
  onResearch: () => void;
  obscured: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [review, setReview] = useState(side === "buy" || stock.symbol !== "NVDA");
  const [reflection, setReflection] = useState<Reflection | null>();
  const [reply, setReply] = useState<"plan" | "news">();
  const [quantity, setQuantity] = useState("1");
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const attempt = useRef<{ id: string; quantity: number } | null>(null);
  const [error, setError] = useState("");
  const closePanel = useRef<HTMLButtonElement>(null);
  const shares = Number(quantity);
  const valid = Number.isInteger(shares) && shares >= 1 && shares <= 10000;

  useEffect(() => {
    const node = dialog.current;
    const trigger = document.activeElement;
    if (review) node?.showModal();
    else closePanel.current?.focus();
    return () => {
      node?.close();
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus();
    };
  }, [review]);

  useEffect(() => {
    if (!obscured && !review) closePanel.current?.focus();
  }, [obscured, review]);

  useEffect(() => {
    if (review) return;
    const controller = new AbortController();
    const path = `/api/v1/demo/stocks/${stock.symbol}/sell-reflection` as const;
    apiGet<Reflection>(path, controller.signal).then(
      (result) => {
        if (!controller.signal.aborted) {
          if (!result.prompt) setReview(true);
          else setReflection(result);
        }
      },
      () => { if (!controller.signal.aborted) setReflection(null); },
    );
    return () => controller.abort();
  }, [review, stock.symbol]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valid || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    if (attempt.current?.quantity !== shares) {
      attempt.current = { id: crypto.randomUUID(), quantity: shares };
    }
    try {
      const result = await apiPost<PaperFill>("/api/v1/demo/paper-orders", {
        order_id: attempt.current.id,
        symbol: stock.symbol, side, quantity: shares,
      } satisfies Schemas["PaperOrder"]);
      onFill(result);
      onDismiss();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not complete the paper order.");
      setBusy(false);
      inFlight.current = false;
    }
  }

  const prompt = reflection?.prompt;
  if (!review) {
    return (
      <section className="agent-panel" hidden={obscured} role="dialog" aria-labelledby="agent-title"
        onKeyDown={(event) => { if (event.key === "Escape") { event.stopPropagation(); onDismiss(); } }}>
        <div className="agent-toolbar">
          <span className="agent-mark" aria-hidden="true"><FontAwesomeIcon icon={faCommentDots} /></span>
          <div><h2 id="agent-title">Investing Agent</h2><p>{stock.symbol} · Before you sell</p></div>
          <button ref={closePanel} type="button" aria-label="Close agent" onClick={onDismiss}><FontAwesomeIcon icon={faXmark} /></button>
        </div>
        <div className="agent-thread">
          {prompt && <p className="agent-context">
            {stock.symbol} {signed(prompt.demo_change_percent)}% (simulation) · Behavior {prompt.behavior_score}/100
            {prompt.decision_score != null && ` · Decision ${prompt.decision_score}/10`}
          </p>}
          <div className="agent-message" aria-live="polite">
            {reflection === undefined ? <p>Checking Webull headlines for {stock.symbol}…</p>
              : <p>{prompt?.question ?? "Is this sale part of your original plan?"}</p>}
            {prompt?.news_status === "unavailable" && <p className="source-label">Webull news is unavailable right now.</p>}
            {prompt?.news_status === "empty" && <p className="source-label">No recent headlines were returned by Webull.</p>}
            {reflection === null && <p className="source-label">News and score details are unavailable.</p>}
          </div>
          {prompt && prompt.headlines.length > 0 && (
            <details className="agent-sources">
              <summary>Webull headlines · {prompt.headlines.length}</summary>
              <ul>{prompt.headlines.map((article) => (
                <li key={article.title}>
                  {article.url ? <a href={article.url} target="_blank" rel="noreferrer">{article.title}</a> : article.title}
                  {(article.publisher || article.published_at) && <small>{[article.publisher, article.published_at].filter(Boolean).join(" · ")}</small>}
                </li>
              ))}</ul>
            </details>
          )}
          {reply && (
            <div className="agent-exchange" role="log" aria-label="Your reply and agent response">
              <p className="agent-message agent-reply">{reply === "plan" ? "It’s part of my plan." : "New information changed my mind."}</p>
              <p className="agent-message">{reply === "plan"
                ? "Before confirming, check that the quantity matches what you planned to sell."
                : "What changed about your original reason for holding NVDA? Take a moment to separate the new information from the price move."}</p>
            </div>
          )}
        </div>
        <div className="agent-actions">
          {reflection !== undefined && !reply && <div className="agent-replies" aria-label="Suggested replies">
            <button type="button" onClick={() => setReply("plan")}>Part of my plan</button>
            <button type="button" onClick={() => setReply("news")}>New information</button>
          </div>}
          <button type="button" className="agent-research-link" onClick={onResearch}>Research this stock</button>
          <button className="agent-continue" type="button" onClick={() => setReview(true)}>{reply ? "Continue to review" : "Skip to review"}</button>
        </div>
      </section>
    );
  }

  return (
    <dialog
      ref={dialog}
      className="order-sheet"
      aria-labelledby="sheet-title"
      onCancel={(event) => { event.preventDefault(); if (!inFlight.current) onDismiss(); }}
      onClick={(event) => { if (event.target === event.currentTarget && !inFlight.current) onDismiss(); }}
    >
      <div className="order-sheet-content">
        <div className="card-heading">
          <h2 id="sheet-title">Review paper {side}</h2>
          <button type="button" disabled={busy} onClick={onDismiss}>Close</button>
        </div>
        <form onSubmit={submit}>
          <p>{stock.symbol} · USD {usd.format(stock.price_cents / 100)} per share</p>
          <label>Shares
            <input type="number" min={1} max={10000} step={1} required value={quantity} disabled={busy}
              onChange={(event) => { setQuantity(event.target.value); setError(""); }} />
          </label>
          <p>Estimated total · <strong>{valid ? `USD ${usd.format(stock.price_cents * shares / 100)}` : "—"}</strong></p>
          {error && <p role="alert" className="order-error">{error}</p>}
          <button className="order-primary" type="submit" disabled={!valid || busy}>{busy ? "Submitting…" : `Confirm paper ${side}`}</button>
        </form>
      </div>
    </dialog>
  );
}
