import re

from config import Settings
from utils.exceptions import InvalidTickerError

_TICKER_PATTERN = re.compile(r"^[A-Za-z0-9.\-^=]+$")


def normalize_ticker(raw_ticker: str) -> str:
    return raw_ticker.strip().upper()


def validate_ticker(raw_ticker: str, settings: Settings) -> str:
    ticker = normalize_ticker(raw_ticker)

    if not ticker:
        raise InvalidTickerError("Ticker symbol is required.", ticker=raw_ticker)

    if (
        len(ticker) < settings.ticker_min_length
        or len(ticker) > settings.ticker_max_length
    ):
        raise InvalidTickerError(
            (
                f"Ticker must be between {settings.ticker_min_length} "
                f"and {settings.ticker_max_length} characters."
            ),
            ticker=ticker,
        )

    if not _TICKER_PATTERN.match(ticker):
        raise InvalidTickerError(
            "Ticker contains invalid characters.",
            ticker=ticker,
        )

    return ticker
