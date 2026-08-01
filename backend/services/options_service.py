import asyncio
import logging
import time

from config import Settings
from models.options_schemas import (
    ComputationMeta,
    ModelResult,
    OptionsCalculateRequest,
    OptionsCalculateResponse,
)
from services.stock_service import StockService
from utils.options_pricing import (
    OptionsValidationError,
    determine_option_status,
    monte_carlo_price,
)

logger = logging.getLogger(__name__)


class OptionsService:
    """Prices options using Monte Carlo simulation."""

    def __init__(self, settings: Settings, stock_service: StockService) -> None:
        self._settings = settings
        self._stock_service = stock_service

    async def calculate(self, request: OptionsCalculateRequest) -> OptionsCalculateResponse:
        stock = await self._stock_service.get_stock(request.ticker)
        spot_price = stock.price

        if spot_price is None or spot_price != spot_price or spot_price <= 0:
            raise OptionsValidationError(
                f"Unable to price options for '{request.ticker}' because the spot price is missing or invalid.",
            )

        time_years = request.time_to_expiration_days / 365.0
        simulations = self._settings.options_monte_carlo_simulations

        status = determine_option_status(
            spot_price=spot_price,
            strike_price=request.strike_price,
            option_type=request.option_type,
            time_to_expiration_years=time_years,
        )

        try:
            started = time.perf_counter()
            price = await asyncio.to_thread(
                monte_carlo_price,
                spot_price=spot_price,
                strike_price=request.strike_price,
                time_to_expiration_years=time_years,
                risk_free_rate=request.risk_free_rate,
                volatility=request.volatility,
                option_type=request.option_type,
                simulations=simulations,
                seed=self._settings.options_monte_carlo_seed,
                workers=self._settings.options_worker_processes,
            )
            elapsed = time.perf_counter() - started
            primary_price = round(price, 2)

            results = [
                ModelResult(
                    model="Monte Carlo",
                    price=primary_price,
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
            computation_meta=ComputationMeta(
                simulations=simulations,
                time_seconds=round(elapsed, 2),
            ),
            results=results,
        )
