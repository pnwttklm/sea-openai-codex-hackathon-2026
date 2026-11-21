"use client";

import Link from "next/link";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { DemoData, signed, usd, type StockData } from "./data";
import { DemoNav } from "./shell";
import { TickerLogo } from "./ticker-logo";
import styles from "./market.module.css";

export function Market() {
  const [query, setQuery] = useState("");
  const term = query.trim().toLowerCase();
  return <div className={`demo-screen ${styles.market}`}>
    <h1>Invest</h1>
    <label className={styles.search}>
      <FontAwesomeIcon icon={faMagnifyingGlass} aria-hidden="true" />
      <input type="search" aria-label="Search market by symbol or name" placeholder="Search by symbol or name"
        value={query} onChange={e => setQuery(e.target.value)} />
    </label>
    <section aria-labelledby="market-title">
      <div className={styles.heading}><h2 id="market-title">Market</h2><small>Demo prices · USD</small></div>
      <DemoData<StockData[]> path="/api/v1/demo/stocks" title="market">
        {catalog => {
          const matches = catalog.filter(s => s.symbol.toLowerCase().includes(term) || s.name.toLowerCase().includes(term));
          if (!catalog.length) return <p className="demo-state">No instruments available.</p>;
          if (!matches.length) return <div className="demo-state" role="status"><p>No matches for “{query}”.</p>
            <button onClick={() => setQuery("")}>Clear search</button></div>;
          return <ul className={styles.list}>{matches.map(s => <li key={s.symbol}>
            <Link href={`/stocks/${s.symbol}?from=invest`} className={styles.row}>
              <TickerLogo symbol={s.symbol} />
              <span className={styles.instrument}><strong>{s.symbol}</strong><small>{s.name}</small></span>
              <span className={styles.quote}><strong>{usd.format(s.price_cents / 100)}</strong>
                <small className={s.change_percent < 0 ? "loss" : s.change_percent > 0 ? "gain" : undefined}>
                  {signed(s.change_percent)}%</small></span>
            </Link></li>)}</ul>;
        }}
      </DemoData>
    </section>
    <DemoNav active="invest" />
  </div>;
}
