export function Sparkline({ values, label, point, onPoint }: {
  values: number[];
  label?: string;
  point?: number;
  onPoint?: (point: number) => void;
}) {
  if (values.length < 2) return null;
  const low = Math.min(...values);
  const span = Math.max(1, Math.max(...values) - low);
  const points = values.map((value, index) =>
    `${4 + (index * 292) / (values.length - 1)},${108 - ((value - low) * 100) / span}`
  );
  const selected = points[point ?? values.length - 1] ?? points[values.length - 1];
  const [endX, endY] = selected.split(",");
  return (
    <svg viewBox="0 0 300 114" role={label ? "img" : undefined} aria-label={label} aria-hidden={!label || undefined}
      className={onPoint ? "chart-interactive" : undefined}
      onClick={onPoint ? (event) => {
        const matrix = event.currentTarget.getScreenCTM();
        if (!matrix) return;
        const { x } = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
        onPoint(Math.max(0, Math.min(values.length - 1, Math.round(((x - 4) / 292) * (values.length - 1)))));
      } : undefined}>
      {point != null && <line x1={endX} x2={endX} y1={4} y2={112} stroke="currentColor" opacity=".45" strokeDasharray="3 3" />}
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
