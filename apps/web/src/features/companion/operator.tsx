"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { components } from "@/lib/api/demo.generated";
import { agents, Mascot, type Agent } from "./mascots";
import styles from "./operator.module.css";

export type Run = components["schemas"]["Run"];
type Span = components["schemas"]["Span"];
type Detail = components["schemas"]["RunDetail"];
const base = "/internal/agent-ops";
const time = (s: string) => new Date(s).toISOString().slice(11, 19) + " UTC";
async function get<T>(path: string, signal: AbortSignal): Promise<T> {
  const res = await fetch(base + path, { cache: "no-store", signal });
  if (res.status === 401 || res.status === 403) window.location.reload();
  if (!res.ok) throw new Error("Could not refresh agent runs.");
  return res.json();
}

export function SignIn() {
  const [message, setMessage] = useState("");
  async function login(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const secret = new FormData(e.currentTarget).get("secret");
    try {
      const res = await fetch(base + "/session", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret }) });
      if (res.ok) window.location.reload();
      else setMessage((await res.json()).detail ?? "Sign-in failed.");
    } catch { setMessage("Operator service unavailable."); }
  }
  return <form className={styles.login} onSubmit={login}>
    <label>Operator secret<input name="secret" type="password" required autoComplete="current-password" /></label>
    <button>Sign in</button>{message && <p role="alert">{message}</p>}
  </form>;
}

function Tree({ nodes, parent }: { nodes: Span[]; parent: string | null }) {
  return <ul className={styles.tree}>{nodes.filter(s => s.parent === parent).map(span => {
    const agent = span.kind === "agent" ? span.name as Agent : null;
    const label = <>{agent && <Mascot agent={agent} size={32} />}<strong>{agent ? agents[agent] : span.name}</strong>
      <small>{span.kind} · {span.status}{span.duration_ms != null && ` · ${span.duration_ms} ms`}{span.error && ` · ${span.error}`}</small></>;
    return <li key={span.id}>{nodes.some(s => s.parent === span.id) ?
      <details open><summary>{label}</summary><Tree nodes={nodes} parent={span.id} /></details> : <div>{label}</div>}</li>;
  })}</ul>;
}

export function OperatorConsole({ initial }: { initial: Run[] }) {
  const [runs, setRuns] = useState(initial);
  const [id, select] = useState("");
  const [detail, setDetail] = useState<Detail | null>(null);
  const [agent, setAgent] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [updated, setUpdated] = useState("");
  useEffect(() => {
    const ac = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    async function poll() {
      try {
        if (id) {
          const item = await get<Detail>("/agent-runs/" + id, ac.signal);
          if (ac.signal.aborted) return;
          setDetail(item); setUpdated(new Date().toLocaleTimeString()); setError("");
          if (item.status !== "running") return;
        } else {
          const qs = new URLSearchParams();
          if (agent) qs.set("agent", agent);
          if (status) qs.set("status", status);
          const items = await get<Run[]>("/agent-runs?" + qs, ac.signal);
          if (ac.signal.aborted) return;
          setRuns(items); setUpdated(new Date().toLocaleTimeString()); setError("");
        }
        timer = setTimeout(poll, 2000);
      } catch { if (!ac.signal.aborted) setError("Could not refresh this view."); }
    }
    void poll();
    return () => { ac.abort(); clearTimeout(timer); };
  }, [id, agent, status, retry]);
  async function logout() {
    const res = await fetch(base + "/session", { method: "DELETE" });
    if (res.ok) window.location.reload(); else setError("Could not sign out.");
  }
  return <>
    <div className={styles.bar}><span>{updated && `Updated ${updated}`}</span><button onClick={() => void logout()}>Sign out</button></div>
    {error && <p role="alert">{error} <button onClick={() => setRetry(n => n + 1)}>Retry</button></p>}
    {id ? <section className={styles.panel}><button onClick={() => { select(""); setDetail(null); }}>← Runs</button>
      {detail ? <><h2>Run at {time(detail.started)}</h2><p>{detail.status} · {detail.agents.length} agents · {detail.tools} tool calls · {detail.db_reads} DB reads</p>
        <Tree nodes={detail.spans} parent={null} /></> : <p role="status">Loading run…</p>}</section> :
      <section><div className={styles.filters}><label>Agent<select aria-label="Agent" value={agent} onChange={e => setAgent(e.target.value)}><option value="">All agents</option>
        {Object.entries(agents).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</select></label>
        <label>Status<select aria-label="Status" value={status} onChange={e => setStatus(e.target.value)}><option value="">All states</option>
          {["running","completed","partial","failed","interrupted"].map(s => <option key={s}>{s}</option>)}</select></label></div>
        {!runs.length && <p>No agent runs yet.</p>}
        <ul className={styles.runs}>{runs.map(run => <li key={run.id}><button onClick={() => select(run.id)}>
          <strong>{time(run.started)}</strong><span>{run.agents.map(a => agents[a]).join(" · ")}</span><b>{run.status}</b></button></li>)}</ul>
      </section>}
  </>;
}
