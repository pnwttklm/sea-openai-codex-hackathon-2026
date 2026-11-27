"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faChevronRight, faXmark } from "@fortawesome/free-solid-svg-icons";
import { apiPost, isRemoteDemoPreview } from "@/lib/api/client";
import { DemoData, type BehaviorData } from "./data";
import { Mascot } from "../companion/mascots";
import { BackLink } from "./shell";
import styles from "./behavior.module.css";

type Dimension = BehaviorData["factors"][number];
const points = (factor: Dimension) => Math.round(factor.score * 10);
const actions: Record<string, [string, string]> = {
  Contribution: ["Review my savings plan", "/goals"],
  "DCA Consistency": ["Reflect in my journal", "/journal"],
  Diversification: ["Inspect portfolio holdings", "/#holdings-title"],
  "Goal & Risk Fit": ["Review my goal plans", "/goals"],
};

function tileCaption(factor: Dimension) {
  const facts = factor.facts ?? {};
  if (factor.name === "Contribution" && facts["Set aside"]) return facts["Set aside"] + " set aside";
  if (factor.name === "DCA Consistency" && facts["Scheduled buys"]) return facts.Completed + " of " + facts["Scheduled buys"] + " buys completed";
  if (factor.name === "Diversification" && Object.keys(facts).length) {
    const [largest, share] = Object.entries(facts)[0];
    return largest + " · " + share;
  }
  return factor.label;
}

function HealthReport({ initial }: { initial: BehaviorData }) {
  const preview = isRemoteDemoPreview();
  const [showPreview, setShowPreview] = useState(false);
  const [report, setReport] = useState(initial);
  const [target, setTarget] = useState(String(initial.monthly_target_thb));
  const [busy, setBusy] = useState<"assessment" | "target" | null>(null);
  const [notice, setNotice] = useState("");
  const [panel, setPanel] = useState<string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const dimension = report.factors.find(f => f.name === panel);
  const weakest = report.factors.reduce((lowest, f) => f.score < lowest.score ? f : lowest);
  const showReview = !preview || showPreview;
  const next = dimension && actions[dimension.name];
  const summary = showReview && report.ai_assessment;

  useEffect(() => {
    if (panel) dialog.current?.showModal();
    else dialog.current?.close();
  }, [panel]);

  async function assess() {
    if (preview) { setShowPreview(value => !value); return; }
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

  const assessmentButton = <button type="button" className={styles.assess} onClick={assess}
    disabled={busy !== null || (preview && !report.ai_assessment)}>
    <Mascot agent="companion" size={34} />
    {preview ? (showPreview ? "Hide AI assessment" : "View AI assessment") :
      busy === "assessment" ? "Assessing…" : report.ai_assessment ? "Refresh AI assessment" : "Assess with Doraemon"}
  </button>;

  return <>
    <section className={styles.hero} aria-label="Overall behavior score">
      <div className={styles.number}>{report.score}</div>
      <div className={styles.scale}><strong>/ 100</strong><span>{report.factors.length} dimensions assessed</span></div>
      <div className={styles.ruler} aria-hidden="true"><i style={{ left: report.score + "%" }} /></div>
      <div className={styles.ticks} aria-hidden="true"><span>0</span><span>50</span><span>100</span></div>
    </section>

    <section className={styles.companion} aria-label="Doraemon's portfolio review">
      <div className={styles.byline}><span className={styles.light} /> Doraemon <small>{summary ? "AI assessment" : "Portfolio check-in"}</small></div>
      <p aria-live="polite">{summary || `Let’s look at ${weakest.name.toLowerCase()}. It has the most room to improve this month.`}</p>
      <button type="button" className={styles.inspect} onClick={() => setPanel(weakest.name)}>
        Explore {weakest.name.toLowerCase()} <FontAwesomeIcon icon={faArrowRight} />
      </button>
      <div className={styles.companionFoot}>{assessmentButton}</div>
      {preview && !report.ai_assessment && <small>Awaiting a local AI assessment for this portfolio.</small>}
    </section>
    {!panel && <p className={styles.notice} role="status">{notice}</p>}

    <div className={styles.sectionTitle}><h2>Score breakdown</h2>
      <button type="button" onClick={() => setPanel("method")}>How it’s scored</button></div>
    <section className={styles.grid} aria-label="Four behavior dimensions">
      {report.factors.map(factor => <button key={factor.name} type="button" className={styles.tile}
        data-dimension={factor.name} onClick={() => setPanel(factor.name)} aria-haspopup="dialog">
        <span className={styles.tileTitle}>{factor.name}<FontAwesomeIcon icon={faChevronRight} /></span>
        <strong>{points(factor)}<small> / 100</small></strong>
        <span className={styles.meter} aria-hidden="true"><i style={{width: points(factor) + "%"}} /></span>
        <span>{tileCaption(factor)}</span>
      </button>)}
    </section>
    <div className={styles.plans}><small>Synthetic demo portfolio</small><Link href="/goals">My goal plans <FontAwesomeIcon icon={faArrowRight} /></Link></div>

    <dialog ref={dialog} className={styles.sheet} aria-labelledby="health-panel-title"
      onClose={() => setPanel(null)} onClick={e => { if (e.target === e.currentTarget) setPanel(null); }}>
      <div className={styles.sheetBody}>
        <div className={styles.sheetHead}><h2 id="health-panel-title">{dimension?.name ?? "How it’s scored"}</h2>
          <button type="button" aria-label="Close details" onClick={() => setPanel(null)}><FontAwesomeIcon icon={faXmark} /></button></div>
        {dimension ? <>
          <div className={styles.detailScore}>{points(dimension)}<small> / 100 · {dimension.label}</small></div>
          <h3>{dimension.question}</h3>
          <dl className={styles.facts}>{Object.entries(dimension.facts ?? {}).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
          <p>{dimension.measurement}</p>
          <section className={styles.detailAgent} aria-label="Doraemon assessment">
            <div className={styles.byline}><span className={styles.light} /> Doraemon</div>
            {showReview && dimension.ai_assessment && <p aria-live="polite">{dimension.ai_assessment}</p>}
            {assessmentButton}
          </section>
          {dimension.name === "Contribution" && !preview && <form className={styles.target} onSubmit={save}>
            <label htmlFor="monthly-target">Monthly target (THB)</label>
            <div><input id="monthly-target" type="number" min="1" max="100000000" step="1" required value={target}
              disabled={busy !== null} onChange={e => setTarget(e.target.value)} />
              <button disabled={busy !== null || Number(target) === report.monthly_target_thb}>{busy === "target" ? "Saving…" : "Save target"}</button></div>
          </form>}
          {next && (!preview || next[1].startsWith("/#")) && <Link className={styles.next} href={next[1]}>{next[0]} <FontAwesomeIcon icon={faArrowRight} /></Link>}
        </> : <>
          <p>{report.explanation} Each dimension is displayed out of 100.</p>
          <dl className={styles.facts}>{report.factors.map(f => <div key={f.name}><dt>{f.name}</dt><dd>{points(f)} / 100</dd></div>)}</dl>
          <div className={styles.formula}>({report.factors.map(points).join(" + ")}) ÷ {report.factors.length} ≈ <strong>{report.score}</strong></div>
          <p>The overall score is rounded to the nearest whole point. Doraemon uses the same measurements to explain it.</p>
        </>}
        {panel && <p className={styles.notice} role="status">{notice}</p>}
      </div>
    </dialog>
  </>;
}

export function Behavior() {
  const [community, setCommunity] = useState(false);
  return <div className={`demo-screen ${styles.screen}`}>
    <header className={styles.header}><BackLink /><span> </span>
      {/* <div role="group" aria-label="Score audience">
        <button type="button" aria-pressed={!community} onClick={() => setCommunity(false)}>Me</button>
        <button type="button" aria-pressed={community} onClick={() => setCommunity(true)}>Community</button>
      </div> */}
    </header>
    <h1>Financial Score</h1>
    {community && <p className="demo-state">Community scores are unavailable in this demo.</p>}
    <div hidden={community}><DemoData<BehaviorData> path="/api/v1/demo/behavior" title="Financial Score">{data => <HealthReport initial={data} />}</DemoData></div>
  </div>;
}
