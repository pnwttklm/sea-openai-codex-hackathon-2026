"use client";

import { useEffect, useRef, useState } from "react";
import { apiGet } from "@/lib/api/client";
import { usePathname } from "next/navigation";
import { Conversation } from "./conversation";
import { Mascot } from "./mascots";
import styles from "./companion.module.css";

export function AmbientCompanion() {
  const path = usePathname();
  const match = /^\/stocks\/([A-Z]{1,5})$/.exec(path);
  if (!match || process.env.NEXT_PUBLIC_SHARED_DEMO !== "1") return null;
  return <StockCompanion key={path} symbol={match[1]} />;
}

function StockCompanion({ symbol }: { symbol: string }) {
  const [stage, setStage] = useState<"closed" | "hello" | "chat">("closed");
  const [investor, setInvestor] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    let seen = false;
    try { seen = !!sessionStorage.getItem("companion.greeted." + symbol); } catch {}
    if (!seen) {
      const timer = setTimeout(() => {
        if (!document.querySelector("dialog[open]") && document.visibilityState === "visible") setStage("hello");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [symbol]);
  useEffect(() => {
    if (stage !== "hello" || investor) return;
    const ac = new AbortController();
    apiGet<{ profile_name: string | null }>("/api/v1/future-you/context", ac.signal)
      .then(profile => setInvestor(profile.profile_name ?? "")).catch(() => {});
    return () => ac.abort();
  }, [stage, investor]);
  useEffect(() => {
    if (stage !== "closed" && !dialog.current?.open) dialog.current?.showModal();
  }, [stage]);
  function close() {
    try { sessionStorage.setItem("companion.greeted." + symbol, "1"); } catch {}
    dialog.current?.close(); setStage("closed"); trigger.current?.focus();
  }
  return <>
    <button className={styles.launcher} ref={trigger} aria-label="Open Investor Companion" onClick={() => setStage("hello")}><Mascot agent="companion" size={48} /></button>
    {stage !== "closed" && <dialog className={styles.ambient} ref={dialog} aria-label="Investor Companion" onCancel={e => { e.preventDefault(); close(); }}
      onClick={e => { if (e.target === e.currentTarget) close(); }}>
      <div className={styles.stage}>
        {stage === "hello" ? <><div className={styles.greeting}><Mascot agent="companion" size={91} />
          <p>Hi{investor ? `, ${investor}` : ""}! Want to explore {symbol} together?</p></div><div className={styles.actions}>
          <button className={styles.primary} onClick={() => setStage("chat")}>Yes</button><button onClick={close}>Talk later</button></div></>
          : <><button className={styles.dismiss} onClick={close}>Close</button><Conversation symbol={symbol} /></>}
      </div>
    </dialog>}
  </>;
}
