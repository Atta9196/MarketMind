class StockServiceError(Exception):
    """Base exception for stock data operations."""

    def __init__(self, message: str, *, ticker: str | None = None) -> None:
        self.ticker = ticker
        super().__init__(message)


class TickerNotFoundError(StockServiceError):
    """Raised when a ticker symbol cannot be resolved."""


class StockDataTimeoutError(StockServiceError):
    """Raised when fetching stock data exceeds the configured timeout."""


class InvalidTickerError(StockServiceError):
    """Raised when a ticker symbol fails validation."""
