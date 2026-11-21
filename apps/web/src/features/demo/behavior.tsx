"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { apiPost } from "@/lib/api/client";
import { DemoData, type BehaviorData } from "./data";
import { Ring } from "./charts";
import { BackLink } from "./shell";

function HealthReport({ initial }: { initial: BehaviorData }) {
  const [report, setReport] = useState(initial);
  const [target, setTarget] = useState(String(initial.monthly_target_thb));
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setNotice("");
    try {
      const updated = await apiPost<BehaviorData>("/api/v1/demo/behavior/target", { monthly_target_thb: Number(target) });
      setReport(updated);
      setTarget(String(updated.monthly_target_thb));
      setNotice("Monthly target saved. Your score is updated.");
    } catch {
      setNotice("Could not save your target. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return <>
    <section className="behavior-card">
      <div className="card-heading"><h2>Monthly health check</h2><span className="source-label">Demo plan</span></div>
      <div className="score-summary"><div><strong>{report.label}</strong><small>{report.score} / 100 points</small></div><Ring score={report.score} /></div>
      <p>{report.explanation}</p>
    </section>
    <section className="health-dimensions" aria-label="Four health dimensions">
      {report.factors.map((factor) => <article key={factor.name} className="factor-card">
        <div className="card-heading"><h2>{factor.name}</h2><strong>{factor.score}/10</strong></div>
        <progress value={factor.score} max="10" aria-label={factor.name} />
        <p><strong>{factor.question}</strong></p><p>{factor.measurement}</p>
        {factor.name === "Goal & Risk Fit" && <Link href="/goals">View life goals →</Link>}
        {factor.name === "Contribution" && <form onSubmit={save}>
          <label>Monthly target (THB)<input type="number" min="1" max="100000000" step="1" required value={target} disabled={saving} onChange={event => setTarget(event.target.value)} /></label>
          <button type="submit" disabled={saving || Number(target) === report.monthly_target_thb}>{saving ? "Saving…" : "Save target"}</button>
          <span role="status">{notice}</span>
        </form>}
      </article>)}
    </section>
  </>;
}

export function Behavior() {
  const [community, setCommunity] = useState(false);
  return <div className="demo-screen behavior">
    <div className="segments" role="group" aria-label="Score audience">
      <button type="button" aria-pressed={!community} onClick={() => setCommunity(false)}>Me</button>
      <button type="button" aria-pressed={community} onClick={() => setCommunity(true)}>Community</button>
    </div>
    <header className="view-header"><BackLink /><h1>Investor Health Score</h1></header>
    {community ? <p className="demo-state">Community scores are unavailable in this demo.</p> :
      <DemoData<BehaviorData> path="/api/v1/demo/behavior" title="investor health score">{data => <HealthReport initial={data} />}</DemoData>}
  </div>;
}
