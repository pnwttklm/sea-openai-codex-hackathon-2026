"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChartLine, faChartPie, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { DemoData, signed, thb, thbCash, type PortfolioData, type Range } from "./data";
import { Ring, Sparkline } from "./charts";
import { TickerLogo } from "./ticker-logo";
import { Character, DemoNav } from "./shell";
import type { PaperAccount } from "./paper-order";

const ranges: Range[] = ["1Y", "3Y", "5Y", "10Y", "All"];
const periodLabels: Record<Range, string> = { "1Y": "past 1 year", "3Y": "past 3 years", "5Y": "past 5 years", "10Y": "past 10 years", All: "all time" };
const shades = ["#a45cff", "#676780", "#494950", "#696971", "#888893", "#38383b"];

function Allocation({ items, value }: { items: PortfolioData["allocation"]; value: number }) {
  const [active, setActive] = useState(0);
  let offset = 0;
  if (!items.length) return <p className="demo-state">No allocation data</p>;
  const selected = items[active] ?? items[0];
  return (
    <div className="allocation">
      <div className="donut">
        <svg viewBox="0 0 210 210" aria-hidden="true">
          <defs><linearGradient id="allocation-violet"><stop stopColor="#391093" /><stop offset="1" stopColor="#efabff" /></linearGradient></defs>
          {items.map(({ name, percent }, index) => {
            const start = offset;
            offset += percent;
            return <circle key={name} cx="105" cy="105" r="79" pathLength="100" fill="none"
              onClick={() => setActive(index)} className="allocation-segment"
              stroke={active === index ? "url(#allocation-violet)" : shades[index % shades.length]} strokeWidth={active === index ? 27 : 20}
              strokeDasharray={`${Math.max(0, percent - 0.75)} 100`} strokeDashoffset={-start} transform="rotate(-90 105 105)" />;
          })}
        </svg>
        <p aria-live="polite"><strong>{selected.name}</strong><span>{Number(selected.percent.toFixed(1))}%</span><small>{thb.format(value * selected.percent / 100)}</small></p>
      </div>
      <div className="allocation-key" aria-label="Allocation groups">
        {items.map(({ name, percent }, index) => <button key={name} type="button" aria-pressed={active === index} onClick={() => setActive(index)}>{name} {Number(percent.toFixed(1))}%</button>)}
      </div>
    </div>
  );
}

function HistoryExplorer({ values, label }: { values: number[]; label: string }) {
  const [selected, setSelected] = useState(values.length - 1);
  return (
    <>
      <div className="trend gain"><Sparkline values={values} label={label} point={selected} onPoint={setSelected} /></div>
      <label className="chart-slider">
        <span>Browse history <output>{thb.format(values[selected])}</output></span>
        <input aria-label="Portfolio history point" aria-valuetext={`${thb.format(values[selected])}, point ${selected + 1} of ${values.length}`}
          type="range" min={0} max={values.length - 1} value={selected} onChange={(event) => setSelected(Number(event.target.value))} />
      </label>
    </>
  );
}

export function Portfolio() {
  const [view, setView] = useState<"line" | "allocation">("line");
  const [period, setPeriod] = useState<Range>("1Y");
  const [sort, setSort] = useState("weight");
  const chart = useRef<HTMLElement>(null);
  return (
    <div className={`demo-screen portfolio ${view === "line" ? "portfolio-line" : "portfolio-allocation"}`}>
      <DemoData<PortfolioData> path="/api/v1/demo/portfolio" title="portfolio">
        {(data) => {
          const history = data.history[period];
          const holdings = [...data.holdings].sort((a, b) =>
            sort === "symbol" ? a.symbol.localeCompare(b.symbol) :
              sort === "change" ? b.change_percent - a.change_percent : b.weight - a.weight
          );
          return (
            <>
              <header className="portfolio-profile">
                <Link href="/companion" aria-label="Open Investor Companion" className="investor-avatar"><Character name="nobita" /><img className="companion-badge" src="/demo/doraemon-badge.svg" alt="" /></Link>
                <span className="muted">Investor</span><h1>{data.investor}</h1>
              </header>
              <section ref={chart} aria-label="Portfolio value">
                <div className="portfolio-value">
                  <div>
                    <strong>{thb.format(data.value_thb)}</strong>
                    <p className={history.change_thb >= 0 ? "gain" : "loss"}>
                      {history.change_thb >= 0 ? "+" : "−"}{thb.format(Math.abs(history.change_thb))} ({signed(history.change_percent)}%) {periodLabels[period]}
                    </p>
                  </div>
                  <div className="chart-toggle" role="group" aria-label="Chart view">
                    <button type="button" aria-label="Line chart" aria-pressed={view === "line"} onClick={() => setView("line")}><FontAwesomeIcon icon={faChartLine} /></button>
                    <button type="button" aria-label="Allocation chart" aria-pressed={view === "allocation"} onClick={() => setView("allocation")}><FontAwesomeIcon icon={faChartPie} /></button>
                  </div>
                </div>
                {view === "line" ? (
                  <>
                    <HistoryExplorer key={period} values={history.values} label={`Illustrative portfolio history, ${periodLabels[period]}`} />
                    <small>Illustrative history · synthetic prices</small>
                    <div className="segments" role="group" aria-label="Time range">
                      {ranges.map((range) => <button type="button" key={range} aria-pressed={period === range} onClick={() => setPeriod(range)}>{range}</button>)}
                    </div>
                  </>
                ) : <Allocation items={data.allocation} value={data.value_thb} />}
              </section>
              <Link href="/behavior" className="health-card">
                <div className="card-heading"><h2>Investing Behavior Score</h2><span>This month <FontAwesomeIcon icon={faChevronRight} /></span></div>
                <div className="score-summary"><div>{data.score_label}<small>{data.score} / 100 · 4 dimensions</small></div><Ring score={data.score} /></div>
              </Link>
              <section className="insights">
                <h2>Portfolio Insights Analytics</h2>
                <div className="insight-grid">
                  <button type="button" onClick={() => { setView("allocation"); chart.current?.scrollIntoView({ block: "start" }); }}>Largest allocation <strong>{data.allocation[0]?.name ?? "—"} {Number((data.allocation[0]?.percent ?? 0).toFixed(1))}%</strong></button>
                  <Link href="/stocks/VT">Explore VT <strong>Stock detail <FontAwesomeIcon icon={faChevronRight} /></strong></Link>
                </div>
              </section>
              <section aria-labelledby="holdings-title">
                <div className="card-heading holdings-heading">
                  <h2 id="holdings-title">Holdings</h2>
                  <label>Sort by <select value={sort} onChange={(event) => setSort(event.target.value)}><option value="weight">Weight</option><option value="symbol">Symbol</option><option value="change">Change</option></select></label>
                </div>
                {holdings.length === 0 && <p>No demo holdings.</p>}
                <ul className="holding-list">
                  {holdings.map((holding) => (
                    <li key={holding.symbol}>
                      <Link href={`/stocks/${holding.symbol}`} className="holding">
                        <TickerLogo symbol={holding.symbol} />
                        <span className="holding-name"><strong>{holding.symbol}</strong><small>{holding.name}</small></span>
                        <span className={`holding-trend ${holding.change_percent >= 0 ? "gain" : "loss"}`}><Sparkline values={holding.trend} /></span>
                        <span className="quote"><strong>{thb.format(data.value_thb * holding.weight / 100)}</strong><small>{holding.weight}%</small></span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <p className="source-label">VT includes US stocks also held in VOO. Portfolio total · {thb.format(data.value_thb)}</p>
              </section>
              <section className="paper-account" aria-label="Paper account">
                <h2>Paper account</h2>
                <DemoData<PaperAccount> path="/api/v1/demo/paper-account" title="paper account">
                  {(account) => (
                    <>
                      <p>Cash balance · <strong>{account.cash_thb_satang != null ? thbCash.format(account.cash_thb_satang / 100) : "—"}</strong></p>
                      <ul>{Object.keys(account.positions).sort().map((symbol) => (
                        <li key={symbol}><Link href={`/stocks/${symbol}`}>{symbol} <strong>{account.positions[symbol]?.toLocaleString("en-US", { maximumFractionDigits: 6 }) ?? 0}</strong> shares</Link></li>
                      ))}</ul>
                    </>
                  )}
                </DemoData>
              </section>
            </>
          );
        }}
      </DemoData>
      <DemoNav />
    </div>
  );
}
