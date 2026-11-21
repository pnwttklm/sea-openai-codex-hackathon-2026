import { useEffect, useState } from "react";
import { apiPost } from "@/lib/api/client";
import type { components } from "@/lib/api/demo.generated";
import { Mascot } from "../companion/mascots";
import { duration, money } from "../goals/demo-goals";
import { thbCash } from "./data";

type Draft = components["schemas"]["TradeDraft"];
type Review = components["schemas"]["TradeReview"];

export function useTradeCheck(draft: Draft | null) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ key: string; review?: Review }>();
  const key = draft && JSON.stringify(draft);
  useEffect(() => {
    if (!key) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const review = await apiPost<Review>("/api/v1/demo/order-review", JSON.parse(key), controller.signal);
        if (!controller.signal.aborted) setResult({ key, review });
      } catch {
        if (!controller.signal.aborted) setResult({ key });
      }
    }, 550);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [key, attempt]);
  const current = key && result?.key === key ? result : undefined;
  return { review: current?.review, plan: current?.review ?? result?.review, failed: !!current && !current.review, pending: !!key && !current,
    retry: () => { setResult(undefined); setAttempt(n => n + 1); } };
}

const photo: Record<string, string> = {
  retirement: "retirement-scene.jpg", wedding: "wedding-background.jpg",
  "dream-home": "dream-home-background.jpg", "time-machine": "time-machine-background.jpg",
};

export function TradePlanCheck({ check, side, symbol, estimatedSatang, onPause, disabled }: {
  check: ReturnType<typeof useTradeCheck>; side: Draft["side"]; symbol: string; estimatedSatang: number | null;
  onPause: () => void; disabled: boolean;
}) {
  const { review, plan, pending, failed } = check;
  const [move, setMove] = useState(0);
  const selling = side === "sell";
  return <section className="trade-check" aria-label="Doraemon’s plan check" data-side={side}>
    {plan?.goals.map(goal => {
      const image = photo[goal.slug ?? ""];
      const art = image ? { backgroundImage: `linear-gradient(90deg,#16151ac9,#16151a38),url(/future-you/${image})` } : undefined;
      return <article key={goal.slug ?? goal.name} className="ticket-goal">
        <div className="ticket-scene" style={selling ? art : undefined}>
          {!selling && <span className="ticket-thumb" style={art} aria-hidden="true" />}
          <div><small>Linked goal</small><h3>{goal.name}</h3></div>
          <strong>{duration(Math.round(goal.years * 12))} <small>to go</small></strong>
        </div>
        {selling && goal.saved != null && goal.target != null && goal.target > 0 &&
          <div className="ticket-meter"><b>THB {money.format(goal.saved)}</b> of {money.format(goal.target)} saved
            <progress value={Math.min(goal.saved, goal.target)} max={goal.target} aria-label={goal.name + " savings"} /></div>}
      </article>;
    })}
    <aside className="ambient-margin-note">
      <div><Mascot agent="companion" size={30} /><b>Doraemon</b><small>{review?.source === "ai" ? "AI review" : review ? "Guided demo" : "Investor Companion"}</small></div>
      <p aria-live="polite">{review?.question ?? (pending ? "Checking this order against your saved plan…"
        : failed ? "Your plan is unavailable. Would you make the same trade on a quiet day?"
        : "Set an order amount to check it against your plan.")}</p>
      {plan && <small>{!plan.goals.length && "No goal linked to this stock · "}Monthly savings target · THB {money.format(plan.monthly_target_thb)}</small>}
      {failed && <button type="button" onClick={check.retry} disabled={disabled}>Retry plan check</button>}
    </aside>
    {selling && estimatedSatang != null && <details className="ticket-compare">
      <summary>Sell or hold?</summary><p>Compare this quantity of {symbol} if its price moves after a fill at your estimated price.</p>
      <div role="group" aria-label="Hypothetical price move">{[-10, 0, 10].map(n =>
        <button type="button" key={n} aria-pressed={move === n} onClick={() => setMove(n)}>{n === 0 ? "Flat" : n === 10 ? "+10%" : "−10%"}</button>)}</div>
      <dl><div><dt>Keep the shares</dt><dd>{thbCash.format(estimatedSatang * (1 + move / 100) / 100)}</dd></div>
        <div><dt>Sell to cash</dt><dd>{thbCash.format(estimatedSatang / 100)}</dd></div></dl>
      <small>Illustration with a fixed exchange rate and zero cash return.</small>
    </details>}
    <button className="ticket-pause" type="button" onClick={onPause} disabled={disabled}>{selling ? "Keep my shares" : "Pause this purchase"}</button>
  </section>;
}
