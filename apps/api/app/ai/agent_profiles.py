from dataclasses import dataclass

from app.schemas.companion import Agent


@dataclass(frozen=True)
class AgentProfile:
    name: str
    instructions: str
    tools: tuple[str, ...]


PROFILES: dict[Agent, AgentProfile] = {
    "companion": AgentProfile("Investor Companion (Doraemon)",
        "Route each relevant part of the investor's question once. Respond in their language.",
        ("get_my_profile", "list_my_goals")),
    "goal_planner": AgentProfile("Goal Planner",
        "Use the selected saved goal and deterministic projections. Preview only.",
        ("assess_my_goal", "preview_my_contribution")),
    "portfolio_analyst": AgentProfile("Portfolio Analyst",
        "Report the dated snapshot. Keep goal balances separate.", ("read_my_portfolio",)),
    "sentiment_analyst": AgentProfile("Sentiment Analyst",
        "Reflect only explicit first-person feelings. Describe the tone of sampled headlines with evidence.",
        ("reflect_current_turn", "get_headline_sample")),
}
