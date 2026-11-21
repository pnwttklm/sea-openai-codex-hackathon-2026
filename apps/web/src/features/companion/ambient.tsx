"use client";

import { useEffect, useRef, useState } from "react";
import { apiGet } from "@/lib/api/client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { thbCash, type PortfolioData } from "../demo/data";
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
  const [view, setView] = useState<"chat" | "position" | null>(null);
  const open = view !== null;
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (open && !dialog.current?.open) dialog.current?.showModal();
  }, [open]);
  function close() {
    dialog.current?.close(); setView(null); trigger.current?.focus();
  }
  return <>
    <button className={styles.launcher} ref={trigger} aria-label="Open Investor Companion" onClick={() => setView("chat")}><Mascot agent="companion" size={48} /></button>
    {open && <dialog className={styles.ambient} ref={dialog} aria-label="Investor Companion" onCancel={e => { e.preventDefault(); close(); }}
      onClick={e => { if (e.target === e.currentTarget) close(); }}>
      {view === "chat" ? <div className={styles.stage}>
        <div className={styles.actions}><button onClick={() => setView("position")}>View position</button>
          <button onClick={close}>Close</button></div>
        <Conversation symbol={symbol} />
      </div> : <StockPosition symbol={symbol} close={close} />}
    </dialog>}
  </>;
}

const percent = new Intl.NumberFormat("en", { maximumFractionDigits: 2 });

function StockPosition({ symbol, close }: { symbol: string; close: () => void }) {
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    apiGet<PortfolioData>("/api/v1/demo/portfolio", controller.signal)
      .then(data => { if (!controller.signal.aborted) setPortfolio(data); })
      .catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => controller.abort();
  }, [attempt]);

  const holding = portfolio?.holdings.find(h => h.symbol === symbol);
  const weight = holding && holding.weight > 0 && holding.weight < 0.01
    ? "<0.01%" : percent.format(holding?.weight ?? 0) + "%";
  const rank = portfolio && holding ? 1 + portfolio.holdings.filter(h => h.weight > holding.weight).length : null;

  return <div className={styles.stage}>
    {!expanded && <div className={styles.greeting}><Mascot agent="companion" size={91} />
      <p aria-live="polite">{failed ? `I couldn’t load your portfolio to check ${symbol}.`
        : !portfolio ? `Checking ${symbol} in your demo portfolio…`
        : holding ? `${portfolio.investor}, ${symbol} makes up ${weight} of your demo portfolio.`
        : `${portfolio.investor}, you don’t currently hold ${symbol} in your demo portfolio.`}</p></div>}
    {expanded && portfolio && <section className={styles.conversation} aria-label={symbol + " portfolio position"}>
      <div className={styles.intro}><Mascot agent="portfolio_analyst" size={58} />
        <div><h2>{symbol} in your portfolio</h2><p>Portfolio Analyst</p></div></div>
      <dl className={styles.metrics}>
        <div><dt>Portfolio weight</dt><dd>{holding ? weight : "Not held"}</dd></div>
        {rank !== null && <div><dt>Position by size</dt><dd>{rank} of {portfolio.holdings.length}</dd></div>}
        {portfolio.cash_thb != null && <div><dt>Portfolio cash</dt><dd>{thbCash.format(portfolio.cash_thb)}</dd></div>}
      </dl>
      <small>Source · Demo portfolio</small>
    </section>}
    <div className={styles.actions}>
      {failed && <button onClick={() => { setFailed(false); setAttempt(a => a+1); }}>Retry</button>}
      {!expanded && portfolio && <button className={styles.primary} onClick={() => setExpanded(true)}>View position</button>}
      {expanded && <Link className={styles.portfolioLink} href="/" onClick={close}>View portfolio</Link>}
      <button onClick={close}>{expanded ? "Close" : "Talk later"}</button>
    </div>
  </div>;
}
