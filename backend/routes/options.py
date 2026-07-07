import logging

from fastapi import APIRouter, Depends

from dependencies import get_options_service
from models.options_schemas import OptionsCalculateRequest, OptionsCalculateResponse
from routes.common import API_ERROR_RESPONSES
from services.options_service import OptionsService

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/options/calculate",
    response_model=OptionsCalculateResponse,
    responses=API_ERROR_RESPONSES,
    summary="Calculate option prices",
    description="Prices an option using Black-Scholes, Binomial Tree, and Monte Carlo models.",
)
async def calculate_options(
    payload: OptionsCalculateRequest,
    options_service: OptionsService = Depends(get_options_service),
) -> OptionsCalculateResponse:
    logger.info("Calculating options for ticker=%s", payload.ticker)
    return await options_service.calculate(payload)
