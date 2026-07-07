from models.schemas import ErrorResponse

API_ERROR_RESPONSES = {
    400: {"model": ErrorResponse, "description": "Invalid request."},
    404: {"model": ErrorResponse, "description": "Resource not found."},
    408: {"model": ErrorResponse, "description": "Request timed out."},
    500: {"model": ErrorResponse, "description": "Internal server error."},
}
