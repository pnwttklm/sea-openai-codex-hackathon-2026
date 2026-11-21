import type { Factor } from "./data";

const size = 240;
const center = 120;
const radius = 94;

export function Sparkline({ values, label }: { values: number[]; label?: string }) {
  if (values.length < 2) return null;
  const low = Math.min(...values);
  const span = Math.max(1, Math.max(...values) - low);
  const points = values.map((value, index) =>
    `${4 + (index * 292) / (values.length - 1)},${108 - ((value - low) * 100) / span}`
  );
  const [endX, endY] = points.at(-1)!.split(",");
  return (
    <svg viewBox="0 0 300 114" role={label ? "img" : undefined} aria-label={label} aria-hidden={!label || undefined}>
      {label && <polygon points={`4,114 ${points.join(" ")} 296,114`} fill="currentColor" opacity=".12" />}
      <polyline points={points.join(" ")} fill="none" stroke="currentColor" strokeWidth="1.6" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      {label && <circle cx={endX} cy={endY} r="3" fill="currentColor" />}
    </svg>
  );
}

export function Ring({ score }: { score: number }) {
  return (
    <span className="score-ring" aria-label={`${score} out of 100`}>
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <circle className="ring-track" cx="32" cy="32" r="26" />
        <circle className="ring-fill" cx="32" cy="32" r="26" pathLength="100" strokeDasharray={`${score} 100`} transform="rotate(-90 32 32)" />
      </svg>
      <strong aria-hidden="true">{score}</strong>
    </span>
  );
}

export function factorColor(score: number) {
  if (score >= 9) return "var(--mint)";
  if (score >= 8) return "var(--lime)";
  if (score >= 6) return "var(--yellow)";
  if (score >= 4) return "var(--amber)";
  return "var(--loss)";
}

export function Radar({ factors }: { factors: Factor[] }) {
  const point = (index: number, ratio: number) => {
    const angle = -Math.PI / 2 - index * 2 * Math.PI / factors.length;
    return [center + Math.cos(angle) * radius * ratio, center + Math.sin(angle) * radius * ratio];
  };
  const polygon = (ratios: number[]) => ratios.map((ratio, index) => point(index, ratio).join(",")).join(" ");
  return (
    <div className="radar">
      <svg viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        {[0.2, 0.4, 0.6, 0.8, 1].map((step) => <polygon key={step} className="radar-grid" points={polygon(factors.map(() => step))} />)}
        {factors.map(({name}, index) => {
          const [x, y] = point(index, 1);
          return <line key={name} className="radar-grid" x1={center} y1={center} x2={x} y2={y} />;
        })}
        <polygon className="radar-values" points={polygon(factors.map(({ score }) => score / 10))} />
        {factors.map(({name, score}, index) => {
          const [x, y] = point(index, score / 10);
          return <circle key={name} cx={x} cy={y} r="4" fill={factorColor(score)} />;
        })}
      </svg>
      <ul aria-label="Radar chart values">
        {factors.map(({name, score}, index) => (
          <li key={name} className={`radar-label radar-label-${index}`}>
            {name}<span style={{ color: factorColor(score) }}>{score.toFixed(1)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Gauge({ score }: { score: number }) {
  const arc = "M 8 48 A 42 42 0 0 1 92 48";
  return (
    <div className="factor-gauge" style={{ color: factorColor(score) }} aria-hidden="true">
      <svg viewBox="0 0 100 54">
        <path className="ring-track" d={arc} />
        {score > 0 && <path className="gauge-progress" d={arc} pathLength="100" strokeDasharray={`${score * 10} 100`} />}
      </svg>
      <strong>{score.toFixed(1)}</strong>
    </div>
  );
}
