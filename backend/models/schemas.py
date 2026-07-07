from pydantic import BaseModel, Field


class PricePoint(BaseModel):
    timestamp: str = Field(
        ...,
        description="ISO 8601 UTC timestamp for the trading session.",
    )
    open: float = Field(..., description="Opening price.")
    high: float = Field(..., description="Session high price.")
    low: float = Field(..., description="Session low price.")
    close: float = Field(..., description="Closing price.")
    volume: int = Field(..., description="Trading volume.")


class QuoteStats(BaseModel):
    open: float = Field(..., description="Latest session open price.")
    high: float = Field(..., description="Latest session high price.")
    low: float = Field(..., description="Latest session low price.")
    close: float = Field(..., description="Latest session close price.")
    volume: int = Field(..., description="Latest session volume.")


class CompanyInfo(BaseModel):
    sector: str | None = Field(default=None, description="Business sector.")
    industry: str | None = Field(default=None, description="Industry classification.")
    website: str | None = Field(default=None, description="Company website URL.")
    description: str | None = Field(default=None, description="Company overview.")
    market_cap: float | None = Field(default=None, description="Market capitalization.")
    employees: int | None = Field(default=None, description="Full-time employees.")
    country: str | None = Field(default=None, description="Headquarters country.")
    exchange: str | None = Field(default=None, description="Listing exchange.")


class StockResponse(BaseModel):
    ticker: str = Field(..., description="Normalized ticker symbol.")
    company_name: str = Field(..., description="Company or security name.")
    price: float = Field(..., description="Current market price.")
    daily_change: float = Field(..., description="Daily price change in USD.")
    daily_change_percent: float = Field(
        ...,
        description="Daily price change as a percentage.",
    )
    quote: QuoteStats = Field(..., description="Latest session OHLCV data.")
    company: CompanyInfo = Field(..., description="Company profile information.")
    history: list[PricePoint] = Field(
        default_factory=list,
        description="Historical daily OHLCV prices.",
    )


class ErrorResponse(BaseModel):
    detail: str
