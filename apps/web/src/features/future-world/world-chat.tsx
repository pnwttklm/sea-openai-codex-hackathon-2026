"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFlag, faPlus } from "@fortawesome/free-solid-svg-icons";
import { apiPost, ApiError } from "@/lib/api/client";
import type { components } from "@/lib/api/demo.generated";
import { compactMoney, money } from "../goals/demo-goals";
import { landmarkStyles, type Landmark } from "./landmarks";
import styles from "./future-world.module.css";

type Turn = components["schemas"]["WorldTurn"];
type Reply = components["schemas"]["WorldReply"];
type Input = Pick<Turn, "question" | "extra_monthly" | "goal_id">;
type Exchange = { prompt: string; reply: Reply };

export function useWorldChat() {
  const session = useRef<{ id: string; next: number; offline?: boolean; active?: AbortController } | null>(null);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<{ message: string; offlineAvailable: boolean; input: Input; prompt: string } | null>(null);
  const [draft, setDraft] = useState("");

  const close = useCallback(() => {
    session.current?.active?.abort();
    session.current = null;
  }, []);
  useEffect(() => close, [close]);

  const send = useCallback(async (input: Input, prompt: string, offline = false) => {
    const current = session.current;
    if (!current || current.active || current.next >= 40) return;
    if (offline) current.offline = true;
    const controller = new AbortController();
    current.active = controller;
    setPending(true);
    setFailure(null);
    try {
      const reply = await apiPost<Reply>("/api/v1/future-world/turns", {
        ...input, conversation_id: current.id, turn: current.next, offline: current.offline ?? false,
      } satisfies Turn, controller.signal);
      if (session.current !== current) return;
      current.next++;
      setExchanges(previous => [...previous, { prompt, reply }]);
      if (input.question) setDraft(value => value.trim() === input.question ? "" : value);
    } catch (error) {
      if (session.current === current) setFailure({ input, prompt, offlineAvailable: error instanceof ApiError && error.status === 502 && !current.offline, message: error instanceof ApiError
        ? error.message : "Could not reach Doraemon. Try again." });
    } finally {
      if (session.current === current) {
        current.active = undefined;
        setPending(false);
      }
    }
  }, []);

  const open = useCallback((goal?: string) => {
    close();
    session.current = { id: crypto.randomUUID(), next: 0 };
    setExchanges([]);
    setDraft("");
    void send({ goal_id: goal }, "");
  }, [close, send]);

  return { open, close, send, exchanges, pending, failure, draft, setDraft };
}

function SavingsChart({ visual }: { visual: components["schemas"]["Comparison"] }) {
  const end = visual.current.points[visual.current.points.length - 1].month;
  const lines = [visual.current, visual.proposed];
  return <>
    <strong>{visual.title}</strong>
    <span>Target · THB {money.format(visual.target)}</span>
    <svg className={styles.chart} viewBox="0 0 300 94" role="img" aria-label={`Savings paths compared over ${end} months in THB`}>
      <path d="M4 8 H296" stroke="currentColor" strokeDasharray="2 4" fill="none" />
      {lines.map((series, i) => <polyline key={series.label}
        points={series.points.map(p => `${4 + p.month / end * 292},${86 - p.balance / visual.target * 78}`).join(" ")}
        stroke={i ? "#9ccbff" : "#ffd468"} strokeDasharray={i ? "5 3" : undefined} strokeWidth="3" fill="none" />)}
    </svg>
    <div className={styles.axis}><span>Month 0</span><span>Month {compactMoney.format(end)}</span></div>
    <div className={styles.legend}>{lines.map(series => <span key={series.label}>{series.label} · THB {money.format(series.monthly)}/mo</span>)}</div>
    <small>{visual.assumption}</small>
  </>;
}

function Visual({ reply, landmarks, disabled, send }: {
  reply: Reply; landmarks: Landmark[]; disabled: boolean; send: (input: Input, prompt: string) => void;
}) {
  const v = reply.visual;
  return <figure className={styles.visual}>
    {v.type === "progress" && <>
      <strong>{v.title}</strong>
      <progress aria-label={`Funding for ${v.title}`} value={Math.min(v.saved, v.target)} max={v.target} />
    </>}
    {v.type === "comparison" && <SavingsChart visual={v} />}
    {v.type === "goals" && <div className={styles.goalChoices}>
      {v.goals.map(g => {
        const plot = landmarks.find(p => p.plan.id === g.id);
        return <button key={g.id} disabled={disabled} onClick={() => send({ goal_id: g.id }, g.title)}>
          <FontAwesomeIcon icon={plot ? landmarkStyles[plot.kind].icon : faFlag} aria-hidden="true" />{g.title}
        </button>;
      })}
      {!v.goals.length && <Link href="/goals#add-goal"><FontAwesomeIcon icon={faPlus} /> Add a goal</Link>}
    </div>}
    <figcaption>{reply.caption}</figcaption>
  </figure>;
}

export function WorldChat({ chat, landmarks }: { chat: ReturnType<typeof useWorldChat>; landmarks: Landmark[] }) {
  const latest = chat.exchanges.at(-1)?.reply;
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: "nearest" }); }, [chat.exchanges.length, chat.failure, chat.pending]);
  const full = chat.exchanges.length >= 40;
  const disabled = chat.pending || full;
  return <>
    <div role="log" aria-label="Doraemon conversation" className={styles.chatLog}>
      {chat.exchanges.map(({ prompt, reply }, i) => <div key={i}>
        {prompt && <p className={styles.question}>{prompt}</p>}
        <p>{reply.answer}</p>
        <Visual reply={reply} landmarks={landmarks} send={chat.send} disabled={disabled || i !== chat.exchanges.length - 1} />
      </div>)}
    </div>
    {chat.pending && <p role="status">Doraemon is thinking…</p>}
    {chat.failure && <div className={styles.answers}><p role="alert">{chat.failure.message}</p>
      <button onClick={() => void chat.send(chat.failure!.input, chat.failure!.prompt)}>Retry</button>
      {chat.failure.offlineAvailable && <button onClick={() => void chat.send(chat.failure!.input, chat.failure!.prompt, true)}>Continue offline</button>}</div>}
    {latest?.mode === "offline" && <small>Offline demo</small>}
    {full ? <p>Close and talk to Doraemon again to start a new conversation.</p> :
      latest && <>
        {latest.goal_id && <div className={styles.answers}>
          {[500, 1000].map(amount => {
            const prompt = `Add THB ${money.format(amount)}/month`;
            return <button key={amount} disabled={disabled} onClick={() => void chat.send({ extra_monthly: amount }, prompt)}>{prompt}</button>;
          })}
        </div>}
        <form className={styles.ask} onSubmit={event => {
          event.preventDefault();
          if (chat.draft.trim()) void chat.send({ question: chat.draft.trim() }, chat.draft.trim());
        }}>
          <label htmlFor="world-question">Ask Doraemon</label>
          <div><input id="world-question" value={chat.draft} maxLength={600} placeholder="Ask about your goals…"
            onChange={e => chat.setDraft(e.target.value)} />
          <button disabled={disabled || !chat.draft.trim()}>Send</button></div>
        </form>
      </>}
    <div ref={end} />
  </>;
}
