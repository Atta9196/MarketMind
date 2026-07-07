from fastapi import Depends

from config import Settings, get_settings
from services.options_service import OptionsService
from services.stock_service import StockService


def get_stock_service(settings: Settings = Depends(get_settings)) -> StockService:
    return StockService(settings)


def get_options_service(
    settings: Settings = Depends(get_settings),
    stock_service: StockService = Depends(get_stock_service),
) -> OptionsService:
    return OptionsService(settings, stock_service)
