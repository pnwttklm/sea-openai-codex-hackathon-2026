import { useId, useState } from "react";
import type { components } from "@/lib/api/demo.generated";
import { DemoData, signed, usd, type StockData } from "./data";

const periods = { "1D": "Day", "1W": "Week", "1M": "Month", "1Y": "Year" };
type Period = keyof typeof periods;
type Series = components["schemas"]["PriceSeries"];

function PriceLine({ data, period, timeZone }: { data: Series; period: Period; timeZone: string }) {
  const gradient = useId().replace(/:/g, "");
  const prices = data.prices;
  const first = prices[0], last = prices[prices.length - 1];
  const low = Math.min(...prices), high = Math.max(...prices);
  const singleBar = prices.length === 1;
  const axisDate = new Intl.DateTimeFormat("en-US", period === "1D"
    ? { hour: "numeric", minute: "2-digit", timeZone }
    : { month: "short", day: "numeric", year: period === "1Y" ? "numeric" : undefined, timeZone });
  const lastBar = new Intl.DateTimeFormat("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short", timeZone,
  }).format(new Date(data.as_of));
  const points = prices.map((value, i) => {
    const x = singleBar ? 170 : 5 + i * 330 / (prices.length - 1);
    const y = high === low ? 62 : 114 - 103 * (value - low) / (high - low);
    return x.toFixed(2) + "," + y.toFixed(2);
  }).join(" ");
  const change = first ? (last - first) / first * 100 : 0;
  const label = periods[period].toLowerCase();
  return <>
    <div className="price-line-head"><strong>USD {usd.format(last)}</strong>
      <span className={change < 0 ? "loss" : "gain"}>{signed(change)}% · {period}</span></div>
    <svg className="minimal-line" viewBox="0 0 340 124" role="img" aria-label={`${period} closing prices, USD ${usd.format(first)} to ${usd.format(last)}`}
      style={{color: change < 0 ? "#ff8793" : "#43d5b2"}}>
      <defs><linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1"><stop stopColor="currentColor" stopOpacity=".23"/><stop offset="1" stopColor="currentColor" stopOpacity=".01"/></linearGradient></defs>
      <path d="M5 115H335" stroke="#4a4b56" strokeDasharray="2 5" />
      {singleBar ? <circle cx="170" cy="62" r="3.5" fill="currentColor" /> : <><polygon points={`5,121 ${points} 335,121`} fill={`url(#${gradient})`} />
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinejoin="round" strokeLinecap="round" /></>}
    </svg>
    <div className="history-axis" aria-hidden="true"><span>{axisDate.format(data.timestamps[0] * 1000)}</span>
      {!singleBar && <span>{axisDate.format(data.timestamps[data.timestamps.length - 1] * 1000)}</span>}</div>
    {singleBar ? <p>One market observation is available for this period.</p> : <p>Over this {label}, closing prices {last === first ? "ended flat" : last > first ? "rose" : "fell"} from USD {usd.format(first)} to {usd.format(last)}. The plotted range was USD {usd.format(low)}–{usd.format(high)}.</p>}
    <small>{data.source} · Latest bar <time dateTime={data.as_of}>{lastBar}</time></small>
  </>;
}

export function PriceOverview({stock}: {stock: StockData}) {
  const [period, setPeriod] = useState<Period>("1M");
  const historyPath = `/api/v1/demo/stocks/${stock.symbol}/history?period=${period}` as const;
  return <section className="price-overview" aria-label={stock.symbol + " price overview"}>
    <header><h2>Price history</h2><div role="group" aria-label="Chart time range">{(Object.keys(periods) as Period[]).map(p =>
      <button type="button" key={p} aria-pressed={p === period} onClick={() => setPeriod(p)}>{p}</button>)}</div></header>
    <DemoData<Series> key={historyPath} path={historyPath} title={`${stock.symbol} market history`}>
      {(data) => <PriceLine data={data} period={period} timeZone={stock.symbol === "BTC" ? "UTC" : "America/New_York"} />}
    </DemoData>
    {stock.symbol === "VOO" && <section className="reference-facts"><h3>Valuation and dividends</h3><dl>
      {[["P/E", "21.5×"], ["Price / book", "1.63×"], ["Dividend yield", "1.07%"], ["Dividend per share", "USD 5.44"]].map(([key,value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}
    </dl><small>Illustrative snapshot from the supplied VOO reference</small></section>}
    <a target="_blank" rel="noreferrer" href={`https://www.tradingview.com/chart/?symbol=${encodeURIComponent(stock.symbol === "BTC" ? "COINBASE:BTCUSD" : stock.exchange + ":" + stock.symbol)}`}>Full chart on TradingView ↗</a>
  </section>;
}
