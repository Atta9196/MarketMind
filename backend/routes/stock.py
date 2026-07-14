import logging

from fastapi import APIRouter, Depends

from dependencies import get_stock_service
from models.schemas import StockResponse
from routes.common import API_ERROR_RESPONSES
from services.stock_service import StockService

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get(
    "/stock/{ticker}",
    response_model=StockResponse,
    responses=API_ERROR_RESPONSES,
    summary="Get stock price and history",
    description="Returns the current price, OHLCV history, and company profile for a ticker.",
)
async def get_stock(
    ticker: str,
    period: str | None = None,
    interval: str | None = None,
    stock_service: StockService = Depends(get_stock_service),
) -> StockResponse:
    logger.info(
        "Fetching stock data for ticker=%s period=%s interval=%s",
        ticker,
        period,
        interval,
    )
    return await stock_service.get_stock(ticker, period=period, interval=interval)
