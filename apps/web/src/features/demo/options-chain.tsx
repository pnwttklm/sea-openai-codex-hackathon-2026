"use client";

import { useState } from "react";
import { usd, type StockData } from "./data";
import styles from "./options-chain.module.css";

// Fixed demo expiries and illustrative premiums. The stock quote anchors the central strike.
const expiries = [
  { date: "18 Dec 2026", premiums: [265, 180, 110, 55, 24] },
  { date: "15 Jan 2027", premiums: [320, 235, 165, 100, 58] },
];

export function OptionsChain({ stock }: { stock: StockData }) {
  const [side, setSide] = useState<"Calls" | "Puts">("Calls");
  const [expiry, setExpiry] = useState(0);
  const spot = stock.price_cents;
  const step = Math.max(1, 10 ** Math.floor(Math.log10(Math.max(1, spot)) - 1) / 2);
  const center = Math.max(3, Math.round(spot / step)) * step;
  const premiums = expiries[expiry].premiums;
  return <section className={styles.card} aria-label={stock.symbol + " options chain mockup"}>
    <div className={styles.title}><h2>Options chain</h2><span>Mock data</span></div>
    <div className={styles.controls}>
      <div className={styles.sides} role="group" aria-label="Contract type">
        {(["Calls", "Puts"] as const).map(type => <button key={type} type="button" aria-pressed={side === type}
          onClick={() => setSide(type)}>{type}</button>)}
      </div>
      <label className={styles.expiry}>Expiry
        <select value={expiry} onChange={e => setExpiry(Number(e.target.value))}>
          {expiries.map((item,i) => <option key={item.date} value={i}>{item.date}</option>)}
        </select>
      </label>
    </div>
    <table className={styles.chain}>
      <caption className="sr-only">{stock.symbol} {side.toLowerCase()} expiring {expiries[expiry].date}, USD per unit</caption>
      <thead><tr><th scope="col">Strike</th><th scope="col">Bid</th><th scope="col">Ask</th></tr></thead>
      <tbody>{premiums.map((_, i) => {
        const strike = center + (i - 2) * step;
        const intrinsic = Math.max(0, side === "Calls" ? spot - strike : strike - spot);
        const timeValue = premiums[side === "Calls" ? i : premiums.length - 1 - i];
        const bid = intrinsic + Math.max(1, Math.round(step * timeValue / 100));
        const ask = bid + Math.max(1, Math.round(step * .12));
        return <tr key={strike} className={i === 2 ? styles.nearest : undefined}>
          <th scope="row">{usd.format(strike / 100)}{i === 2 && <small>Nearest spot</small>}</th>
          <td>{usd.format(bid / 100)}</td><td>{usd.format(ask / 100)}</td>
        </tr>;
      })}</tbody>
    </table>
    <p className={styles.note}>{stock.symbol} spot · USD {usd.format(spot / 100)} · Premiums in USD per unit</p>
  </section>;
}
