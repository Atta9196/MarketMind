# MarketMinds

MarketMinds is a full-stack web application for live equity quotes, interactive price charts, and multi-model options valuation. It pairs a React frontend with a FastAPI backend that sources market data from Yahoo Finance and prices options using Black-Scholes, Binomial Tree, and parallel Monte Carlo simulation.

> **Using the app as a client (non-technical)?**  
> Start with the **[Client User Guide](./CLIENT_GUIDE.md)** — a step-by-step walkthrough from first launch to advanced options pricing.  
>  
> **Need to install and run the project locally?**  
> Follow the **[Setup & Run Guide](./SETUP_GUIDE.md)**.  
>  
> **Deploying to Vercel + Render?**  
> Follow the **[Deploy Guide](./DEPLOY.md)**.

---

## Features

| Feature | Description |
|---------|-------------|
| **Live Watchlist** | Auto-refreshing quotes (every 15s) with green/red live price badges for up/down moves |
| **Stock Detail** | Company profile, live price badge, and an intraday area chart (5-day / 15-minute history) |
| **Options Calculator** | Call/put pricing via Black-Scholes, Binomial Tree, and Monte Carlo, with ITM / OTM / Knocked Out status |
| **Parallel Pricing** | Binomial and Monte Carlo workloads run across a CPU process pool and aggregate results on the main process |
| **Failure States** | Structured error UI for options failures and a “No Connection” state when the API is unreachable |
| **Responsive UI** | Dark, Figma-aligned layout optimized for mobile, tablet, and desktop |

---

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React 19, Vite, Tailwind CSS, React Router, Axios, Chart.js |
| **Backend** | Python 3.11+, FastAPI, Uvicorn, Pydantic Settings |
| **Data & Math** | yfinance, NumPy, Pandas, SciPy, `multiprocessing` |

---

## Project Structure

```
MarketMindWeb/
├── frontend/                      # React single-page application
│   ├── public/logos/              # Brand SVG logos (AAPL, NVDA, …)
│   └── src/
│       ├── pages/                 # Watchlist, Stock Detail, Options Calculator
│       ├── components/            # Navbar, price badges, processing panel
│       ├── charts/                # Chart.js setup and stock area chart
│       ├── hooks/                 # Data-fetching and polling hooks
│       ├── layouts/               # App shell layout
│       └── services/              # Axios API client
│
└── backend/                       # FastAPI REST API
    ├── app.py                     # Application entry point & exception handlers
    ├── config.py                  # Environment-based settings
    ├── routes/                    # Health, stock, and options endpoints
    ├── services/                  # Yahoo Finance + options orchestration
    ├── models/                    # Pydantic request/response schemas
    └── utils/                     # Pricing engines, ticker helpers, errors
```

---

## Prerequisites

- **Node.js** 18 or later (with npm)
- **Python** 3.11 or 3.12
- pip

---

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
copy .env.example .env
uvicorn app:app --reload --port 8000
```

**macOS / Linux**

```bash
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app:app --reload --port 8000
```

| URL | Description |
|-----|-------------|
| http://localhost:8000 | API root |
| http://localhost:8000/docs | Interactive OpenAPI (Swagger) docs |
| http://localhost:8000/api/health | Health check |

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

The Vite development server proxies `/api` requests to `http://localhost:8000`, so no extra frontend configuration is required for local development.

---

## Application Routes

| Route | Description |
|-------|-------------|
| `/watchlist` | Default landing page — live market table |
| `/stock/:ticker` | Stock detail with live price and intraday chart |
| `/options` | Options pricing calculator |

**Default watchlist tickers:** `AAPL`, `NVDA`, `AMZN`, `GOOGL`, `TSLA`, `META`, `NFLX`

---

## API Reference

### `GET /api/health`

Returns service health status.

### `GET /api/stock/{ticker}`

Returns current price, daily change, company profile, and OHLCV history.

**Query parameters (optional)**

| Parameter | Default | Description |
|-----------|---------|-------------|
| `period` | `1y` (from settings) | History window (e.g. `5d`, `1mo`, `1y`) |
| `interval` | `1d` (from settings) | Candle size (e.g. `15m`, `1h`, `1d`) |

```bash
# Default daily history
curl http://localhost:8000/api/stock/AAPL

# Intraday history used by the stock detail chart
curl "http://localhost:8000/api/stock/AAPL?period=5d&interval=15m"
```

### `POST /api/options/calculate`

Prices an option with Black-Scholes, Binomial Tree, and Monte Carlo models. Returns theoretical prices, Greeks, moneyness status (`ITM`, `OTM`, or `Knocked Out`), and binomial metadata.

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

All errors return JSON in the form `{"detail": "..."}`.

| Status | Description |
|--------|-------------|
| `400` | Invalid request or validation error |
| `404` | Ticker not found or no market data |
| `500` | Yahoo Finance failure/timeout or unexpected server error |

---

## Configuration

Backend settings are loaded from environment variables or a `.env` file in `backend/`. Start from `.env.example`:

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_NAME` | `MarketMinds API` | API display name |
| `APP_VERSION` | `1.0.0` | API version |
| `CORS_ORIGINS` | `http://localhost:5173,...` | Allowed frontend origins (comma-separated) |
| `YFINANCE_TIMEOUT_SECONDS` | `15.0` | Yahoo Finance request timeout |
| `HISTORY_PERIOD` | `1y` | Default historical data range |
| `HISTORY_INTERVAL` | `1d` | Default historical data interval |
| `TICKER_MIN_LENGTH` | `1` | Minimum ticker symbol length |
| `TICKER_MAX_LENGTH` | `10` | Maximum ticker symbol length |
| `OPTIONS_BINOMIAL_STEPS` | `100` | Binomial tree steps |
| `OPTIONS_MONTE_CARLO_SIMULATIONS` | `10000` | Monte Carlo simulation count |
| `OPTIONS_MONTE_CARLO_SEED` | `42` | Optional RNG seed for reproducibility |
| `OPTIONS_WORKER_PROCESSES` | CPU count | Process pool size for Binomial / Monte Carlo |

---

## Development Scripts

### Frontend (`frontend/`)

```bash
npm run dev       # Start Vite dev server (port 5173)
npm run build     # Production build
npm run preview   # Preview production build
npm run lint      # Run Oxlint
```

### Backend (`backend/`)

```bash
uvicorn app:app --reload --port 8000
```

---

## Architecture Notes

- **Stock data** is fetched via yfinance, normalized into Pydantic models, and returned as compact JSON for the web client.
- **Options pricing** runs Black-Scholes on the request path; Binomial and Monte Carlo are dispatched to a multiprocessing pool, then aggregated (Monte Carlo payoffs averaged) before the response is returned.
- **Frontend polling** refreshes watchlist and stock-detail prices on a fixed interval without blocking the UI thread.
- **CORS** is configured for the Vite origin; adjust `CORS_ORIGINS` for other deployments.

---

## Disclaimer

MarketMinds is intended for **educational and analytical purposes only**. Market data is sourced from Yahoo Finance via yfinance and may be delayed or inaccurate. Options pricing outputs are model-based estimates and **must not** be treated as financial advice or trading recommendations.
