"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { apiPost, isRemoteDemoPreview } from "@/lib/api/client";
import { DemoData, type BehaviorData } from "./data";
import { Gauge, Ring, factorColor } from "./charts";
import { Mascot } from "../companion/mascots";
import { BackLink } from "./shell";
import styles from "./behavior.module.css";

function BehaviorRadar({ factors }: { factors: BehaviorData["factors"] }) {
  // Clockwise from the top, in the same order as the score cards.
  const axes = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  const point = (index: number, ratio: number) =>
    axes[index].map(direction => 100 + direction * 92 * ratio);
  const polygon = (ratios: number[]) => ratios.map((ratio, i) => point(i, ratio).join(",")).join(" ");
  return <div className={styles.radar}>
    <svg viewBox="0 0 200 200" aria-hidden="true">
      {[.2, .4, .6, .8, 1].map(step => <polygon key={step} points={polygon(axes.map(() => step))}
        fill="none" stroke="#484153" />)}
      <path d="M100 8v184 M8 100h184" stroke="#484153" />
      <polygon points={polygon(factors.map(f => f.score / 10))} fill="#a8a5c82e" stroke="#a79fbc" />
      {factors.map((factor, i) => { const [x, y] = point(i, factor.score / 10);
        return <circle key={factor.name} cx={x} cy={y} r="4" fill={factorColor(factor.score)} />;
      })}
    </svg>
    <ul aria-label="Scores out of ten">{factors.map(f => <li key={f.name}>
      {f.name}<strong style={{ color: factorColor(f.score) }}>{f.score.toFixed(1)}</strong>
    </li>)}</ul>
  </div>;
}

function HealthReport({ initial }: { initial: BehaviorData }) {
  const preview = isRemoteDemoPreview();
  const [showPreview, setShowPreview] = useState(false);
  const [report, setReport] = useState(initial);
  const [target, setTarget] = useState(String(initial.monthly_target_thb));
  const [busy, setBusy] = useState<"assessment" | "target" | null>(null);
  const [notice, setNotice] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const showReview = !preview || showPreview;

  async function assess() {
    setBusy("assessment");
    setNotice("");
    try {
      const result = await apiPost<BehaviorData>("/api/v1/demo/behavior/assessment", {});
      setReport(result);
      setTarget(String(result.monthly_target_thb));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not assess this portfolio. Try again.");
    } finally {
      setBusy(null);
    }
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy("target");
    setNotice("");
    try {
      const updated = await apiPost<BehaviorData>("/api/v1/demo/behavior/target", { monthly_target_thb: Number(target) });
      setReport(updated);
      setTarget(String(updated.monthly_target_thb));
      setNotice("Monthly target saved. Your score is updated.");
    } catch {
      setNotice("Could not save your target. Try again.");
    } finally {
      setBusy(null);
    }
  }

  return <>
    <section className={styles.overview}>
      <div className="card-heading"><h2>Investing Behavior Score</h2><span>Demo plan</span></div>
      <div className="score-summary"><div><strong className="assessment">{report.label}</strong><small>{report.score} / 100 points</small></div><Ring score={report.score} /></div>
      <BehaviorRadar factors={report.factors} />
      <p className={styles.explanation}>{(showReview && report.ai_assessment) || report.explanation}</p>
      <button type="button" className={styles.assess} disabled={busy !== null || (preview && !report.ai_assessment)}
        onClick={preview ? () => setShowPreview(value => !value) : assess}
        aria-expanded={preview && report.ai_assessment ? showPreview : undefined}>
        <Mascot agent="companion" size={44} />
        <span>{preview ? (showPreview ? "Hide AI assessment" : "View AI assessment") :
          busy === "assessment" ? "Doraemon is assessing…" : report.ai_assessment ? "Refresh AI assessment" : "Assess with Doraemon"}</span>
      </button>
      {preview && !report.ai_assessment && <small>Awaiting a local AI assessment for this portfolio.</small>}
    </section>
    <p role="status" className={styles.notice}>{notice}</p>
    <section className={styles.grid} aria-label="Four behavior dimensions">
      {report.factors.map((factor, index) => <article key={factor.name} className={styles.metric}>
        <button type="button" className={styles.toggle} aria-controls={`metric-${index}`}
          aria-expanded={expanded === factor.name} onClick={() => setExpanded(expanded === factor.name ? null : factor.name)}>
          <span className={styles.name}>{factor.name}<FontAwesomeIcon icon={faChevronRight} /></span>
          <Gauge score={factor.score} />
          <strong>{factor.label}</strong><span className="sr-only">{factor.score} out of 10</span>
        </button>
        <div id={`metric-${index}`} className={styles.detail} hidden={expanded !== factor.name}>
          <strong>{factor.question}</strong><p>{factor.measurement}</p>
          {showReview && factor.ai_assessment && <p><b>Doraemon’s assessment</b><br />{factor.ai_assessment}</p>}
          {factor.name === "Goal & Risk Fit" && <Link href="/goals">View life goals →</Link>}
          {factor.name === "Contribution" && !preview && <form onSubmit={save}>
            <label>Monthly target (THB)<input type="number" min="1" max="100000000" step="1" required value={target} disabled={busy !== null} onChange={e => setTarget(e.target.value)} /></label>
            <button type="submit" disabled={busy !== null || Number(target) === report.monthly_target_thb}>{busy === "target" ? "Saving…" : "Save target"}</button>
          </form>}
        </div>
      </article>)}
    </section>
  </>;
}

export function Behavior() {
  const [community, setCommunity] = useState(false);
  return <div className={`demo-screen behavior ${styles.screen}`}>
    <div className="segments" role="group" aria-label="Score audience">
      <button type="button" aria-pressed={!community} onClick={() => setCommunity(false)}>Me</button>
      <button type="button" aria-pressed={community} onClick={() => setCommunity(true)}>Community</button>
    </div>
    <header className="view-header"><BackLink /><h1>Investing Behavior Score</h1></header>
    {community && <p className="demo-state">Community scores are unavailable in this demo.</p>}
    <div hidden={community}><DemoData<BehaviorData> path="/api/v1/demo/behavior" title="investing behavior score">{data => <HealthReport initial={data} />}</DemoData></div>
  </div>;
}
