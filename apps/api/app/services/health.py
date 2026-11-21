"""Investor health rubric for the synthetic monthly planning snapshot."""

from app.schemas.demo import Behavior, HealthDimension


def investor_health(snapshot: dict) -> Behavior:
    plan = snapshot["health_plan"]
    target = plan["monthly_target_thb"]
    saved = sum(plan["contributions_thb"])
    purchases = plan["scheduled_purchases"]
    completed = sum(purchases)
    holdings = snapshot["portfolio"]["holdings"]
    # Combine direct and look-through fund weights in the same exposure buckets.
    exposure = {}
    for holding in holdings:
        for bucket, share in plan["exposures"][holding["symbol"]].items():
            exposure[bucket] = exposure.get(bucket, 0) + holding["weight"] * share
    exposure["Other assets"] = 100 - sum(h["weight"] for h in holdings)
    largest = max(exposure, key=exposure.get)

    matches = 0
    checks = 0
    goal_notes = []
    for goal in plan["goals"]:
        assets = [plan["risk_profiles"][symbol] for symbol in goal["symbols"]]
        horizon = goal["years"] >= max(asset["minimum_years"] for asset in assets)
        loss = goal["loss_capacity_pct"] >= max(asset["stress_loss_pct"] for asset in assets)
        comfort = goal["risk_comfort"] >= max(asset["risk_level"] for asset in assets)
        results = {"time horizon": horizon, "loss capacity": loss, "risk comfort": comfort}
        matches += sum(results.values())
        checks += len(results)
        gaps = ", ".join(name for name, fits in results.items() if not fits)
        goal_notes.append(f"{goal['name']} ({', '.join(goal['symbols'])}, {goal['years']} years): "
                          + (f"review {gaps}." if gaps else "all three checks fit."))

    def dimension(name: str, question: str, measure: str, ratio: float) -> HealthDimension:
        score = round(10 * min(1, max(0, ratio)), 1)
        label = "On track" if score >= 8 else "Mixed" if score >= 5 else "Needs attention"
        return HealthDimension(name=name, question=question, measurement=measure, score=score, label=label)

    factors = [
        dimension("Contribution", "Am I setting aside what I planned?",
                  f"THB {saved:,} set aside toward your monthly target of THB {target:,}. "
                  "Reaching the target earns full credit.", saved / target),
        dimension("DCA Consistency", "Am I investing regularly?",
                  f"{completed} of {len(purchases)} scheduled purchases completed this month. "
                  "Only completed recurring purchases count.", completed / len(purchases)),
        dimension("Diversification", "How much of my money depends on the same investments?",
                  f"{largest} is your largest shared exposure at {exposure[largest]:.1f}%. "
                  "The demo combines direct holdings and estimated fund exposures. "
                  "The score falls as exposure concentrates in fewer buckets.",
                  1 - sum((weight / 100) ** 2 for weight in exposure.values())),
        dimension("Goal & Risk Fit", "Does the way I invest make sense for each goal?",
                  " ".join(goal_notes) + f" {matches} of {checks} checks fit.", matches / checks),
    ]
    total = round(sum(f.score for f in factors) * 2.5)
    return Behavior(monthly_target_thb=target, score=total,
                    label="On track" if total >= 80 else "Mixed" if total >= 50 else "Needs attention",
                    explanation="Each dimension contributes 25% of this illustrative monthly score.",
                    factors=factors)
