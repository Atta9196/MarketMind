# MarketMinds — Deploy Guide (Vercel + Render)

Deploy the **frontend on Vercel** and the **backend on Render**.

| Service | Platform | Root folder |
|---------|----------|-------------|
| Website (React) | [Vercel](https://vercel.com) | `frontend/` |
| API (FastAPI) | [Render](https://render.com) | `backend/` |

---

## Overview

```text
Browser  →  Vercel (frontend)
                │
                │  VITE_API_URL = https://your-api.onrender.com/api
                ▼
            Render (FastAPI backend)
                │
                ▼
            Yahoo Finance (yfinance)
```

**Order:** Deploy the **backend first**, then the frontend (so you have the API URL ready).

---

## 1. Deploy Backend on Render

### Option A — Blueprint (`render.yaml`)

1. Push this repo to GitHub  
2. In Render: **New → Blueprint**  
3. Select the repo (uses root `render.yaml`)  
4. Set `CORS_ORIGINS` when prompted (you can update it after you have the Vercel URL)  
5. Deploy  

### Option B — Manual Web Service

1. Render → **New → Web Service**  
2. Connect the GitHub repo  
3. Settings:

| Setting | Value |
|---------|-------|
| **Root Directory** | `backend` |
| **Runtime** | Python 3 |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn app:app --host 0.0.0.0 --port $PORT` |

4. Add environment variables:

| Key | Example value |
|-----|----------------|
| `CORS_ORIGINS` | `https://your-app.vercel.app` |
| `OPTIONS_WORKER_PROCESSES` | `2` |
| `YFINANCE_TIMEOUT_SECONDS` | `20.0` |
| `OPTIONS_MONTE_CARLO_SIMULATIONS` | `10000` |

5. Deploy and copy your service URL, e.g.  
   `https://marketminds-api.onrender.com`

### Health check

Open:

```text
https://YOUR-RENDER-SERVICE.onrender.com/api/health
```

You should get a healthy JSON response.

---

## 2. Deploy Frontend on Vercel

1. Vercel → **Add New → Project**  
2. Import the same GitHub repo  
3. Settings:

| Setting | Value |
|---------|-------|
| **Root Directory** | `frontend` |
| **Framework Preset** | Vite |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

4. **Environment Variables** (Production):

| Name | Value |
|------|-------|
| `VITE_API_URL` | `https://YOUR-RENDER-SERVICE.onrender.com/api` |

> Important: include the `/api` suffix.  
> Example: `https://marketminds-api.onrender.com/api`

5. Deploy  

`frontend/vercel.json` is already included so React Router routes (`/watchlist`, `/stock/:ticker`, `/options`) work on refresh.

---

## 3. Connect CORS (required)

After Vercel gives you a URL (e.g. `https://marketminds.vercel.app`):

1. Open Render → your API service → **Environment**  
2. Set:

```text
CORS_ORIGINS=https://marketminds.vercel.app
```

Multiple origins (comma-separated):

```text
CORS_ORIGINS=https://marketminds.vercel.app,https://marketminds-git-main-username.vercel.app
```

3. **Save** and wait for Render to redeploy  

Without this, the browser will block API calls from Vercel.

---

## 4. Local development (unchanged)

Local setup still uses the Vite proxy — no Render URL required:

```text
frontend/.env → VITE_API_URL=/api
```

See [SETUP_GUIDE.md](./SETUP_GUIDE.md).

---

## 5. Checklist

| Step | Done? |
|------|-------|
| Backend live on Render | ☐ |
| `/api/health` works on Render URL | ☐ |
| `VITE_API_URL` set on Vercel to `https://...onrender.com/api` | ☐ |
| Frontend live on Vercel | ☐ |
| `CORS_ORIGINS` includes the Vercel URL | ☐ |
| Watchlist loads prices on the live site | ☐ |
| Options Calculate works (may be slow on first request) | ☐ |

---

## 6. Notes for free tiers

### Render free

- The API may **sleep** after inactivity  
- First request after sleep can take **30–60+ seconds** (cold start)  
- The frontend axios timeout is **120 seconds** by default to allow for this  
- Keep `OPTIONS_WORKER_PROCESSES=2` on small instances  

### Vercel

- Static frontend deploys quickly  
- Env vars starting with `VITE_` are baked in at **build time**  
- If you change `VITE_API_URL`, **redeploy** the frontend  

---

## 7. Troubleshooting

| Problem | Fix |
|---------|-----|
| Watchlist “No Connection” on Vercel | Check `VITE_API_URL` and that Render is awake / healthy |
| CORS error in browser console | Add exact Vercel origin to Render `CORS_ORIGINS`, redeploy API |
| Options calculate times out | Wait for cold start; retry; or lower `OPTIONS_MONTE_CARLO_SIMULATIONS` |
| 404 on `/options` refresh | Confirm `frontend/vercel.json` is deployed |
| Old API URL after change | Update Vercel env and **redeploy** frontend |

---

## Quick reference

```text
# Render start command
uvicorn app:app --host 0.0.0.0 --port $PORT

# Vercel env
VITE_API_URL=https://YOUR-SERVICE.onrender.com/api

# Render env
CORS_ORIGINS=https://YOUR-APP.vercel.app
OPTIONS_WORKER_PROCESSES=2
```
