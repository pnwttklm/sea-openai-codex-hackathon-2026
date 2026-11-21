"""Synthetic, versioned data for the local prototype."""

from app.schemas.demo import Behavior, Factor, Portfolio, Stock

BEHAVIOR = Behavior(
    score=30,
    label="Low",
    explanation="Your recent low investing behavior score has been driven by sub-optimal decision making in investments.",
    factors=[
        Factor(name=name, score=score, label=label)
        for name, score, label in [
            ("Discipline", 10, "Perfect"),
            ("Performance", 8, "Excellent"),
            ("Decision", 2, "Low"),
            ("Pressure", 6, "Okay"),
            ("Psychology", 4, "Okay"),
        ]
    ],
)

QUOTES = [
    ("VOO", "Vanguard S&P 500 ETF", "AMEX", 70256, 0.85, 27.31),
    ("QQQ", "Invesco QQQ Trust", "NASDAQ", 71488, 0.87, 21.83),
    ("NVDA", "NVIDIA Corporation", "NASDAQ", 21229, -0.03, 9.81),
    ("AAPL", "Apple Inc.", "NASDAQ", 33227, 1.75, 5.32),
    ("MSTR", "Strategy Inc.", "NASDAQ", 17526, -0.22, 5.00),
    ("MSFT", "Microsoft Corporation", "NASDAQ", 49563, 0.63, 4.92),
    ("AMD", "Advanced Micro Devices, Inc.", "NASDAQ", 17523, 1.36, 4.32),
]

TRAIL = [
    0, 4, 1, 18, 25, 14, 37, 51, 43, 60, 54, 61, 77, 88, 75, 80, 67,
    74, 63, 82, 91, 81, 87, 75, 68, 54, 70, 62, 74, 64, 32, 100, 55, 79,
    85, 82, 76, 80, 74, 81, 84,
]


def seed_document() -> dict:
    holdings = [
        dict(
            symbol=symbol, name=name, exchange=exchange, price_cents=price,
            change_percent=change, weight=weight,
            trend=[2, 3, 1, 4, 6, 5, 8, 6, 9, 7] if change >= 0 else [8, 7, 9, 5, 6, 4, 2, 3, 1, 2],
        )
        for symbol, name, exchange, price, change, weight in QUOTES
    ]
    history = {}
    for index, (period, start, change_percent) in enumerate([
        ("1Y", 450000, 10), ("3Y", 392000, 27.55), ("5Y", 340000, 47.06),
        ("10Y", 289000, 73.01), ("All", 250000, 100),
    ]):
        span = 500000 - start
        noise = [round(start + (point / 84) * span) for point in TRAIL]
        points = noise if index == 0 else [round((value + start + span * i / 40) / 2) for i, value in enumerate(noise)]
        history[period] = dict(values=points, change_thb=span, change_percent=change_percent)
    portfolio = Portfolio(
        investor="Nobita", value_thb=500000, history=history,
        allocation=[
            dict(name=name, percent=percent)
            for name, percent in [("Growth", 30), ("Core", 22), ("Income", 20), ("Broad market", 18), ("Cash", 5), ("Other", 5)]
        ],
        holdings=holdings, score=BEHAVIOR.score, score_label=BEHAVIOR.label,
    )
    factors = [
        Factor(name=name, score=score, label=label)
        for name, score, label in [
            ("Quality", 10, "Perfect"), ("Profitability", 8, "Excellent"),
            ("Growth", 2, "Low"), ("Dividend", 6, "Okay"), ("Valuation", 4, "Okay"),
        ]
    ]
    stocks = {
        holding["symbol"]: Stock(**holding, factors=factors if holding["symbol"] == "AMD" else []).model_dump()
        for holding in holdings
    }
    return dict(portfolio=portfolio.model_dump(), behavior=BEHAVIOR.model_dump(), stocks=stocks)
