import { useEffect, useState } from "react";
import type { components } from "@/lib/api/demo.generated";
import styles from "./system-map.module.css";

type Scenario = components["schemas"]["VoiceScenario"];
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "THB", currencyDisplay: "code" });
const labels: Record<string, string> = {
  preferred_language: "Language", age: "Current age", risk_tolerance: "Risk comfort",
  name: "Name", priorities: "Priorities", saved_thb: "Saved", target_thb: "Target",
  monthly_deposit_thb: "Monthly contribution", months_remaining: "Months remaining",
  projected_thb: "Projected savings", shortfall_thb: "Projected shortfall",
  required_monthly_thb: "Required per month", assumed_nominal_annual_return: "Assumed annual return",
};

export function FutureContextPanel() {
  const [context, setContext] = useState<Scenario>();
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    async function refresh() {
      try {
        const result = await fetch("/internal/agent-ops/future-context", { cache: "no-store", signal: controller.signal });
        if (result.status === 401 || result.status === 403) { window.location.reload(); return; }
        if (!result.ok) throw new Error(result.status === 404 ? "No saved demo profile." : "Could not load the saved context.");
        const data: Scenario = await result.json();
        if (!controller.signal.aborted) setContext(data);
      } catch (reason) {
        if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Context unavailable.");
      }
    }
    void refresh();
    return () => controller.abort();
  }, [revision]);

  const portfolio = context?.portfolio_today;
  return <section className={styles.context} aria-labelledby="future-context-title">
    <header><div><h3 id="future-context-title">Future You context</h3>
      <small>Current inputs for a new overview voice session</small></div>
      <button type="button" disabled={!context && !error} onClick={() => {
        setContext(undefined); setError(""); setRevision(n => n + 1);
      }}>Refresh</button></header>
    {error && <p role="alert">{error}</p>}
    {!error && !context && <p role="status">Reading saved context…</p>}
    {context && <>
      <h4>Investor profile · {context.years_from_now}-year outlook</h4>
      <dl>{Object.entries(context.profile_today).map(([key, value]) =>
        <div key={key}><dt>{labels[key] ?? key}</dt><dd>{value}</dd></div>)}
        {context.age_in_scenario != null && <div><dt>Age in scenario</dt><dd>{context.age_in_scenario}</dd></div>}
      </dl>
      <h4>Saved goals ({context.goals.length})</h4>
      {context.goals.map((goal, i) => <details key={i}><summary>{goal.name} · {goal.months_remaining} months</summary>
        <dl>{Object.entries(goal).filter(([k]) => !["name", "years_from_now", "months_remaining"].includes(k))
          .map(([k, v]) => <div key={k}><dt>{labels[k] ?? k}</dt><dd>{v}</dd></div>)}</dl></details>)}
      {!context.goals.length && <small>No saved goals for this profile.</small>}
      <h4>Portfolio snapshot</h4>
      {portfolio ? <><small>As of {new Date(portfolio.as_of).toLocaleString()}</small><dl>
        <div><dt>Total value</dt><dd>{money.format(Number(portfolio.total_value_thb))}</dd></div>
        {portfolio.cash_thb != null && <div><dt>Cash</dt><dd>{money.format(Number(portfolio.cash_thb))}</dd></div>}
      </dl><details><summary>Holdings in context ({portfolio.largest_holdings.length} of {portfolio.holdings_count})</summary>
        <dl>{portfolio.largest_holdings.map(h => <div key={h.symbol}><dt>{h.symbol}</dt><dd>{Number(h.weight_pct)}%</dd></div>)}</dl>
      </details></> : <small>No portfolio snapshot is available for this session.</small>}
    </>}
  </section>;
}
