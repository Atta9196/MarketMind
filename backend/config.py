from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    app_name: str = Field(default="MarketMinds API")
    app_version: str = Field(default="1.0.0")
    cors_origins: list[str] = Field(
        default=["http://localhost:5173", "http://127.0.0.1:5173"],
    )

    yfinance_timeout_seconds: float = Field(default=15.0, gt=0)
    history_period: str = Field(default="1y")
    history_interval: str = Field(default="1d")

    ticker_min_length: int = Field(default=1, ge=1)
    ticker_max_length: int = Field(default=10, ge=1)

    options_binomial_steps: int = Field(default=100, ge=1, le=1000)
    options_monte_carlo_simulations: int = Field(default=10_000, ge=100, le=1_000_000)
    options_monte_carlo_seed: int | None = Field(default=42)
    options_worker_processes: int | None = Field(
        default=None,
        ge=1,
        description="Process pool size for Binomial/Monte Carlo. Defaults to CPU count.",
    )

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()
