"""
Mock market and options scenarios for safe offline testing.

These fixtures exercise extreme prices, volatility, and invalid payloads.
They do not replace live Yahoo Finance data in production unless
`USE_MOCK_DATA=true` is set in the backend environment.
"""

from __future__ import annotations

from copy import deepcopy
from typing import Any

# Spot / quote style fixtures (prices in USD).
MOCK_QUOTES: dict[str, dict[str, Any]] = {
    "MOCK_HIGH": {
        "ticker": "MOCK_HIGH",
        "company_name": "Mock High Price Corp",
        "price": 250_000.0,
        "daily_change": 1_250.0,
        "daily_change_percent": 0.5,
        "history_closes": [248_000.0, 249_000.0, 250_000.0],
    },
    "MOCK_LOW": {
        "ticker": "MOCK_LOW",
        "company_name": "Mock Low Price Corp",
        "price": 0.05,
        "daily_change": -0.01,
        "daily_change_percent": -16.67,
        "history_closes": [0.07, 0.06, 0.05],
    },
    "MOCK_NORMAL": {
        "ticker": "MOCK_NORMAL",
        "company_name": "Mock Normal Corp",
        "price": 150.0,
        "daily_change": 1.25,
        "daily_change_percent": 0.84,
        "history_closes": [148.0, 149.0, 150.0],
    },
}

# Options pricing input scenarios for engine tests.
MOCK_OPTIONS_SCENARIOS: list[dict[str, Any]] = [
    {
        "name": "extremely_high_spot",
        "spot_price": 250_000.0,
        "strike_price": 250_000.0,
        "time_to_expiration_years": 0.5,
        "risk_free_rate": 0.04,
        "volatility": 0.25,
        "option_type": "call",
        "expect_success": True,
    },
    {
        "name": "extremely_low_spot",
        "spot_price": 0.05,
        "strike_price": 0.05,
        "time_to_expiration_years": 0.25,
        "risk_free_rate": 0.04,
        "volatility": 0.3,
        "option_type": "put",
        "expect_success": True,
    },
    {
        "name": "high_volatility",
        "spot_price": 100.0,
        "strike_price": 100.0,
        "time_to_expiration_years": 1.0,
        "risk_free_rate": 0.05,
        "volatility": 2.5,
        "option_type": "call",
        "expect_success": True,
    },
    {
        "name": "low_volatility",
        "spot_price": 100.0,
        "strike_price": 100.0,
        "time_to_expiration_years": 0.5,
        "risk_free_rate": 0.03,
        "volatility": 0.01,
        "option_type": "call",
        "expect_success": True,
    },
    {
        "name": "missing_spot",
        "spot_price": None,
        "strike_price": 100.0,
        "time_to_expiration_years": 0.5,
        "risk_free_rate": 0.04,
        "volatility": 0.2,
        "option_type": "call",
        "expect_success": False,
    },
    {
        "name": "invalid_zero_strike",
        "spot_price": 100.0,
        "strike_price": 0.0,
        "time_to_expiration_years": 0.5,
        "risk_free_rate": 0.04,
        "volatility": 0.2,
        "option_type": "call",
        "expect_success": False,
    },
    {
        "name": "invalid_zero_volatility",
        "spot_price": 100.0,
        "strike_price": 100.0,
        "time_to_expiration_years": 0.5,
        "risk_free_rate": 0.04,
        "volatility": 0.0,
        "option_type": "call",
        "expect_success": False,
    },
    {
        "name": "invalid_nan_spot",
        "spot_price": float("nan"),
        "strike_price": 100.0,
        "time_to_expiration_years": 0.5,
        "risk_free_rate": 0.04,
        "volatility": 0.2,
        "option_type": "call",
        "expect_success": False,
    },
]


def get_mock_quote(ticker: str) -> dict[str, Any] | None:
    """Return a deep copy of a mock quote, or None if the ticker is unknown."""
    key = (ticker or "").strip().upper()
    quote = MOCK_QUOTES.get(key)
    return deepcopy(quote) if quote else None


def run_mock_pricing_scenarios() -> list[dict[str, Any]]:
    """
    Execute each mock options scenario against Monte Carlo (small sim count).

    Successful scenarios must return a finite non-negative price.
    Failure scenarios must raise OptionsValidationError (or TypeError for None)
    without crashing the process.
    """
    from utils.options_pricing import OptionsValidationError, monte_carlo_price

    outcomes: list[dict[str, Any]] = []

    for scenario in MOCK_OPTIONS_SCENARIOS:
        name = scenario["name"]
        try:
            price = monte_carlo_price(
                spot_price=scenario["spot_price"],
                strike_price=scenario["strike_price"],
                time_to_expiration_years=scenario["time_to_expiration_years"],
                risk_free_rate=scenario["risk_free_rate"],
                volatility=scenario["volatility"],
                option_type=scenario["option_type"],
                simulations=500,
                seed=42,
                workers=1,
            )
            ok = (
                scenario["expect_success"]
                and isinstance(price, float)
                and price == price
                and price >= 0
            )
            outcomes.append(
                {
                    "name": name,
                    "passed": ok,
                    "price": price if scenario["expect_success"] else None,
                    "error": None if ok else "Expected failure but pricing succeeded.",
                }
            )
        except (OptionsValidationError, TypeError, ValueError) as exc:
            outcomes.append(
                {
                    "name": name,
                    "passed": not scenario["expect_success"],
                    "price": None,
                    "error": str(exc),
                }
            )
        except Exception as exc:  # pragma: no cover - unexpected crash marker
            outcomes.append(
                {
                    "name": name,
                    "passed": False,
                    "price": None,
                    "error": f"Unexpected crash: {exc}",
                }
            )

    return outcomes


if __name__ == "__main__":
    import json
    import sys
    from pathlib import Path

    # Allow `python utils/mock_data.py` from the backend directory.
    backend_root = Path(__file__).resolve().parents[1]
    if str(backend_root) not in sys.path:
        sys.path.insert(0, str(backend_root))

    results = run_mock_pricing_scenarios()
    print(json.dumps(results, indent=2))
    if not all(item["passed"] for item in results):
        raise SystemExit(1)
