import asyncio
import logging
from datetime import UTC, datetime
from typing import Any

import pandas as pd
import yfinance as yf

from config import Settings
from models.schemas import CompanyInfo, PricePoint, QuoteStats, StockResponse
from utils.exceptions import (
    InvalidTickerError,
    StockDataTimeoutError,
    StockServiceError,
    TickerNotFoundError,
)
from utils.ticker import validate_ticker

logger = logging.getLogger(__name__)

ALLOWED_HISTORY_PERIODS = {
    "1d",
    "5d",
    "1mo",
    "3mo",
    "6mo",
    "1y",
    "2y",
    "5y",
    "10y",
    "ytd",
    "max",
}
ALLOWED_HISTORY_INTERVALS = {
    "1m",
    "2m",
    "5m",
    "15m",
    "30m",
    "60m",
    "90m",
    "1h",
    "1d",
    "5d",
    "1wk",
    "1mo",
}


class StockService:
    """Fetches and normalizes stock market data from Yahoo Finance."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    async def get_stock(
        self,
        raw_ticker: str,
        *,
        period: str | None = None,
        interval: str | None = None,
    ) -> StockResponse:
        ticker = validate_ticker(raw_ticker, self._settings)
        history_period = self._resolve_history_period(period)
        history_interval = self._resolve_history_interval(interval)

        try:
            stock_data = await asyncio.wait_for(
                asyncio.to_thread(
                    self._fetch_stock_data,
                    ticker,
                    history_period,
                    history_interval,
                ),
                timeout=self._settings.yfinance_timeout_seconds,
            )
        except asyncio.TimeoutError as exc:
            logger.warning("Timed out fetching data for ticker=%s", ticker)
            raise StockDataTimeoutError(
                f"Request timed out while fetching data for '{ticker}'.",
                ticker=ticker,
            ) from exc
        except TickerNotFoundError:
            raise
        except StockServiceError:
            raise
        except Exception as exc:
            logger.exception("Unexpected error fetching data for ticker=%s", ticker)
            raise StockServiceError(
                f"Failed to fetch stock data for '{ticker}'.",
                ticker=ticker,
            ) from exc

        return StockResponse(
            ticker=ticker,
            company_name=stock_data["company_name"],
            price=round(stock_data["price"], 4),
            daily_change=stock_data["daily_change"],
            daily_change_percent=stock_data["daily_change_percent"],
            quote=stock_data["quote"],
            company=stock_data["company"],
            history=stock_data["history"],
        )

    def _resolve_history_period(self, period: str | None) -> str:
        if period is None:
            return self._settings.history_period
        normalized = period.strip().lower()
        if normalized not in ALLOWED_HISTORY_PERIODS:
            raise InvalidTickerError(
                f"Unsupported history period '{period}'.",
            )
        return normalized

    def _resolve_history_interval(self, interval: str | None) -> str:
        if interval is None:
            return self._settings.history_interval
        normalized = interval.strip().lower()
        if normalized not in ALLOWED_HISTORY_INTERVALS:
            raise InvalidTickerError(
                f"Unsupported history interval '{interval}'.",
            )
        return normalized

    def _fetch_stock_data(
        self,
        ticker: str,
        history_period: str,
        history_interval: str,
    ) -> dict[str, Any]:
        yf_ticker = yf.Ticker(ticker)

        history_frame = yf_ticker.history(
            period=history_period,
            interval=history_interval,
            auto_adjust=True,
        )

        if history_frame is None or history_frame.empty:
            raise TickerNotFoundError(
                f"No market data found for ticker '{ticker}'.",
                ticker=ticker,
            )

        price = self._resolve_current_price(yf_ticker, history_frame, ticker)
        company_name = self._resolve_company_name(yf_ticker, ticker)
        daily_change, daily_change_percent = self._resolve_daily_change(
            price,
            history_frame,
            yf_ticker,
        )
        history = self._build_history(history_frame)
        quote = self._build_quote_stats(history_frame)
        company = self._build_company_info(yf_ticker)

        return {
            "price": price,
            "company_name": company_name,
            "daily_change": daily_change,
            "daily_change_percent": daily_change_percent,
            "quote": quote,
            "company": company,
            "history": history,
        }

    def _resolve_current_price(
        self,
        yf_ticker: yf.Ticker,
        history_frame: pd.DataFrame,
        ticker: str,
    ) -> float:
        price = self._extract_fast_price(yf_ticker)
        if price is not None:
            return price

        price = self._extract_info_price(yf_ticker)
        if price is not None:
            return price

        if "Close" not in history_frame.columns:
            raise TickerNotFoundError(
                f"No price data available for ticker '{ticker}'.",
                ticker=ticker,
            )

        latest_close = history_frame["Close"].dropna()
        if latest_close.empty:
            raise TickerNotFoundError(
                f"No price data available for ticker '{ticker}'.",
                ticker=ticker,
            )

        return float(latest_close.iloc[-1])

    @staticmethod
    def _resolve_company_name(yf_ticker: yf.Ticker, ticker: str) -> str:
        try:
            info: dict[str, Any] = yf_ticker.info or {}
        except Exception:
            return ticker

        return (
            info.get("longName")
            or info.get("shortName")
            or info.get("displayName")
            or ticker
        )

    def _resolve_daily_change(
        self,
        price: float,
        history_frame: pd.DataFrame,
        yf_ticker: yf.Ticker,
    ) -> tuple[float, float]:
        previous_close = self._extract_previous_close(yf_ticker, history_frame)

        if previous_close is None or previous_close == 0:
            return 0.0, 0.0

        daily_change = price - previous_close
        daily_change_percent = (daily_change / previous_close) * 100

        return round(daily_change, 4), round(daily_change_percent, 4)

    @staticmethod
    def _extract_previous_close(
        yf_ticker: yf.Ticker,
        history_frame: pd.DataFrame,
    ) -> float | None:
        try:
            fast_info: dict[str, Any] = getattr(yf_ticker, "fast_info", {}) or {}
            previous_close = fast_info.get("previous_close") or fast_info.get(
                "previousClose"
            )
            if previous_close is not None:
                return float(previous_close)
        except Exception:
            pass

        try:
            info: dict[str, Any] = yf_ticker.info or {}
            previous_close = info.get("previousClose") or info.get("regularMarketPreviousClose")
            if previous_close is not None:
                return float(previous_close)
        except Exception:
            pass

        if "Close" not in history_frame.columns:
            return None

        closes = history_frame["Close"].dropna()
        if len(closes) < 2:
            return None

        return float(closes.iloc[-2])

    @staticmethod
    def _extract_fast_price(yf_ticker: yf.Ticker) -> float | None:
        try:
            fast_info: dict[str, Any] = getattr(yf_ticker, "fast_info", {}) or {}
        except Exception:
            return None

        for key in ("last_price", "lastPrice", "regular_market_price"):
            value = fast_info.get(key)
            if value is not None:
                return float(value)

        return None

    @staticmethod
    def _extract_info_price(yf_ticker: yf.Ticker) -> float | None:
        try:
            info: dict[str, Any] = yf_ticker.info or {}
        except Exception:
            return None

        for key in ("currentPrice", "regularMarketPrice", "previousClose"):
            value = info.get(key)
            if value is not None:
                return float(value)

        return None

    @staticmethod
    def _build_quote_stats(history_frame: pd.DataFrame) -> QuoteStats:
        latest = history_frame.iloc[-1]

        def _float(column: str) -> float:
            value = latest.get(column)
            return 0.0 if pd.isna(value) else round(float(value), 4)

        volume_value = latest.get("Volume")
        volume = 0 if pd.isna(volume_value) else int(volume_value)

        return QuoteStats(
            open=_float("Open"),
            high=_float("High"),
            low=_float("Low"),
            close=_float("Close"),
            volume=volume,
        )

    @staticmethod
    def _build_company_info(yf_ticker: yf.Ticker) -> CompanyInfo:
        try:
            info: dict[str, Any] = yf_ticker.info or {}
        except Exception:
            return CompanyInfo()

        employees = info.get("fullTimeEmployees")
        market_cap = info.get("marketCap")

        return CompanyInfo(
            sector=info.get("sector"),
            industry=info.get("industry"),
            website=info.get("website"),
            description=info.get("longBusinessSummary"),
            market_cap=float(market_cap) if market_cap is not None else None,
            employees=int(employees) if employees is not None else None,
            country=info.get("country"),
            exchange=info.get("exchange"),
        )

    @staticmethod
    def _build_history(history_frame: pd.DataFrame) -> list[PricePoint]:
        required_columns = {"Open", "High", "Low", "Close", "Volume"}
        if not required_columns.issubset(history_frame.columns):
            return []

        points: list[PricePoint] = []

        for timestamp, row in history_frame.iterrows():
            if pd.isna(row.get("Close")):
                continue

            volume_value = row.get("Volume")
            volume = 0 if pd.isna(volume_value) else int(volume_value)

            points.append(
                PricePoint(
                    timestamp=StockService._format_timestamp(timestamp),
                    open=round(float(row["Open"]), 4),
                    high=round(float(row["High"]), 4),
                    low=round(float(row["Low"]), 4),
                    close=round(float(row["Close"]), 4),
                    volume=volume,
                )
            )

        return points

    @staticmethod
    def _format_timestamp(timestamp: Any) -> str:
        if isinstance(timestamp, pd.Timestamp):
            if timestamp.tzinfo is None:
                timestamp = timestamp.tz_localize(UTC)
            else:
                timestamp = timestamp.tz_convert(UTC)
            return timestamp.isoformat()

        if isinstance(timestamp, datetime):
            if timestamp.tzinfo is None:
                timestamp = timestamp.replace(tzinfo=UTC)
            else:
                timestamp = timestamp.astimezone(UTC)
            return timestamp.isoformat()

        return str(timestamp)
