import { useState } from "react";
import { agents, Mascot, type Agent } from "./mascots";
import styles from "./system-map.module.css";

const routes: Record<Agent, { tool: string; destination: string; detail: string }[]> = {
  companion: [
    { tool: "get_my_profile", destination: "MongoDB", detail: "future_you_demo · profile" },
    { tool: "list_my_goals", destination: "MongoDB", detail: "future_you_demo · saved goals" },
  ],
  goal_planner: [
    { tool: "assess_my_goal", destination: "Goal projection", detail: "Saved goal from MongoDB → assess_plan" },
    { tool: "preview_my_contribution", destination: "Contribution preview", detail: "Saved goal → baseline and revised projections" },
  ],
  portfolio_analyst: [
    { tool: "read_my_portfolio", destination: "MongoDB", detail: "paper_accounts + demo_snapshots → portfolio value" },
  ],
  sentiment_analyst: [
    { tool: "reflect_current_turn", destination: "Sentiment analysis", detail: "Current message → OpenAI or offline classifier" },
    { tool: "get_headline_sample", destination: "News source", detail: "Demo headlines or configured Webull feed → tone analysis" },
  ],
};

function Arrow() {
  return <span className={styles.arrow} aria-hidden="true">→</span>;
}

export function SystemMap() {
  const [selected, setSelected] = useState<Agent>("companion");
  return <section className={styles.map} aria-labelledby="map-title">
    <h2 id="map-title">System connections</h2>
    <div className={styles.flow} aria-label="Request path">
      <div><strong>Next.js</strong><small>Investor interface</small></div><Arrow />
      <div><strong>FastAPI</strong><small>Companion turns</small></div><Arrow />
      <div><strong>Doraemon router</strong><small>OpenAI or offline routing</small></div>
    </div>
    <div className={styles.branches} role="group" aria-label="Show connections for an agent">
      {(Object.keys(routes) as Agent[]).map(agent => <button key={agent} type="button"
        aria-controls="agent-connections" aria-pressed={agent === selected} onClick={() => setSelected(agent)}>
        <Mascot agent={agent} size={36} /><span>{agents[agent]}</span>
      </button>)}
    </div>
    <section id="agent-connections" className={styles.tools} aria-live="polite" aria-atomic="true">
      <h3>{agents[selected]} · FastMCP tools</h3>
      {routes[selected].map(route => <div className={styles.route} key={route.tool}>
        <code>{route.tool}</code><Arrow /><div><strong>{route.destination}</strong><small>{route.detail}</small></div>
      </div>)}
    </section>
    <div className={styles.telemetry}><strong>Run telemetry</strong>
      <span>Agent spans → MongoDB (agent_runs, agent_spans) → private Operator dashboard</span>
    </div>
  </section>;
}
