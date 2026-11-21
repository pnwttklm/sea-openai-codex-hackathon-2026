"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { DistortionWave } from "distortion-waves";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faChevronRight, faXmark } from "@fortawesome/free-solid-svg-icons";
import { apiGet, apiPost } from "@/lib/api/client";
import type { components } from "@/lib/api/demo.generated";
import { DemoData, signed, thbCash, toSatang, usd, type StockData } from "./data";
import { TradePlanCheck, useTradeCheck } from "./trade-plan-check";
import { AgentAvatar } from "./agent-avatar";
import { Mascot } from "../companion/mascots";

type Schemas = components["schemas"];
type Side = Schemas["PaperOrder"]["side"];
type Reflection = Schemas["SellReflection"];
type PaperFill = Schemas["PaperFill"];
type PaperFX = Schemas["PaperFX"];
const rateFormat = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 6 });
type OrderType = NonNullable<Schemas["PaperOrder"]["order_type"]>;
export type PaperAccount = Schemas["PaperAccount"];

export function PaperTrade({ stock, onAsk }: { stock: StockData; onAsk?: () => void }) {
  const [side, setSide] = useState<Side>();
  const [fill, setFill] = useState<PaperFill>();
  const [orderRevision, setOrderRevision] = useState(0);
  const [ordersOpen, setOrdersOpen] = useState(false);

  function recordFill(result: PaperFill) {
    setFill(result);
    setOrderRevision((revision) => revision + 1);
    if (result.status === "open") setOrdersOpen(true);
  }
  const trigger = useRef<HTMLButtonElement>(null);

  function start(side: Side, button: HTMLButtonElement) {
    trigger.current = button;
    setSide(side);
  }

  function dismiss() {
    setSide(undefined);
    requestAnimationFrame(() => trigger.current?.focus());
  }

  return (
    <>
      <div className="trade-preview" aria-label="Demo trading">
        <button type="button" onClick={(event) => start("buy", event.currentTarget)}>Buy</button>
        <button type="button" onClick={(event) => start("sell", event.currentTarget)}>Sell</button>
      </div>
      {onAsk && <button className="stock-agent-action" type="button" aria-haspopup="dialog" onClick={onAsk}>
        <Mascot agent="companion" size={40} />
        <span>Ask Doraemon about {stock.symbol}</span>
        <FontAwesomeIcon icon={faChevronRight} aria-hidden="true" />
      </button>}
      {fill && (
        <p className="paper-receipt" role="status">
          {fill.status === "open" ? `Limit order placed · ${fill.quantity} ${fill.symbol} · Open`
            : `Order filled · ${fill.side === "buy" ? "Bought" : "Sold"} ${fill.quantity} ${fill.symbol} at USD ${usd.format((fill.price_cents ?? 0) / 100)}.`}
        </p>
      )}
      <button type="button" className="stock-research" aria-expanded={ordersOpen} onClick={() => setOrdersOpen(!ordersOpen)}>Open orders</button>
      {ordersOpen && <OpenOrders key={orderRevision} symbol={stock.symbol} onCancelled={(id) => {
        if (fill?.order_id === id) setFill(undefined);
      }} />}
      {side && <OrderSheet key={side} stock={stock} side={side} onDismiss={dismiss} onFill={recordFill} onAsk={onAsk} />}
    </>
  );
}

function OpenOrders({ symbol, onCancelled }: { symbol: string; onCancelled: (id: string) => void }) {
  const [cancelled, setCancelled] = useState<string[]>([]);
  const [cancelling, setCancelling] = useState<string>();
  const [error, setError] = useState("");

  async function cancel(id: string) {
    setCancelling(id);
    setError("");
    try {
      await apiPost<PaperFill>(`/api/v1/demo/paper-orders/${id}/cancel`, {});
      setCancelled((previous) => [...previous, id]);
      onCancelled(id);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not cancel the order.");
    } finally {
      setCancelling(undefined);
    }
  }

  return <section className="paper-account" aria-label="Open orders">
    <h2>Open orders · {symbol}</h2>
    <DemoData<PaperFill[]> path="/api/v1/demo/paper-orders/open" title="open orders">
      {(orders) => {
        const active = orders.filter((order) => order.symbol === symbol && !cancelled.includes(order.order_id));
        return active.length ? (
          <div className="open-order-list">
            {active.map((order) => (
              <div key={order.order_id}>
                <span>{order.side === "buy" ? "Buy" : "Sell"} {order.quantity} · Limit USD {usd.format((order.limit_price_cents ?? 0) / 100)}</span>
                <button type="button" disabled={!!cancelling} onClick={() => void cancel(order.order_id)}>{cancelling === order.order_id ? "Cancelling…" : "Cancel order"}</button>
              </div>
            ))}
          </div>
        ) : <p>No open orders for {symbol}.</p>;
      }}
    </DemoData>
    {error && <p className="order-error" role="alert">{error}</p>}
    {cancelled.length > 0 && <p role="status">Order cancelled.</p>}
  </section>;
}

function OrderSheet({ stock, side, onDismiss, onFill, onAsk }: {
  stock: StockData;
  side: Side;
  onDismiss: () => void;
  onFill: (fill: PaperFill) => void;
  onAsk?: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const confirmButton = useRef<HTMLButtonElement>(null);
  const formId = useId();
  const [receipt, setReceipt] = useState<PaperFill>();
  const [review, setReview] = useState(true);
  const [reflection, setReflection] = useState<Reflection | null>();
  const [reply, setReply] = useState<"plan" | "news">();
  const [quantity, setQuantity] = useState("1");
  const [orderType, setOrderType] = useState<OrderType>("market");
  const [limitInput, setLimitInput] = useState((stock.price_cents / 100).toFixed(2));
  const [reviewingOrder, setReviewingOrder] = useState(false);
  const [fx, setFX] = useState<PaperFX>();
  const [fxError, setFXError] = useState(false);
  const [fxAttempt, setFXAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const attempt = useRef<{ id: string; signature: string } | null>(null);
  const [error, setError] = useState("");
  const closePanel = useRef<HTMLButtonElement>(null);
  const shares = Number(quantity);
  const limit = /^\d+(?:\.\d{1,2})?$/.test(limitInput) ? Math.round(Number(limitInput) * 100) : 0;
  const valid = Number.isInteger(shares) && shares >= 1 && shares <= 10000
    && (orderType === "market" || (limit >= 1 && limit <= 100_000_000));
  const isMarketable = orderType === "market" || (side === "buy" ? stock.price_cents <= limit : stock.price_cents >= limit);
  const estimatedPrice = orderType === "market" ? stock.price_cents : limit;
  const check = useTradeCheck(review && valid && fx && !receipt ? {
    symbol: stock.symbol, side, quantity: shares, order_type: orderType,
    estimated_satang: toSatang(estimatedPrice * shares, fx.rate_micros),
  } : null);
  const statusTitle = receipt?.status === "open" ? "Limit order placed" : "Order filled";

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

  useEffect(() => {
    if (!review) return;
    const controller = new AbortController();
    apiGet<PaperFX>("/api/v1/demo/paper-fx", controller.signal).then(
      (rate) => { if (!controller.signal.aborted) setFX(rate); },
      () => { if (!controller.signal.aborted) setFXError(true); },
    );
    return () => controller.abort();
  }, [review, fxAttempt]);

  function refreshFX() {
    setFX(undefined);
    setFXError(false);
    setError("");
    setReviewingOrder(false);
    setFXAttempt((value) => value + 1);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valid || !fx || inFlight.current || receipt || (reviewingOrder && check.pending)) return;
    if (!reviewingOrder) {
      setReviewingOrder(true);
      setError("");
      requestAnimationFrame(() => confirmButton.current?.focus());
      return;
    }
    inFlight.current = true;
    setBusy(true);
    setError("");
    const signature = `${orderType}:${shares}:${orderType === "limit" ? limit : ""}:${fx.rate_micros}`;
    if (attempt.current?.signature !== signature) {
      attempt.current = { id: crypto.randomUUID(), signature };
    }
    try {
      const result = await apiPost<PaperFill>("/api/v1/demo/paper-orders", {
        order_id: attempt.current.id,
        symbol: stock.symbol, side, quantity: shares, order_type: orderType,
        limit_price_cents: orderType === "limit" ? limit : null,
        fx_rate_micros: fx.rate_micros,
      } satisfies Schemas["PaperOrder"]);
      setReceipt(result);
      onFill(result);
      setBusy(false);
      inFlight.current = false;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not complete the order.");
      setBusy(false);
      inFlight.current = false;
    }
  }

  const prompt = reflection?.prompt;
  if (!review) {
    return (
      <section className="agent-panel" role="dialog" aria-labelledby="agent-title"
        onKeyDown={(event) => { if (event.key === "Escape") { event.stopPropagation(); onDismiss(); } }}>
        <div className="agent-toolbar">
          <AgentAvatar busy={reflection === undefined} />
          <div><h2 id="agent-title">Investing Agent</h2><p>{stock.symbol} · Before you sell</p></div>
          <button ref={closePanel} type="button" aria-label="Close agent" onClick={onDismiss}><FontAwesomeIcon icon={faXmark} /></button>
        </div>
        <div className="agent-thread">
          {prompt && <p className="agent-context">
            {stock.symbol} {signed(prompt.demo_change_percent)}% (simulation) · Investor Health {prompt.behavior_score}/100
             · Goal &amp; Risk Fit {prompt.goal_risk_fit_score}/10
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
          {onAsk && <button type="button" className="agent-research-link" onClick={onAsk}>Ask Doraemon about {stock.symbol}</button>}
          <button className="agent-continue" type="button" onClick={() => setReview(true)}>{reply ? "Continue to review" : "Skip to review"}</button>
        </div>
      </section>
    );
  }

  return (
    <dialog
      ref={dialog}
      className="order-sheet"
      aria-label={receipt ? statusTitle : reviewingOrder ? `Review ${side} order` : `${side === "buy" ? "Buy" : "Sell"} order`}
      onCancel={(event) => { event.preventDefault(); if (!inFlight.current) onDismiss(); }}
      onClick={(event) => { if (event.target === event.currentTarget && !inFlight.current) onDismiss(); }}
    >
      <DistortionWave
        className="order-wave"
        type="vertical"
        palette="colorful"
        revealed={!!receipt}
        source={confirmButton}
        reducedMotion="system"
        onFinish={(revealed) => { if (revealed) confirmButton.current?.focus(); }}
        overlay={
          <div className="order-wave-actions">
            <button
              ref={confirmButton}
              className="order-primary"
              type={receipt ? "button" : "submit"}
              form={receipt ? undefined : formId}
              disabled={!receipt && (!valid || !fx || busy || (reviewingOrder && check.pending))}
              onClick={receipt ? onDismiss : undefined}
            >
              {receipt ? "Done" : busy ? "Submitting…" : reviewingOrder ? `Confirm ${side}` : `Review ${side} order`}
            </button>
          </div>
        }
        revealedContent={
          <div className="order-sheet-content order-wave-view order-filled" aria-hidden={!receipt}>
            {receipt && (
              <>
                <span className="order-filled-icon" aria-hidden="true"><FontAwesomeIcon icon={faCheck} /></span>
                <h2>{statusTitle}</h2>
                {receipt.status === "open" ? (
                  <p>Open · {receipt.side === "buy" ? "Buy" : "Sell"} {receipt.quantity} {receipt.symbol} at a limit of USD {usd.format((receipt.limit_price_cents ?? 0) / 100)}. Manage it under Open orders.</p>
                ) : (
                  <p>{receipt.side === "buy" ? "Bought" : "Sold"} {receipt.quantity} {receipt.symbol} at USD {usd.format((receipt.price_cents ?? 0) / 100)} per share.</p>
                )}
                <dl>
                  <div><dt>{receipt.status === "open" ? "Limit order value" : "Order total"}</dt><dd>{receipt.total_thb_satang != null ? thbCash.format(receipt.total_thb_satang / 100) : "—"}</dd></div>
                  <div><dt>Cash balance</dt><dd>{receipt.account.cash_thb_satang != null ? thbCash.format(receipt.account.cash_thb_satang / 100) : "—"}</dd></div>
                </dl>
                {receipt.fx && <p className="source-label">USD 1 = THB {rateFormat.format(receipt.fx.rate_micros / 1_000_000)} · {receipt.fx.as_of}</p>}
              </>
            )}
          </div>
        }
      >
        <div className="order-sheet-content order-wave-view" inert={!!receipt}>
          <div className="card-heading">
            <h2>{reviewingOrder ? "Review order" : `${side === "buy" ? "Buy" : "Sell"} ${stock.symbol}`}</h2>
            {reviewingOrder
              ? <button type="button" disabled={busy} onClick={() => { setReviewingOrder(false); setError(""); }}>Edit</button>
              : <button type="button" onClick={onDismiss}>Close</button>}
          </div>
          {!receipt && <TradePlanCheck check={check} side={side} symbol={stock.symbol}
            estimatedSatang={valid && fx ? toSatang(estimatedPrice * shares, fx.rate_micros) : null} onPause={onDismiss} disabled={busy} />}
          <form id={formId} onSubmit={submit}>
            {reviewingOrder ? (
              <dl className="order-details">
                <div><dt>Action</dt><dd>{side === "buy" ? "Buy" : "Sell"} {stock.symbol}</dd></div>
                <div><dt>Order type</dt><dd>{orderType === "market" ? "Market" : "Limit"}</dd></div>
                <div><dt>Quantity</dt><dd>{shares} {shares === 1 ? "share" : "shares"}</dd></div>
                <div><dt>{orderType === "market" ? "Demo price" : "Limit price"}</dt><dd>USD {usd.format(estimatedPrice / 100)}</dd></div>
                <div><dt>{orderType === "market" ? "Estimated total" : "Value at limit"}</dt><dd>{fx ? thbCash.format(toSatang(estimatedPrice * shares, fx.rate_micros) / 100) : "—"}</dd></div>
              </dl>
            ) : (
              <>
                <DemoData<PaperAccount> path="/api/v1/demo/paper-account" title="trading account">
                  {(account) => <dl className="order-details order-account-context">
                    <div><dt>{side === "buy" ? "Portfolio cash" : "Available shares"}</dt><dd>{side === "buy"
                      ? account.cash_thb_satang != null ? thbCash.format(account.cash_thb_satang / 100) : "—"
                      : `${account.positions[stock.symbol]?.toLocaleString("en-US", { maximumFractionDigits: 6 }) ?? 0} ${stock.symbol}`}</dd></div>
                    {side === "buy" && valid && fx && account.cash_thb_satang != null && <div>
                      <dt>Cash after purchase at estimate</dt><dd>{account.cash_thb_satang >= toSatang(estimatedPrice * shares, fx.rate_micros)
                        ? thbCash.format((account.cash_thb_satang - toSatang(estimatedPrice * shares, fx.rate_micros)) / 100) : "Exceeds cash balance"}</dd></div>}
                  </dl>}
                </DemoData>
                <fieldset className="order-types">
                  <legend>Order type</legend>
                  <div className="segments">
                    {(["market", "limit"] as const).map((type) => (
                      <button key={type} type="button" aria-pressed={orderType === type} onClick={() => setOrderType(type)}>
                        {type === "market" ? "Market" : "Limit"}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <div className="order-inputs">
                  <label>Shares
                    <input type="number" min={1} max={10000} step={1} required value={quantity}
                      onChange={(event) => setQuantity(event.target.value)} />
                  </label>
                  {orderType === "limit" && <label>Limit price (USD)
                    <input inputMode="decimal" required value={limitInput} onChange={(event) => setLimitInput(event.target.value)} />
                  </label>}
                </div>
                <p className="source-label">Demo price per share · USD {usd.format(stock.price_cents / 100)}</p>
                <p>{orderType === "market" ? "Estimated total" : "Value at limit"} · <strong>{valid && fx ? thbCash.format(toSatang(estimatedPrice * shares, fx.rate_micros) / 100) : "—"}</strong></p>
              </>
            )}
            <div className="order-fx">
              <p className="source-label" role={fxError ? "alert" : "status"}>
                {fx ? `USD 1 = THB ${rateFormat.format(fx.rate_micros / 1_000_000)} · ${fx.source} reference rate · ${fx.as_of}`
                  : fxError ? "USD/THB rate unavailable." : "Loading USD/THB rate…"}
              </p>
              {(fx || fxError) && <button type="button" disabled={busy} onClick={refreshFX}>Refresh rate</button>}
            </div>
            {orderType === "limit" && valid && <p className="source-label">
              {isMarketable ? "The demo quote meets your limit." : "The demo quote falls outside your limit. This order stays open until cancelled in the demo."}
            </p>}
            {!reviewingOrder && side === "sell" && stock.symbol === "NVDA" &&
              <button type="button" onClick={() => setReview(false)}>Review stock headlines</button>}
            {error && <p role="alert" className="order-error">{error}</p>}
          </form>
        </div>
      </DistortionWave>
    </dialog>
  );
}
