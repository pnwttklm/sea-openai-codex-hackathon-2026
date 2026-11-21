"""Synthetic, versioned data for the local prototype."""

from app.schemas.demo import Factor, Stock

# Illustrative fund look-through and risk assumptions for the demo, not market data.
HEALTH_PLAN = {
    "monthly_target_thb": 30000,
    "contributions_thb": [20000, 10000],
    "scheduled_purchases": [True, True, False, False],
    "exposures": {
        "VOO": {"US equities": 1}, "VT": {"US equities": .6, "Other global equities": .4},
        "NVDA": {"US equities": 1}, "SE": {"Other global equities": 1},
        "SGOV": {"Treasury bills": 1}, "GLD": {"Gold": 1}, "BTC": {"Bitcoin": 1},
    },
    "risk_profiles": {
        "VOO": {"minimum_years": 5, "stress_loss_pct": 30, "risk_level": 2},
        "SGOV": {"minimum_years": 1, "stress_loss_pct": 2, "risk_level": 1},
        "VT": {"minimum_years": 5, "stress_loss_pct": 35, "risk_level": 2},
        "SE": {"minimum_years": 7, "stress_loss_pct": 50, "risk_level": 3},
        "GLD": {"minimum_years": 5, "stress_loss_pct": 25, "risk_level": 2},
        "BTC": {"minimum_years": 8, "stress_loss_pct": 70, "risk_level": 3},
        "NVDA": {"minimum_years": 7, "stress_loss_pct": 50, "risk_level": 3},
    },
    "goals": [
        {"name": "Marry Shizuka", "years": 5, "loss_capacity_pct": 15, "risk_comfort": 2, "symbols": ["NVDA"]},
        {"name": "Retirement in Thailand", "years": 25, "loss_capacity_pct": 40, "risk_comfort": 3, "symbols": ["VOO", "VT"]},
        {"name": "Time machine", "years": 3, "loss_capacity_pct": 10, "risk_comfort": 1, "symbols": ["SGOV"]},
        {"name": "Dream home", "years": 8, "loss_capacity_pct": 25, "risk_comfort": 2, "symbols": ["GLD", "SE", "BTC"]},
    ],
}

# Synthetic quote values; holding allocations follow the supplied THB 500,000 portfolio.
QUOTES = [
    ("VOO", "Vanguard S&P 500 ETF", "AMEX", 70256, 0.85, 35),
    ("NVDA", "NVIDIA", "NASDAQ", 21229, -0.03, 15),
    ("SGOV", "iShares 0–3 Month Treasury Bond ETF", "AMEX", 10045, 0.01, 15),
    ("VT", "Vanguard Total World Stock ETF", "AMEX", 13500, 0.45, 10),
    ("SE", "Sea Limited", "NYSE", 12000, -0.35, 10),
    ("GLD", "SPDR Gold Shares", "AMEX", 37000, 0.25, 10),
    ("BTC", "Bitcoin", "COINBASE", 9000000, -0.80, 5),
]
# Keep instrument pages available for existing demo positions and order history.
OTHER_QUOTES = [
    ("AMD", "Advanced Micro Devices, Inc.", "NASDAQ", 17523, 1.36),
    ("QQQ", "Invesco QQQ Trust", "NASDAQ", 71488, 0.87),
    ("AAPL", "Apple Inc.", "NASDAQ", 33227, 1.75),
    ("MSTR", "Strategy Inc.", "NASDAQ", 17526, -0.22),
    ("MSFT", "Microsoft Corporation", "NASDAQ", 49563, 0.63),
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
    portfolio = dict(
        investor="Nobita", value_thb=500000, history=history,
        allocation=[
            dict(name=name, percent=percent)
            for name, percent in [("Equities", 70), ("Treasury bills", 15), ("Gold", 10), ("Bitcoin", 5)]
        ],
        holdings=holdings,
    )
    factors = [
        Factor(name=name, score=score, label=label)
        for name, score, label in [
            ("Quality", 10, "Perfect"), ("Profitability", 8, "Excellent"),
            ("Growth", 2, "Low"), ("Dividend", 6, "Okay"), ("Valuation", 4, "Okay"),
        ]
    ]
    stocks = {
        holding["symbol"]: Stock(**holding, factors=[]).model_dump()
        for holding in holdings
    }
    for symbol, name, exchange, price, change in OTHER_QUOTES:
        stocks[symbol] = Stock(symbol=symbol, name=name, exchange=exchange, price_cents=price,
                               change_percent=change, factors=factors if symbol == "AMD" else []).model_dump()
    return dict(portfolio=portfolio, health_plan=HEALTH_PLAN, stocks=stocks)
