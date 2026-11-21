export const agents = {
  companion: "Investor Companion (Doraemon)", goal_planner: "Goal Planner",
  portfolio_analyst: "Portfolio Analyst", sentiment_analyst: "Sentiment Analyst",
} as const;
export type Agent = keyof typeof agents;

export function Mascot({ agent, size = 54 }: { agent: Agent; size?: number }) {
  return <img src={`/agents/${agent}.webp`} alt="" width={size} height={size}
    style={{ objectFit: "contain", flexShrink: 0 }} />;
}
