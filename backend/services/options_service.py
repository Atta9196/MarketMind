import logging
import time

from config import Settings
from models.options_schemas import (
    BinomialMeta,
    Greeks,
    ModelResult,
    OptionsCalculateRequest,
    OptionsCalculateResponse,
    OptionStatus,
)
from services.stock_service import StockService
from utils.options_pricing import (
    OptionsValidationError,
    binomial_tree_nodes,
    binomial_tree_price,
    black_scholes_greeks,
    black_scholes_price,
    determine_option_status,
    monte_carlo_price,
)

logger = logging.getLogger(__name__)


class OptionsService:
    """Prices options using multiple quantitative models."""

    def __init__(self, settings: Settings, stock_service: StockService) -> None:
        self._settings = settings
        self._stock_service = stock_service

    async def calculate(self, request: OptionsCalculateRequest) -> OptionsCalculateResponse:
        stock = await self._stock_service.get_stock(request.ticker)
        spot_price = stock.price
        time_years = request.time_to_expiration_days / 365.0

        status = determine_option_status(
            spot_price=spot_price,
            strike_price=request.strike_price,
            option_type=request.option_type,
            time_to_expiration_years=time_years,
        )

        steps = self._settings.options_binomial_steps

        try:
            primary_price = round(
                black_scholes_price(
                    spot_price=spot_price,
                    strike_price=request.strike_price,
                    time_to_expiration_years=time_years,
                    risk_free_rate=request.risk_free_rate,
                    volatility=request.volatility,
                    option_type=request.option_type,
                ),
                2,
            )

            greek_values = black_scholes_greeks(
                spot_price=spot_price,
                strike_price=request.strike_price,
                time_to_expiration_years=time_years,
                risk_free_rate=request.risk_free_rate,
                volatility=request.volatility,
                option_type=request.option_type,
            )

            binomial_start = time.perf_counter()
            binomial_price = binomial_tree_price(
                spot_price=spot_price,
                strike_price=request.strike_price,
                time_to_expiration_years=time_years,
                risk_free_rate=request.risk_free_rate,
                volatility=request.volatility,
                option_type=request.option_type,
                steps=steps,
            )
            binomial_time = time.perf_counter() - binomial_start

            results = [
                ModelResult(model="Black-Scholes", price=primary_price, status=status),
                ModelResult(
                    model="Binomial Tree",
                    price=round(binomial_price, 2),
                    status=status,
                ),
                ModelResult(
                    model="Monte Carlo",
                    price=round(
                        monte_carlo_price(
                            spot_price=spot_price,
                            strike_price=request.strike_price,
                            time_to_expiration_years=time_years,
                            risk_free_rate=request.risk_free_rate,
                            volatility=request.volatility,
                            option_type=request.option_type,
                            simulations=self._settings.options_monte_carlo_simulations,
                            seed=self._settings.options_monte_carlo_seed,
                        ),
                        2,
                    ),
                    status=status,
                ),
            ]
        except OptionsValidationError as exc:
            raise OptionsValidationError(str(exc)) from exc

        logger.info(
            "Priced %s %s option for ticker=%s strike=%s",
            request.option_type.value,
            status.value,
            request.ticker,
            request.strike_price,
        )

        return OptionsCalculateResponse(
            ticker=stock.ticker,
            spot_price=round(spot_price, 4),
            strike_price=request.strike_price,
            risk_free_rate=request.risk_free_rate,
            volatility=request.volatility,
            time_to_expiration_days=request.time_to_expiration_days,
            option_type=request.option_type,
            status=status,
            primary_price=primary_price,
            greeks=Greeks(**greek_values),
            binomial_meta=BinomialMeta(
                steps=steps,
                nodes=binomial_tree_nodes(steps),
                time_seconds=round(binomial_time, 2),
            ),
            results=results,
        )
