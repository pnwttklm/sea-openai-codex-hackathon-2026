from decimal import ROUND_CEILING, ROUND_HALF_UP, Decimal

from app.schemas.future_you import FutureAssessment, FuturePlan, FutureProfile, VoiceStyle

GOAL_NAMES = {
    "wedding": "Marry Shizuka",
    "retirement": "Retirement in Thailand",
    "time-machine": "Time machine",
    "home": "Dream home",
    "other": "Your saved goal",
}

GENDER_VOICE_STYLES: dict[str, VoiceStyle] = {
    "male": "masculine",
    "man": "masculine",
    "ชาย": "masculine",
    "ผู้ชาย": "masculine",
    "female": "feminine",
    "woman": "feminine",
    "หญิง": "feminine",
    "ผู้หญิง": "feminine",
}


def profile_voice_style(profile: FutureProfile | None) -> VoiceStyle:
    if profile is None:
        return "neutral"
    return profile.voice_style or GENDER_VOICE_STYLES.get((profile.gender or "").casefold(), "neutral")


def assess_plan(plan: FuturePlan) -> FutureAssessment:
    annual_rate = Decimal("0.04") if plan.goal == "wedding" else Decimal(0)
    rate = annual_rate / 12
    months = plan.years * 12
    growth = (1 + rate) ** months
    contribution_factor = (growth - 1) / rate if rate else Decimal(months)
    grown_savings = plan.saved * growth
    projected = (grown_savings + plan.monthly * contribution_factor).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    )
    gap = max(Decimal(0), plan.target - projected)
    required = max(Decimal(0), (plan.target - grown_savings) / contribution_factor)
    return FutureAssessment(
        projected=float(projected),
        gap=float(gap),
        on_track=gap == 0,
        required_monthly=int(required.to_integral_value(rounding=ROUND_CEILING)),
        annual_rate=float(annual_rate),
    )
