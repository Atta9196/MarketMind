from enum import Enum

from pydantic import BaseModel, Field, field_validator


class OptionType(str, Enum):
    CALL = "call"
    PUT = "put"


class OptionStatus(str, Enum):
    ITM = "ITM"
    OTM = "OTM"
    KNOCKED_OUT = "Knocked Out"


class OptionsCalculateRequest(BaseModel):
    ticker: str = Field(..., description="Underlying ticker symbol.")
    strike_price: float = Field(
        ...,
        gt=0,
        le=1_000_000,
        description="Option strike price.",
    )
    risk_free_rate: float = Field(
        ...,
        ge=0,
        le=1,
        description="Annual risk-free rate as a decimal (e.g. 0.045).",
    )
    volatility: float = Field(
        ...,
        gt=0,
        le=5,
        description="Annualized volatility as a decimal (e.g. 0.25).",
    )
    time_to_expiration_days: float = Field(
        ...,
        gt=0,
        le=3650,
        description="Days until option expiration.",
    )
    option_type: OptionType = Field(
        default=OptionType.CALL,
        description="Option type: call or put.",
    )

    @field_validator("ticker")
    @classmethod
    def normalize_ticker(cls, value: str) -> str:
        import re

        normalized = value.strip().upper()
        if not normalized:
            raise ValueError("Ticker symbol is required.")
        if len(normalized) > 10:
            raise ValueError("Ticker must be at most 10 characters.")
        if not re.match(r"^[A-Za-z0-9.\-^=]+$", normalized):
            raise ValueError("Ticker contains invalid characters.")
        return normalized


class ComputationMeta(BaseModel):
    simulations: int
    time_seconds: float


class ModelResult(BaseModel):
    model: str = Field(..., description="Pricing model name.")
    price: float = Field(..., description="Calculated option price.")
    status: OptionStatus = Field(..., description="Option moneyness status.")


class OptionsCalculateResponse(BaseModel):
    ticker: str
    spot_price: float
    strike_price: float
    risk_free_rate: float
    volatility: float
    time_to_expiration_days: float
    option_type: OptionType
    status: OptionStatus
    primary_price: float
    computation_meta: ComputationMeta
    results: list[ModelResult]
