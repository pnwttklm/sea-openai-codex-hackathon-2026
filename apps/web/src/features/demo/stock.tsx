"use client";

import { useState } from "react";
import { DemoData, signed, usd, type StockData } from "./data";
import { StockCompanion } from "../companion/ambient";
import { StockNews } from "./stock-news";
import { FundamentalChart } from "./fundamental-chart";
import { BackLink } from "./shell";
import { OptionsChain } from "./options-chain";
import { PriceOverview } from "./price-overview";
import { PaperTrade } from "./paper-order";

const modes = ["Overview", "INVX", "Options", "News"] as const;
type Mode = (typeof modes)[number];

function Details({ stock }: { stock: StockData }) {
  const [selected, setSelected] = useState<Mode>(process.env.NEXT_PUBLIC_SHARED_DEMO === "1" ? "News" : "INVX");
  const [chatOpen, setChatOpen] = useState(false);
  const askDoraemon = process.env.NEXT_PUBLIC_SHARED_DEMO === "1" ? () => setChatOpen(true) : undefined;
  const up = stock.change_percent >= 0;
  return (
    <>
      <header className="stock-title">
        <div className="card-heading"><h1>{stock.symbol}</h1><span className="muted">{stock.exchange}</span></div>
        <p>{stock.name}</p>
      </header>
      {selected !== "Overview" && <><div className={`stock-quote ${up ? "gain" : "loss"}`}>
        <strong>{usd.format(stock.price_cents / 100)} <small>USD</small></strong>
        <span>{signed(stock.change_percent)}%</span>
      </div>
      <p className="source-label">Synthetic demo quote</p></>}
      <div className="stock-modes" role="group" aria-label="Stock detail view">
        {modes.map((mode) => <button type="button" key={mode} aria-pressed={selected === mode} onClick={() => setSelected(mode)}>{mode}</button>)}
      </div>
      {selected === "Overview" && <PriceOverview key={stock.symbol} stock={stock} />}
      {selected === "INVX" && <FundamentalChart symbol={stock.symbol} factors={stock.factors ?? []} />}
      {selected === "Options" && <OptionsChain stock={stock} />}
      {selected === "News" && (process.env.NEXT_PUBLIC_SHARED_DEMO === "1"
        ? <StockNews key={stock.symbol} symbol={stock.symbol} /> : <p className="demo-state">News is unavailable in this demo.</p>)}
      {selected !== "Options" && <PaperTrade stock={stock} onAsk={askDoraemon} />}
      {askDoraemon && <StockCompanion symbol={stock.symbol} open={chatOpen} onOpen={askDoraemon} onClose={() => setChatOpen(false)} />}
    </>
  );
}

export function Stock({ symbol, fromMarket }: { symbol: string; fromMarket: boolean }) {
  return (
    <div className="demo-screen stock">
      <BackLink market={fromMarket} />
      <DemoData<StockData> key={symbol} path={`/api/v1/demo/stocks/${encodeURIComponent(symbol)}`} title="stock details">
        {(stock) => <Details stock={stock} />}
      </DemoData>
    </div>
  );
}
