"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { components } from "@/lib/api/demo.generated";
import { apiGet, apiPost } from "@/lib/api/client";
import styles from "@/features/companion/companion.module.css";

type Entry = components["schemas"]["JournalEntry"];
export default function Page() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [text, setText] = useState("");
  const [status, setStatus] = useState("Loading entries…");
  const [busy, setBusy] = useState(false);
  const key = useRef("");
  useEffect(() => {
    const ac = new AbortController();
    apiGet<Entry[]>("/api/v1/companion/journal", ac.signal)
      .then(items => { setEntries(items); setStatus(""); })
      .catch(() => { if (!ac.signal.aborted) setStatus("Could not load the demo journal."); });
    return () => ac.abort();
  }, []);
  async function save(e: FormEvent) {
    e.preventDefault(); if (busy || !text.trim()) return;
    setBusy(true);
    key.current ||= crypto.randomUUID();
    try {
      const entry = await apiPost<Entry>("/api/v1/companion/journal", { id: key.current, text });
      setEntries(items => [entry, ...items.filter(i => i.id !== entry.id)]);
      setText(""); key.current = ""; setStatus("Reflection saved.");
    } catch { setStatus("Could not save your reflection. Try again."); }
    finally { setBusy(false); }
  }
  return <section className={styles.conversation}><h1>Decision journal</h1>
    <form onSubmit={save}><label>What shaped your decision?<textarea required maxLength={1500} value={text}
      onChange={e => { key.current = ""; setText(e.target.value); }} disabled={busy} /></label>
      <button className={styles.primary} disabled={busy || !text.trim()}>Save reflection</button></form>
    <p role="status">{status || (!entries.length ? "No reflections yet." : "")}</p>
    {entries.map(item => <article className={styles.exchange} key={item.id}><small>{new Date(item.created).toLocaleString()}</small>
      <p className={styles.answer}>{item.text}</p></article>)}</section>;
}
