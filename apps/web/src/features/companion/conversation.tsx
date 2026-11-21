"use client";

import { useEffect, useState, type FormEvent } from "react";
import { apiGet, apiPost } from "@/lib/api/client";
import type { components } from "@/lib/api/demo.generated";
import { agents, Mascot } from "./mascots";
import styles from "./companion.module.css";

type Reply = components["schemas"]["Reply"];

export function Conversation({ symbol }: { symbol?: string }) {
  const [question, setQuestion] = useState("");
  const [goal, setGoal] = useState("");
  const [goals, setGoals] = useState<{ id: string; name: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<{ question: string; reply: Reply }[]>([]);
  useEffect(() => {
    const ac = new AbortController();
    apiGet<{ goals: { id: string; name: string }[] }>("/api/v1/future-you/context", ac.signal)
      .then(data => setGoals(data.goals)).catch(() => {});
    return () => ac.abort();
  }, []);

  async function ask(text: string) {
    if (busy || !text.trim()) return;
    setBusy(true); setError("");
    try {
      const reply = await apiPost<Reply>("/api/v1/companion/turns",
        { question: text.trim(), ...(goal ? { goal_id: goal } : {}) });
      setMessages(items => [...items, { question: text, reply }]);
      setQuestion("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not reach your companion.");
    } finally { setBusy(false); }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void ask(question);
  }

  return <div className={styles.conversation}>
    <div className={styles.intro}><Mascot agent="companion" size={84} /><div><h2>Investor Companion</h2><p>Doraemon</p></div></div>
    {messages.map(({ question: q, reply }, i) => <article className={styles.exchange} key={i}>
      <p className={styles.question}>{q}</p>
      <div className={styles.pets}>{reply.presenters.map(agent => <span key={agent}><Mascot agent={agent} size={36} />{agents[agent]}</span>)}</div>
      <p className={styles.answer}>{reply.answer}</p>
      {reply.evidence.length > 0 && <details><summary>Sources and assumptions</summary><ul>{reply.evidence.map(e => <li key={e}>{e}</li>)}</ul></details>}
      <small>{reply.mode === "demo" ? "Offline demo" : "OpenAI"} · Synthetic investor profile</small>
    </article>)}
    {!messages.length && <div className={styles.prompts}>
      {[(symbol ? `Summarize recent ${symbol} headlines` : "Am I on track for my wedding?"), "How much cash is in my portfolio?"].map(q =>
        <button key={q} disabled={busy} onClick={() => void ask(q)}>{q}</button>)}</div>}
    <form onSubmit={submit}>
      {goals.length > 0 && <label>Goal <select value={goal} onChange={e => setGoal(e.target.value)}>
        <option value="">Choose from my question</option>{goals.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select></label>}
      <label>Your question<textarea rows={2} maxLength={1500} value={question} onChange={e => setQuestion(e.target.value)} placeholder="Ask in Thai or English" /></label>
      <button className={styles.primary} disabled={busy || !question.trim()}>Ask Doraemon</button>
    </form>
    {busy && <p role="status">Checking your question…</p>}{error && <p role="alert">{error}</p>}
  </div>;
}
