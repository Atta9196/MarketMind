from __future__ import annotations

import os
from enum import Enum
from multiprocessing import Pool
from typing import Any

from models.options_schemas import OptionStatus, OptionType


class OptionsValidationError(ValueError):
    """Raised when option pricing inputs are invalid."""


def _finite_positive(name: str, value: float, *, allow_zero: bool = False) -> float:
    try:
        number = float(value)
    except (TypeError, ValueError) as exc:
        raise OptionsValidationError(f"{name} must be a valid number.") from exc

    if number != number or number in (float("inf"), float("-inf")):
        raise OptionsValidationError(f"{name} must be a finite number.")

    if allow_zero:
        if number < 0:
            raise OptionsValidationError(f"{name} must be greater than or equal to 0.")
    elif number <= 0:
        raise OptionsValidationError(f"{name} must be greater than 0.")

    return number


def validate_pricing_inputs(
    spot_price: float,
    strike_price: float,
    time_to_expiration_years: float,
    risk_free_rate: float,
    volatility: float,
) -> tuple[float, float, float, float, float]:
    """Normalize and reject unsafe pricing inputs before running engines."""
    spot = _finite_positive("Spot price", spot_price)
    strike = _finite_positive("Strike price", strike_price)
    time_years = _finite_positive("Time to expiration", time_to_expiration_years, allow_zero=True)
    rate = _finite_positive("Risk-free rate", risk_free_rate, allow_zero=True)
    vol = _finite_positive("Volatility", volatility)

    if strike > 1_000_000:
        raise OptionsValidationError("Strike price is unrealistically high.")
    if vol > 5:
        raise OptionsValidationError("Volatility must be at most 500%.")
    if rate > 1:
        raise OptionsValidationError("Risk-free rate must be at most 100%.")

    return spot, strike, time_years, rate, vol


def _worker_count(requested: int | None, workload: int) -> int:
    cpu_cores = os.cpu_count() or 1
    available = max(1, cpu_cores)
    if requested is not None:
        available = max(1, min(requested, available))
    return max(1, min(available, max(1, workload)))


def _split_simulation_counts(total: int, workers: int) -> list[int]:
    base = total // workers
    remainder = total % workers
    sizes = [base + (1 if index < remainder else 0) for index in range(workers)]
    return [size for size in sizes if size > 0]


def determine_option_status(
    spot_price: float,
    strike_price: float,
    option_type: OptionType | str,
    time_to_expiration_years: float,
) -> OptionStatus:
    if time_to_expiration_years <= 0:
        intrinsic = _intrinsic_value(spot_price, strike_price, option_type)
        return OptionStatus.ITM if intrinsic > 0 else OptionStatus.KNOCKED_OUT

    if _is_in_the_money(spot_price, strike_price, option_type):
        return OptionStatus.ITM

    return OptionStatus.OTM


def _monte_carlo_payoffs_chunk(payload: dict[str, Any]) -> list[float]:
    """Generate one worker's Monte Carlo payoff paths (picklable for ProcessPool)."""
    import numpy as np

    simulations = int(payload["simulations"])
    if simulations < 1:
        return []

    rng = np.random.default_rng(payload.get("seed"))
    shocks = rng.standard_normal(simulations)
    drift = (
        payload["risk_free_rate"] - 0.5 * payload["volatility"] ** 2
    ) * payload["time_to_expiration_years"]
    diffusion = (
        payload["volatility"]
        * (payload["time_to_expiration_years"] ** 0.5)
        * shocks
    )
    terminal_prices = payload["spot_price"] * np.exp(drift + diffusion)

    if str(payload["option_type"]).lower() == "call":
        payoffs = np.maximum(terminal_prices - payload["strike_price"], 0.0)
    else:
        payoffs = np.maximum(payload["strike_price"] - terminal_prices, 0.0)

    return payoffs.astype(float).tolist()


def monte_carlo_price(
    *,
    spot_price: float,
    strike_price: float,
    time_to_expiration_years: float,
    risk_free_rate: float,
    volatility: float,
    option_type: OptionType | str,
    simulations: int,
    seed: int | None = None,
    workers: int | None = None,
) -> float:
    """
    Price an option with Monte Carlo simulation across a process pool,
    then average discounted payoffs.
    """
    import numpy as np

    spot_price, strike_price, time_to_expiration_years, risk_free_rate, volatility = (
        validate_pricing_inputs(
            spot_price,
            strike_price,
            time_to_expiration_years,
            risk_free_rate,
            volatility,
        )
    )

    option_type_value = (
        option_type.value if isinstance(option_type, Enum) else str(option_type)
    )

    if time_to_expiration_years <= 0:
        return _intrinsic_value(spot_price, strike_price, option_type)

    if simulations < 1:
        raise OptionsValidationError("Monte Carlo simulations must be at least 1.")

    worker_count = _worker_count(workers, simulations)
    chunk_sizes = _split_simulation_counts(simulations, worker_count)
    chunk_payloads = [
        {
            "spot_price": spot_price,
            "strike_price": strike_price,
            "time_to_expiration_years": time_to_expiration_years,
            "risk_free_rate": risk_free_rate,
            "volatility": volatility,
            "option_type": option_type_value,
            "simulations": chunk_size,
            "seed": None if seed is None else seed + index,
        }
        for index, chunk_size in enumerate(chunk_sizes)
    ]

    process_count = max(1, len(chunk_payloads))
    with Pool(processes=process_count) as pool:
        payoff_arrays = pool.map(_monte_carlo_payoffs_chunk, chunk_payloads)

    all_payoffs = np.asarray(
        [payoff for chunk in payoff_arrays for payoff in chunk],
        dtype=float,
    )
    discounted = _exp(-risk_free_rate * time_to_expiration_years) * float(
        np.mean(all_payoffs)
    )
    return max(discounted, 0.0)


def _intrinsic_value(
    spot_price: float,
    strike_price: float,
    option_type: OptionType | str,
) -> float:
    if _is_call(option_type):
        return max(spot_price - strike_price, 0.0)
    return max(strike_price - spot_price, 0.0)


def _is_in_the_money(
    spot_price: float,
    strike_price: float,
    option_type: OptionType | str,
) -> bool:
    return _intrinsic_value(spot_price, strike_price, option_type) > 0


def _is_call(option_type: OptionType | str) -> bool:
    if isinstance(option_type, Enum):
        return option_type == OptionType.CALL
    return str(option_type).lower() == "call"


def _exp(value: float) -> float:
    import math

    return math.exp(value)
