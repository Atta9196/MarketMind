# MarketMinds

A full-stack financial web application for live market data, stock analysis, and options pricing. MarketMinds combines a React frontend with a FastAPI backend to deliver real-time watchlists, interactive price charts, and multi-model options valuation.

## Features

- **Live Watchlist** — Track major equities with auto-refreshing quotes, company names, and price-update flash indicators
- **Stock Detail** — View current price, daily change, company profile, and a one-year OHLCV chart
- **Options Calculator** — Price call/put options using Black-Scholes, Binomial Tree, and Monte Carlo models with Greeks
- **Processing UI** — Visual Monte Carlo simulation progress with multi-core processing feedback
- **Figma-aligned UI** — Dark-themed, responsive layout with brand-accurate company logos

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React 19, Vite, JavaScript, Tailwind CSS, React Router, Axios, Chart.js |
| **Backend** | Python 3.12, FastAPI, Uvicorn, Pydantic |
| **Data & Math** | yfinance, NumPy, Pandas, SciPy, multiprocessing |

## Project Structure

```
MarketMindWeb/
├── frontend/                 # React SPA
│   ├── public/logos/         # Company logo SVGs
│   └── src/
│       ├── pages/            # Watchlist, Stock Detail, Options Calculator
│       ├── components/       # UI components
│       ├── charts/           # Chart.js configuration and stock charts
│       ├── hooks/            # Data-fetching and state hooks
│       └── services/         # API client layer
│
└── backend/                  # FastAPI REST API
    ├── app.py                # Application entry point
    ├── routes/               # API route handlers
    ├── services/             # Business logic
    ├── models/               # Pydantic request/response schemas
    └── utils/                  # Pricing engines and helpers
```

## Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.11 or 3.12
- pip

## Getting Started

Run the backend and frontend in **two separate terminals**.

### 1. Backend

```bash
cd backend
python -m venv .venv
```

**Windows (PowerShell)**

```powershell
.\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

**macOS / Linux**

```bash
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

Optional: copy environment defaults before starting.

```bash
cp .env.example .env
```

| URL | Description |
|-----|-------------|
| http://localhost:8000 | API root |
| http://localhost:8000/docs | Interactive Swagger docs |
| http://localhost:8000/api/health | Health check |

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

The Vite dev server proxies `/api` requests to `http://localhost:8000`, so no extra frontend configuration is needed for local development.

## Application Routes

| Route | Description |
|-------|-------------|
| `/watchlist` | Default landing page with live market table |
| `/stock/:ticker` | Stock detail page with chart and company info |
| `/options` | Options pricing calculator |

Default watchlist tickers: `AAPL`, `NVDA`, `AMZN`, `GOOGL`, `TSLA`, `META`, `NFLX`.

## API Reference

### `GET /api/health`

Returns service health status.

### `GET /api/stock/{ticker}`

Returns current price, daily change, company profile, and historical OHLCV data.

```bash
curl http://localhost:8000/api/stock/AAPL
```

### `POST /api/options/calculate`

Prices an option using Black-Scholes, Binomial Tree, and Monte Carlo models.

```bash
curl -X POST http://localhost:8000/api/options/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "ticker": "AAPL",
    "strike_price": 200,
    "risk_free_rate": 0.045,
    "volatility": 0.25,
    "time_to_expiration_days": 30,
    "option_type": "call"
  }'
```

### Error Responses

| Status | Description |
|--------|-------------|
| `400` | Invalid request or validation error |
| `404` | Ticker not found or no market data |
| `408` | Yahoo Finance request timed out |
| `500` | Unexpected server error |

## Configuration

Backend settings are loaded from environment variables or a `.env` file in `backend/`.

| Variable | Default | Description |
|----------|---------|-------------|
| `CORS_ORIGINS` | `http://localhost:5173,...` | Allowed frontend origins |
| `YFINANCE_TIMEOUT_SECONDS` | `15.0` | Yahoo Finance request timeout |
| `HISTORY_PERIOD` | `1y` | Historical data range |
| `HISTORY_INTERVAL` | `1d` | Historical data interval |
| `OPTIONS_BINOMIAL_STEPS` | `100` | Binomial tree steps |
| `OPTIONS_MONTE_CARLO_SIMULATIONS` | `10000` | Monte Carlo simulation count |

## Development Scripts

### Frontend (`frontend/`)

```bash
npm run dev       # Start dev server (port 5173)
npm run build     # Production build
npm run preview   # Preview production build
npm run lint      # Run Oxlint
```

### Backend (`backend/`)

```bash
uvicorn app:app --reload --port 8000
```

## Disclaimer

MarketMinds is intended for educational and analytical purposes. Market data is sourced from Yahoo Finance via yfinance and may be delayed or inaccurate. Options pricing outputs are model-based estimates and should not be treated as financial advice.
