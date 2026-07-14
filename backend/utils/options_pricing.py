from __future__ import annotations

import os
from enum import Enum
from multiprocessing import Pool
from typing import Any

from models.options_schemas import OptionStatus, OptionType


class OptionsValidationError(ValueError):
    """Raised when option pricing inputs are invalid."""


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


def black_scholes_price(
    spot_price: float,
    strike_price: float,
    time_to_expiration_years: float,
    risk_free_rate: float,
    volatility: float,
    option_type: OptionType | str,
) -> float:
    from scipy.stats import norm

    if time_to_expiration_years <= 0:
        return _intrinsic_value(spot_price, strike_price, option_type)

    sqrt_t = time_to_expiration_years**0.5
    d1 = (
        _log(spot_price / strike_price)
        + (risk_free_rate + 0.5 * volatility**2) * time_to_expiration_years
    ) / (volatility * sqrt_t)
    d2 = d1 - volatility * sqrt_t
    discount = _exp(-risk_free_rate * time_to_expiration_years)

    is_call = _is_call(option_type)

    if is_call:
        price = spot_price * norm.cdf(d1) - strike_price * discount * norm.cdf(d2)
    else:
        price = strike_price * discount * norm.cdf(-d2) - spot_price * norm.cdf(-d1)

    return max(float(price), 0.0)


def black_scholes_greeks(
    spot_price: float,
    strike_price: float,
    time_to_expiration_years: float,
    risk_free_rate: float,
    volatility: float,
    option_type: OptionType | str,
) -> dict[str, float]:
    from math import exp, log, pi, sqrt

    from scipy.stats import norm

    if time_to_expiration_years <= 0 or volatility <= 0:
        return {"delta": 0.0, "gamma": 0.0, "theta": 0.0, "vega": 0.0}

    sqrt_t = sqrt(time_to_expiration_years)
    d1 = (
        log(spot_price / strike_price)
        + (risk_free_rate + 0.5 * volatility**2) * time_to_expiration_years
    ) / (volatility * sqrt_t)
    d2 = d1 - volatility * sqrt_t
    discount = exp(-risk_free_rate * time_to_expiration_years)
    pdf_d1 = exp(-(d1**2) / 2) / sqrt(2 * pi)
    is_call = _is_call(option_type)

    delta = norm.cdf(d1) if is_call else norm.cdf(d1) - 1
    gamma = pdf_d1 / (spot_price * volatility * sqrt_t)
    theta = (
        -(spot_price * pdf_d1 * volatility) / (2 * sqrt_t)
        - risk_free_rate * strike_price * discount * (norm.cdf(d2) if is_call else norm.cdf(-d2))
    ) / 365
    vega = (spot_price * pdf_d1 * sqrt_t) / 100

    return {
        "delta": round(delta, 3),
        "gamma": round(gamma, 3),
        "theta": round(theta, 3),
        "vega": round(vega, 3),
    }


def binomial_tree_nodes(steps: int) -> int:
    return ((steps + 1) * (steps + 2)) // 2


def binomial_tree_price(
    spot_price: float,
    strike_price: float,
    time_to_expiration_years: float,
    risk_free_rate: float,
    volatility: float,
    option_type: OptionType | str,
    steps: int,
) -> float:
    import numpy as np

    if time_to_expiration_years <= 0:
        return _intrinsic_value(spot_price, strike_price, option_type)

    if steps < 1:
        raise OptionsValidationError("Binomial tree steps must be at least 1.")

    dt = time_to_expiration_years / steps
    u = _exp(volatility * dt**0.5)
    d = 1.0 / u
    growth = _exp(risk_free_rate * dt)
    prob = (growth - d) / (u - d)

    if prob < 0 or prob > 1:
        raise OptionsValidationError(
            "Binomial tree parameters produced an invalid risk-neutral probability.",
        )

    is_call = _is_call(option_type)
    discount = _exp(-risk_free_rate * dt)

    option_values = np.zeros(steps + 1, dtype=float)
    for step in range(steps + 1):
        stock_price = spot_price * (u ** (steps - step)) * (d**step)
        option_values[step] = max(
            stock_price - strike_price if is_call else strike_price - stock_price,
            0.0,
        )

    for step in range(steps - 1, -1, -1):
        for node in range(step + 1):
            continuation = discount * (
                prob * option_values[node] + (1.0 - prob) * option_values[node + 1]
            )
            option_values[node] = continuation

    return max(float(option_values[0]), 0.0)


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


def _binomial_tree_price_worker(payload: dict[str, Any]) -> float:
    """Run binomial pricing in a worker process."""
    return binomial_tree_price(
        spot_price=payload["spot_price"],
        strike_price=payload["strike_price"],
        time_to_expiration_years=payload["time_to_expiration_years"],
        risk_free_rate=payload["risk_free_rate"],
        volatility=payload["volatility"],
        option_type=payload["option_type"],
        steps=payload["steps"],
    )


def price_binomial_and_monte_carlo_parallel(
    *,
    spot_price: float,
    strike_price: float,
    time_to_expiration_years: float,
    risk_free_rate: float,
    volatility: float,
    option_type: OptionType | str,
    steps: int,
    simulations: int,
    seed: int | None = None,
    workers: int | None = None,
) -> tuple[float, float]:
    """
    Dispatch binomial pricing and Monte Carlo path chunks across a process pool,
    then aggregate Monte Carlo payoffs to a mean option price.
    """
    import numpy as np

    option_type_value = (
        option_type.value if isinstance(option_type, Enum) else str(option_type)
    )

    if time_to_expiration_years <= 0:
        intrinsic = _intrinsic_value(spot_price, strike_price, option_type)
        return intrinsic, intrinsic

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

    binomial_payload = {
        "spot_price": spot_price,
        "strike_price": strike_price,
        "time_to_expiration_years": time_to_expiration_years,
        "risk_free_rate": risk_free_rate,
        "volatility": volatility,
        "option_type": option_type_value,
        "steps": steps,
    }

    process_count = max(1, len(chunk_payloads))
    with Pool(processes=process_count) as pool:
        binomial_async = pool.apply_async(_binomial_tree_price_worker, (binomial_payload,))
        payoff_arrays = pool.map(_monte_carlo_payoffs_chunk, chunk_payloads)
        binomial_price = float(binomial_async.get())

    all_payoffs = np.asarray(
        [payoff for chunk in payoff_arrays for payoff in chunk],
        dtype=float,
    )
    discounted = _exp(-risk_free_rate * time_to_expiration_years) * float(
        np.mean(all_payoffs)
    )
    return max(binomial_price, 0.0), max(discounted, 0.0)

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


def _log(value: float) -> float:
    import math

    return math.log(value)


def _exp(value: float) -> float:
    import math

    return math.exp(value)
