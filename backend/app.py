import logging
from collections.abc import Callable

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import get_settings
from routes import health, options, stock
from utils.exceptions import (
    InvalidTickerError,
    StockDataTimeoutError,
    StockServiceError,
    TickerNotFoundError,
)
from utils.options_pricing import OptionsValidationError

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    description="Financial market analysis and insights API",
    version=settings.app_version,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(stock.router, prefix="/api", tags=["stocks"])
app.include_router(options.router, prefix="/api", tags=["options"])

_EXCEPTION_HANDLERS: list[tuple[type[Exception], int]] = [
    (InvalidTickerError, 400),
    (OptionsValidationError, 400),
    (TickerNotFoundError, 404),
    # External Yahoo Finance failures (including timeouts) return HTTP 500.
    (StockDataTimeoutError, 500),
    (StockServiceError, 500),
]


def _register_exception_handlers(application: FastAPI) -> None:
    def make_handler(status_code: int) -> Callable:
        async def handler(_request: Request, exc: Exception) -> JSONResponse:
            return JSONResponse(
                status_code=status_code,
                content={"detail": str(exc)},
            )

        return handler

    for exception_type, status_code in _EXCEPTION_HANDLERS:
        application.add_exception_handler(
            exception_type,
            make_handler(status_code),
        )


_register_exception_handlers(app)


@app.get("/")
async def root() -> dict[str, str]:
    return {"message": settings.app_name, "docs": "/docs"}
