"use client";

import { useEffect, useRef, useState } from "react";
import { DemoData, signed, usd, type StockData } from "./data";
import { Radar } from "./charts";
import { BackLink } from "./shell";
import { PaperTrade } from "./paper-order";

function Chart({ symbol }: { symbol: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">("loading");

  useEffect(() => {
    const container = host.current;
    if (!container) return;
    const target = document.createElement("div");
    target.className = "tradingview-widget-container__widget";
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.text = JSON.stringify({
      autosize: true, symbol, interval: "D", timezone: "Etc/UTC", theme: "dark",
      locale: "en", allow_symbol_change: false, support_host: "https://www.tradingview.com",
    });
    const timer = window.setTimeout(() => setStatus("unavailable"), 9000);
    function loaded(event: Event) {
      if (event.target instanceof HTMLIFrameElement) {
        event.target.title = `${symbol} price chart`;
        window.clearTimeout(timer);
        setStatus("ready");
      }
    }
    container.addEventListener("load", loaded, true);
    script.onerror = () => { window.clearTimeout(timer); setStatus("unavailable"); };
    container.replaceChildren(target, script);
    return () => {
      window.clearTimeout(timer);
      container.removeEventListener("load", loaded, true);
      script.onerror = null;
      container.replaceChildren();
    };
  }, [symbol]);

  const tradingViewUrl = `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(symbol)}`;
  return (
    <section className="chart-panel" aria-label="Stock price chart">
      {status === "loading" && <p role="status">Loading stock chart…</p>}
      {status === "unavailable" && <p role="status">Embedded chart unavailable.</p>}
      <div className="tradingview-widget-container" ref={host} hidden={status === "unavailable"} />
      <a href={tradingViewUrl} target="_blank" rel="noreferrer">View on TradingView</a>
      <p className="source-label">TradingView chart data uses a separate feed from the demo quote.</p>
    </section>
  );
}

const modes = ["Overview", "INVX", "Options", "News"] as const;
const dimensions = ["Quality", "Profitability", "Growth", "Dividend", "Valuation"];
type Mode = (typeof modes)[number];

function Details({ stock }: { stock: StockData }) {
  const [selected, setSelected] = useState<Mode>("INVX");
  const up = stock.change_percent >= 0;
  const factors = dimensions.map((name) => ({
    name, score: stock.factors?.find((factor) => factor.name === name)?.score ?? null,
  }));
  return (
    <>
      <header className="stock-title">
        <div className="card-heading"><h1>{stock.symbol}</h1><span className="muted">{stock.exchange}</span></div>
        <p>{stock.name}</p>
      </header>
      <div className={`stock-quote ${up ? "gain" : "loss"}`}>
        <strong>{usd.format(stock.price_cents / 100)} <small>USD</small></strong>
        <span>{signed(stock.change_percent)}%</span>
      </div>
      <p className="source-label">Synthetic demo quote</p>
      <div className="stock-modes" role="group" aria-label="Stock detail view">
        {modes.map((mode) => <button type="button" key={mode} aria-pressed={selected === mode} onClick={() => setSelected(mode)}>{mode}</button>)}
      </div>
      {selected === "Overview" && <Chart symbol={stock.symbol === "BTC" ? "COINBASE:BTCUSD" : `${stock.exchange}:${stock.symbol}`} />}
      {selected === "INVX" && (
        <section className="fundamentals">
          <h2>INVX Fundamental</h2>
          <p className="source-label">5 dimensions · {stock.factors?.length ? "Illustrative demo ratings" : "Ratings unavailable for " + stock.symbol}</p>
          <Radar factors={factors} />
        </section>
      )}
      {selected === "Options" && <p className="demo-state">Options data is unavailable in this demo.</p>}
      {selected === "News" && <p className="demo-state">News is unavailable in this demo.</p>}
      <PaperTrade stock={stock} />
    </>
  );
}

export function Stock({ symbol }: { symbol: string }) {
  return (
    <div className="demo-screen stock">
      <BackLink />
      <DemoData<StockData> key={symbol} path={`/api/v1/demo/stocks/${encodeURIComponent(symbol)}`} title="stock details">
        {(stock) => <Details stock={stock} />}
      </DemoData>
    </div>
  );
}
