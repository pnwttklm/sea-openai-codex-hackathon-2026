import { useEffect, useState } from "react";
import { apiPost } from "@/lib/api/client";
import type { components } from "@/lib/api/demo.generated";
import { Mascot } from "../companion/mascots";

type Rating = components["schemas"]["InstrumentRating"];

export function InstrumentRating({ symbol }: { symbol: string }) {
  const [report, setReport] = useState<Rating>();
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const data = await apiPost<Rating>(`/api/v1/demo/stocks/${symbol}/agent-rating`, {}, controller.signal);
        if (!controller.signal.aborted) setReport(data);
      } catch {
        if (!controller.signal.aborted) setError("Could not load the portfolio assessment.");
      }
    }, 0);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [symbol, attempt]);
  return <section className="fundamentals instrument-rating" aria-label={symbol + " agent rating"}>
    <header><Mascot agent="portfolio_analyst" size={48} /><div><small>Portfolio Analyst</small><h2>{symbol} plan-fit rating</h2></div></header>
    {report ? <>
      <strong className="fit-total">{report.checks.length ? report.checks.filter(check => check.fits).length + " / " + report.checks.length : "Unscored"}</strong>
      {report.checks.length > 0 && <span> goal checks met</span>}
      <p>{report.summary}</p>
      <ul>{report.checks.map(check => <li key={check.goal + check.label}><div><b>{check.label}</b>
        <strong>{check.fits ? "Fits" : "Review"}</strong></div><small>{check.goal} · {check.evidence}</small></li>)}</ul>
      <p>Portfolio weight · {Number(report.weight_pct.toFixed(2))}%{report.exposure.length > 0 && " · " + report.exposure.join(", ")}</p>
      <small>{report.source === "ai" ? "AI interpretation" : "Rules-based review"} · Demo portfolio and risk assumptions</small>
    </> : error ? <p role="alert">{error} <button onClick={() => { setError(""); setAttempt(n => n + 1); }}>Retry</button></p>
      : <p role="status">Reviewing {symbol} against your goals…</p>}
  </section>;
}
