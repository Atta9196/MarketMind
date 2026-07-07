# MarketMinds API

FastAPI backend for the MarketMinds financial market analysis platform.

For full setup instructions, frontend configuration, and project overview, see the [root README](../README.md).

## Quick Start

```bash
python -m venv .venv

# Windows
.\.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

- API docs: http://localhost:8000/docs
- Health check: http://localhost:8000/api/health

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Service health check |
| `GET` | `/api/stock/{ticker}` | Stock quote, profile, and history |
| `POST` | `/api/options/calculate` | Options pricing (Black-Scholes, Binomial, Monte Carlo) |

## Configuration

Copy `.env.example` to `.env` and adjust as needed. See the [root README](../README.md#configuration) for all available variables.
