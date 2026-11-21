"use client";

import { useState } from "react";
import { DemoData, type BehaviorData } from "./data";
import { Gauge, Radar, Ring } from "./charts";
import { BackLink } from "./shell";

export function Behavior() {
  const [community, setCommunity] = useState(false);
  return (
    <div className="demo-screen behavior">
      <div className="segments" role="group" aria-label="Score audience">
        <button type="button" aria-pressed={!community} onClick={() => setCommunity(false)}>Me</button>
        <button type="button" aria-pressed={community} onClick={() => setCommunity(true)}>Community</button>
      </div>
      <header className="view-header"><BackLink /><h1>Investing Behavior Score</h1></header>
      {community ? <p className="demo-state">Community scores are unavailable in this demo.</p> : (
        <DemoData<BehaviorData> path="/api/v1/demo/behavior" title="investing behavior score">
          {(data) => (
            <>
              <section className="behavior-card">
                <h2>Investing Behavior Score</h2>
                <div className="score-summary">
                  <div><strong className="assessment">{data.label}</strong><small>{data.score} / 100 points</small></div>
                  <Ring score={data.score} />
                </div>
                <Radar factors={data.factors} />
                <p className="score-explanation">{data.explanation}</p>
              </section>
              <section className="factor-grid" aria-label="Score factors">
                {data.factors.map((factor) => (
                  <article className="factor-card" key={factor.name}>
                    <h2>{factor.name}</h2>
                    <Gauge score={factor.score} />
                    <strong>{factor.label}<span className="sr-only">, {factor.score.toFixed(1)} out of 10</span></strong>
                  </article>
                ))}
              </section>
              <p className="source-label">Demo investing behavior score</p>
            </>
          )}
        </DemoData>
      )}
    </div>
  );
}
