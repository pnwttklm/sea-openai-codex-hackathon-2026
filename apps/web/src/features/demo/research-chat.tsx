"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { apiGet, apiPost } from "@/lib/api/client";
import type { components } from "@/lib/api/demo.generated";
import { AgentAvatar } from "./agent-avatar";

type Schemas = components["schemas"];

type Turn = Schemas["AgentTurn"];

export function ResearchPanel({ symbol, onDismiss }: { symbol: string; onDismiss: () => void }) {
  const closeButton = useRef<HTMLButtonElement>(null);
  const [pending, setPending] = useState("");
  useEffect(() => { closeButton.current?.focus(); }, []);

  return (
    <section className="agent-panel" role="dialog" aria-labelledby="research-title"
      onKeyDown={(event) => { if (event.key === "Escape") { event.stopPropagation(); onDismiss(); } }}>
      <div className="agent-toolbar">
        <AgentAvatar busy={!!pending} />
        <div><h2 id="research-title">Investing Agent</h2><p>{symbol} · Stock research</p></div>
        <button ref={closeButton} type="button" aria-label="Close research agent" onClick={onDismiss}><FontAwesomeIcon icon={faXmark} /></button>
      </div>
      <ResearchChat key={symbol} symbol={symbol} pending={pending} setPending={setPending} />
    </section>
  );
}

function ResearchChat({ symbol, pending, setPending }: {
  symbol: string;
  pending: string;
  setPending: (question: string) => void;
}) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [chatPath, setChatPath] = useState<`/${string}`>();
  const [historyError, setHistoryError] = useState(false);
  const [reload, setReload] = useState(0);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const request = useRef<AbortController>(null);
  const latest = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    const storageKey = `prik-thai-research:${symbol}`;

    async function loadHistory() {
      try {
        const savedId = localStorage.getItem(storageKey);
        const id = savedId && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(savedId)
          ? savedId : crypto.randomUUID();
        if (id !== savedId) localStorage.setItem(storageKey, id);
        const path = `/api/v1/demo/agent/chat/${id}/${symbol}` as const;
        const history = await apiGet<Turn[]>(path, controller.signal);
        if (!controller.signal.aborted) {
          setTurns(history);
          setChatPath(path);
        }
      } catch {
        if (!controller.signal.aborted) setHistoryError(true);
      }
    }

    void loadHistory();
    return () => controller.abort();
  }, [symbol, reload]);

  useEffect(() => () => request.current?.abort(), []);
  useEffect(() => {
    latest.current?.scrollIntoView({ block: "nearest" });
  }, [turns, pending, error]);

  async function ask(value: string) {
    const question = value.trim();
    if (!question || !chatPath || request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setDraft("");
    setPending(question);
    setError("");
    try {
      const turn = await apiPost<Turn>(chatPath, { question } satisfies Schemas["AgentQuestion"], controller.signal);
      if (!controller.signal.aborted) setTurns((prior) => [...prior, turn].slice(-20));
    } catch (reason) {
      if (!controller.signal.aborted) {
        setError(reason instanceof Error ? reason.message : "Research is unavailable right now.");
        setDraft(question);
      }
    } finally {
      request.current = null;
      if (!controller.signal.aborted) setPending("");
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void ask(draft);
  }

  return (
    <>
      <div className="agent-thread research-thread" aria-label="Research conversation">
        {!chatPath && !historyError && <p role="status">Loading conversation…</p>}
        {historyError && (
          <div role="alert">
            <p>Could not load the saved conversation.</p>
            <button className="research-suggestion" type="button" onClick={() => {
              setHistoryError(false);
              setReload((count) => count + 1);
            }}>Try again</button>
          </div>
        )}
        {chatPath && !turns.length && !pending && !error && (
          <button type="button" className="research-suggestion" onClick={() => void ask(`What is the latest news about ${symbol}?`)}>
            What is the latest news about {symbol}?
          </button>
        )}
        <div className="agent-exchange" role="log" aria-label="Research messages">
          {turns.map(({ question, reply, created_at }, index) => (
            <div className="agent-exchange" key={`${created_at}-${index}`}>
              <p className="agent-message agent-reply">{question}</p>
              <p className="agent-message research-answer">{reply.answer}</p>
              {reply.sources.length > 0 && (
                <div className="agent-sources">
                  <strong>Sources</strong>
                  <ul>{reply.sources.map((source) => (
                    <li key={source.url ?? source.title}>
                      {source.url ? <a href={source.url} target="_blank" rel="noreferrer">{source.title}</a> : source.title}
                      {(source.publisher || source.published_at) && <small>{[source.publisher, source.published_at].filter(Boolean).join(" · ")}</small>}
                    </li>
                  ))}</ul>
                </div>
              )}
            </div>
          ))}
          {pending && <><p className="agent-message agent-reply">{pending}</p><p role="status">Researching…</p></>}
        </div>
        {error && <p className="order-error" role="alert">{error}</p>}
        {(turns.length > 0 || pending || error) && <div ref={latest} />}
      </div>
      <form className="research-compose" onSubmit={submit}>
        <input aria-label="Ask about stocks" placeholder={`Ask about ${symbol} or another ticker`}
          value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={2400} />
        <button type="submit" disabled={!chatPath || !draft.trim() || !!pending}>Send</button>
      </form>
    </>
  );
}
