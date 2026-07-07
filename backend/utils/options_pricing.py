from enum import Enum

from models.options_schemas import OptionStatus, OptionType


class OptionsValidationError(ValueError):
    """Raised when option pricing inputs are invalid."""


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


def monte_carlo_price(
    spot_price: float,
    strike_price: float,
    time_to_expiration_years: float,
    risk_free_rate: float,
    volatility: float,
    option_type: OptionType | str,
    simulations: int,
    seed: int | None = None,
) -> float:
    import numpy as np

    if time_to_expiration_years <= 0:
        return _intrinsic_value(spot_price, strike_price, option_type)

    if simulations < 1:
        raise OptionsValidationError("Monte Carlo simulations must be at least 1.")

    rng = np.random.default_rng(seed)
    shocks = rng.standard_normal(simulations)
    drift = (risk_free_rate - 0.5 * volatility**2) * time_to_expiration_years
    diffusion = volatility * (time_to_expiration_years**0.5) * shocks
    terminal_prices = spot_price * np.exp(drift + diffusion)

    is_call = _is_call(option_type)
    if is_call:
        payoffs = np.maximum(terminal_prices - strike_price, 0.0)
    else:
        payoffs = np.maximum(strike_price - terminal_prices, 0.0)

    discounted = _exp(-risk_free_rate * time_to_expiration_years) * float(np.mean(payoffs))
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


def _log(value: float) -> float:
    import math

    return math.log(value)


def _exp(value: float) -> float:
    import math

    return math.exp(value)
