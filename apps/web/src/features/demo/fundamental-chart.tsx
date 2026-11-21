"use client";

import { useId, useState } from "react";
import { InstrumentRating } from "./instrument-rating";
import type { Factor } from "./data";

const axes = [
  { name: "Quality", angle: -90, left: 50, top: 7.5 },
  { name: "Growth", angle: -18, left: 87, top: 37 },
  { name: "Valuation", angle: 54, left: 72, top: 89 },
  { name: "Dividend", angle: 126, left: 28, top: 89 },
  { name: "Profitability", angle: 198, left: 13, top: 37 },
];

function point(angle: number, ratio: number) {
  const radians = angle * Math.PI / 180;
  return { x: 170 + Math.cos(radians) * 96 * ratio, y: 140 + Math.sin(radians) * 96 * ratio };
}

function outline(ratios: number[]) {
  return axes.map((axis, index) => {
    const { x, y } = point(axis.angle, ratios[index]);
    return `${x},${y}`;
  }).join(" ");
}

export function FundamentalChart({ symbol, factors }: { symbol: string; factors: Factor[] }) {
  const id = useId().replace(/:/g, "");
  const [view, setView] = useState<"Radar" | "Bars">("Radar");
  const [selected, setSelected] = useState("Quality");
  const scores = axes.map(axis => factors.find(f => f.name === axis.name)?.score ?? null);
  const active = factors.find(f => f.name === selected);
  if (!factors.length && process.env.NEXT_PUBLIC_SHARED_DEMO === "1") return <InstrumentRating key={symbol} symbol={symbol} />;
  return <section className="fundamentals factor-card-chart" aria-label={symbol + " fundamental ratings"}>
    <div className="factor-title"><h2>INVX Fundamentals</h2>
      <div className="factor-switch" role="group" aria-label="Chart style">{(["Radar", "Bars"] as const).map(v =>
        <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)}>{v}</button>)}</div>
    </div>
    {!factors.length ? <p className="factor-empty">Ratings unavailable for {symbol}</p> : <>
      {view === "Radar" ? <div className="factor-plot">
        <svg viewBox="0 0 340 272" aria-hidden="true">
          <defs>
            <linearGradient id={id+"-fill"} x1="0" x2="1" y1="0" y2="1">
              <stop stopColor="#a194ff" stopOpacity=".72" /><stop offset=".57" stopColor="#856eff" stopOpacity=".39" /><stop offset="1" stopColor="#59dbcf" stopOpacity=".28" />
            </linearGradient>
            <linearGradient id={id+"-edge"} x1="0" x2="1" y1="0" y2="1"><stop stopColor="#dbccff" /><stop offset=".58" stopColor="#ac9bff" /><stop offset="1" stopColor="#69ebd2" /></linearGradient>
          </defs>
          {[1,.8,.6,.4,.2].map(r => <polygon key={r} points={outline(axes.map(() => r))}
            fill={r===1 ? "#615d9f19" : "none"} stroke={r===1 ? "#59586f" : "#414151"} strokeWidth={r===1 ? 1.25 : 1} />)}
          {axes.map(axis => { const tip = point(axis.angle, 1); return <line key={axis.name} x1={170} y1={140} x2={tip.x} y2={tip.y}
            stroke={axis.name === selected ? "#a898ec" : "#666578"} strokeDasharray="2 5" />; })}
          {scores.every(s => s !== null) && <polygon points={outline(scores.map(s => Number(s)/10))} strokeLinejoin="round"
            fill={`url(#${id}-fill)`} stroke={`url(#${id}-edge)`} strokeWidth="2.4" />}
          {axes.map((axis,i) => { const score=scores[i]; if (score===null) return null;
            const {x,y}=point(axis.angle,score/10); return <g key={axis.name}>
              {selected===axis.name && <circle cx={x} cy={y} r="9" fill="#bdadff" opacity=".23" />}
              <circle cx={x} cy={y} r={selected===axis.name ? 4.5 : 3.4} fill="#e5dfff" stroke="#69609d" strokeWidth="1.5" />
            </g>; })}
        </svg>
        {axes.map((axis,i) => <button key={axis.name} type="button" className="factor-axis"
          style={{left:axis.left+"%",top:axis.top+"%"}} disabled={scores[i]===null}
          aria-label={`${axis.name}, ${scores[i] ?? "unavailable"} out of 10`}
          aria-pressed={selected===axis.name} onClick={() => setSelected(axis.name)}>
          <span>{axis.name}</span><strong>{scores[i]?.toFixed(1) ?? "—"}</strong>
        </button>)}
      </div> : <ul className="factor-bars" aria-label="Factor scores out of ten">
        {axes.map(({name},i) => <li key={name}><button type="button" disabled={scores[i]===null}
          onClick={() => setSelected(name)} aria-pressed={selected===name}>
          <span>{name}</span><i aria-hidden="true"><b style={{width:(scores[i] ?? 0)*10+"%"}} /></i><strong>{scores[i]?.toFixed(1) ?? "—"}</strong>
        </button></li>)}
      </ul>}
      <div className="factor-inspector" aria-live="polite"><div><strong>{selected}</strong><span>{active?.label ?? "Unavailable"}</span></div>
        <p>{active?.score.toFixed(1) ?? "—"}<small> / 10</small></p></div>
    </>}
    <p className="factor-source">Illustrative demo ratings</p>
  </section>;
}
