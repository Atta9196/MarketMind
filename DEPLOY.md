# Deploy MarketMinds (Vercel + Render)

This guide walks you through deploying **MarketMinds** so that:

| Layer | Platform | What it hosts |
|-------|----------|---------------|
| **Frontend** (React + Vite) | [Vercel](https://vercel.com) | The UI at something like `https://your-app.vercel.app` |
| **Backend** (FastAPI) | [Render](https://render.com) | The API at something like `https://your-api.onrender.com` |

The frontend talks to the backend over HTTPS using the `VITE_API_URL` environment variable. The backend must allow the Vercel domain in `CORS_ORIGINS`.

```
Browser  →  Vercel (frontend)  →  Render (FastAPI + yfinance + Monte Carlo)
```

---

## What you need before starting

1. A **GitHub** (or GitLab / Bitbucket) account with this repo pushed and up to date.
2. A **[Render](https://dashboard.render.com)** account (free tier works).
3. A **[Vercel](https://vercel.com/signup)** account (free Hobby plan works).
4. About 15–20 minutes.

**Deploy order (important):**

1. Deploy the **backend on Render first** (you need its URL).
2. Deploy the **frontend on Vercel** with that API URL.
3. Go back to Render and add your Vercel URL to **CORS**.

---

## Part 1 — Deploy the backend on Render

### 1.1 Create a Web Service

1. Open [https://dashboard.render.com](https://dashboard.render.com) and sign in.
2. Click **New +** → **Web Service**.
3. Connect your Git provider if prompted, then select the **MarketMindWeb** repository.
4. Configure the service:

| Setting | Value |
|---------|--------|
| **Name** | `marketminds-api` (or any name you like) |
| **Region** | Closest to you / your users |
| **Branch** | `main` (or your deploy branch) |
| **Root Directory** | `backend` |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn app:app --host 0.0.0.0 --port $PORT` |
| **Instance Type** | **Free** (or a paid plan if you want no sleep) |

> **Root Directory must be `backend`.**  
> The FastAPI entry file is `backend/app.py`, and dependencies are in `backend/requirements.txt`.

### 1.2 Environment variables (Render)

In the Render service → **Environment**, add:

| Key | Suggested value | Notes |
|-----|-----------------|--------|
| `APP_NAME` | `MarketMinds API` | Optional |
| `APP_VERSION` | `1.0.0` | Optional |
| `CORS_ORIGINS` | `http://localhost:5173` | Temporary for first deploy; update after Vercel |
| `YFINANCE_TIMEOUT_SECONDS` | `15.0` | Optional |
| `OPTIONS_MONTE_CARLO_SIMULATIONS` | `10000` | Lower (e.g. `5000`) if free tier is slow |
| `OPTIONS_MONTE_CARLO_SEED` | `42` | Optional |
| `OPTIONS_WORKER_PROCESSES` | `1` | Recommended on free/small instances |
| `USE_MOCK_DATA` | `false` | Keep `false` for live Yahoo Finance data |

**CORS format on Render**

Use a **comma-separated** list (no spaces required, but spaces after commas are fine):

```text
https://your-app.vercel.app,http://localhost:5173
```

Do **not** include a trailing slash:

- Correct: `https://your-app.vercel.app`
- Wrong: `https://your-app.vercel.app/`

You can also keep local origins so local frontend testing against the deployed API still works.

### 1.3 Deploy and copy the API URL

1. Click **Create Web Service** / **Deploy**.
2. Wait until the build finishes and the service is **Live**.
3. Copy the public URL, for example:

```text
https://marketminds-api.onrender.com
```

### 1.4 Verify the backend

Open these in a browser (replace with your Render URL):

| URL | Expected |
|-----|----------|
| `https://YOUR-SERVICE.onrender.com/` | JSON with app name / docs link |
| `https://YOUR-SERVICE.onrender.com/docs` | Swagger UI |
| `https://YOUR-SERVICE.onrender.com/api/health` | Health JSON |

Optional quick stock check:

```bash
curl https://YOUR-SERVICE.onrender.com/api/stock/AAPL
```

If health works but stock calls fail, Yahoo Finance may be blocked, rate-limited, or slow from the Render region — retry later or check Render logs.

---

## Part 2 — Deploy the frontend on Vercel

### 2.1 Import the project

1. Open [https://vercel.com/dashboard](https://vercel.com/dashboard) and sign in.
2. Click **Add New…** → **Project**.
3. Import the same **MarketMindWeb** Git repository.
4. Configure the project:

| Setting | Value |
|---------|--------|
| **Framework Preset** | Vite (auto-detected is fine) |
| **Root Directory** | `frontend` ← click **Edit** and select `frontend` |
| **Build Command** | `npm run build` (default) |
| **Output Directory** | `dist` (default for Vite) |
| **Install Command** | `npm install` (default) |

> **Root Directory must be `frontend`.**  
> `package.json`, Vite config, and `vercel.json` all live there.

This repo already includes `frontend/vercel.json` so React Router paths (`/watchlist`, `/stock/AAPL`, `/options`) work on refresh — Vercel rewrites unknown routes to `index.html`.

### 2.2 Environment variables (Vercel)

Before deploying, open **Environment Variables** and add:

| Name | Value | Environments |
|------|--------|--------------|
| `VITE_API_URL` | `https://YOUR-SERVICE.onrender.com/api` | Production (and Preview if you want) |
| `VITE_API_TIMEOUT_MS` | `120000` | Recommended (optional) |

Examples:

```text
VITE_API_URL=https://marketminds-api.onrender.com/api
VITE_API_TIMEOUT_MS=120000
```

Notes:

- `VITE_*` variables are baked in at **build time**. If you change them, you must **redeploy** the frontend.
- Either of these works with the app’s API client:
  - `https://YOUR-SERVICE.onrender.com/api`
  - `https://YOUR-SERVICE.onrender.com`  
  (the client appends `/api` if it is missing)
- `VITE_API_TIMEOUT_MS=120000` helps when Render’s free tier is waking from sleep (cold start).

### 2.3 Deploy

1. Click **Deploy**.
2. Wait for the build to succeed.
3. Open the Vercel URL, for example:

```text
https://marketminds-xxx.vercel.app
```

---

## Part 3 — Connect frontend and backend (CORS)

The API will reject browser requests from Vercel until CORS allows that origin.

1. Copy your Vercel URL (no trailing slash), e.g. `https://marketminds-xxx.vercel.app`.
2. In Render → your web service → **Environment**, update:

```text
CORS_ORIGINS=https://marketminds-xxx.vercel.app,http://localhost:5173,http://127.0.0.1:5173
```

If you use a custom Vercel domain later, add that too:

```text
CORS_ORIGINS=https://marketminds-xxx.vercel.app,https://www.yourdomain.com,http://localhost:5173
```

3. Save. Render will redeploy automatically.
4. Hard-refresh the Vercel site and test:

- Watchlist loads tickers
- Stock detail opens and chart appears
- Options calculator returns a Monte Carlo price

If the UI shows “Unable to reach the MarketMinds API”, check Part 4.

---

## Part 4 — Troubleshooting

### Frontend cannot reach API

1. Confirm `VITE_API_URL` on Vercel points to your **live** Render URL and includes `/api` (or the bare host — both are fine).
2. Redeploy Vercel after changing any `VITE_*` variable.
3. Open browser DevTools → **Network** and inspect failing requests (CORS vs 502 vs timeout).

### CORS errors in the browser console

Typical message: *blocked by CORS policy*.

- Ensure `CORS_ORIGINS` on Render includes the **exact** Vercel origin (scheme + host, no path, no trailing slash).
- If you open a **Preview** deployment (`*.vercel.app` with a different subdomain), add that preview URL too, or deploy Production only while testing.

### Render free tier cold starts

On the free plan, the API may sleep after inactivity. The first request can take 30–60+ seconds.

- Use `VITE_API_TIMEOUT_MS=120000` on Vercel.
- Wait for the first request; later requests are faster.
- Upgrade Render if you need always-on.

### Options calculation is slow or times out

- Lower `OPTIONS_MONTE_CARLO_SIMULATIONS` (e.g. `5000`).
- Keep `OPTIONS_WORKER_PROCESSES=1` on small instances.
- Check Render logs for Python errors / out-of-memory.

### Stock / Yahoo Finance errors

- Confirm `USE_MOCK_DATA=false`.
- Retry; Yahoo can be flaky.
- Check Render **Logs** for timeout or “no data” messages.

### Wrong folder deployed

| Symptom | Likely mistake |
|---------|----------------|
| Render build cannot find `requirements.txt` | Root Directory is not `backend` |
| Vercel cannot find `package.json` / Vite | Root Directory is not `frontend` |
| API 404 on `/api/health` | Start command wrong, or not running `app:app` |

Correct start command:

```bash
uvicorn app:app --host 0.0.0.0 --port $PORT
```

`$PORT` is provided by Render — do not hardcode `8000` in production.

### React Router 404 on refresh (Vercel)

This repo’s `frontend/vercel.json` should prevent that. If you removed it, restore:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## Part 5 — Updating after code changes

Because both platforms are connected to Git:

1. Push to your deploy branch (`main`).
2. Render rebuilds the API automatically (if Auto-Deploy is on).
3. Vercel rebuilds the frontend automatically.

If you only change backend env vars → Render redeploy is enough.  
If you only change `VITE_*` on Vercel → trigger a **Redeploy** (rebuild required).

---

## Part 6 — Optional extras

### Custom domain on Vercel

1. Vercel project → **Settings** → **Domains** → add your domain.
2. Add the DNS records Vercel shows.
3. Add the custom origin to Render `CORS_ORIGINS`.
4. Redeploy Render after saving env vars.

### Custom domain on Render

1. Render service → **Settings** → **Custom Domains**.
2. Update `VITE_API_URL` on Vercel to the new API URL.
3. Redeploy Vercel.

### Keep local development working

Locally you still run:

```powershell
# Terminal 1 — backend
cd backend
.\.venv\Scripts\activate
uvicorn app:app --reload --port 8000

# Terminal 2 — frontend
cd frontend
npm run dev
```

Local Vite proxies `/api` → `http://localhost:8000`, so you usually do **not** need a production `VITE_API_URL` in `frontend/.env` for day-to-day work. See `frontend/.env.example`.

---

## Quick checklist

- [ ] Repo pushed to GitHub
- [ ] Render Web Service created with **Root Directory = `backend`**
- [ ] Start command: `uvicorn app:app --host 0.0.0.0 --port $PORT`
- [ ] `/api/health` works on Render
- [ ] Vercel project created with **Root Directory = `frontend`**
- [ ] `VITE_API_URL=https://YOUR-SERVICE.onrender.com/api`
- [ ] Optional: `VITE_API_TIMEOUT_MS=120000`
- [ ] Render `CORS_ORIGINS` includes your Vercel URL
- [ ] Watchlist / stock detail / options work on the live site

---

## Reference links

| Resource | URL |
|----------|-----|
| Local setup | [SETUP_GUIDE.md](./SETUP_GUIDE.md) |
| Project overview | [README.md](./README.md) |
| Frontend env sample | [frontend/.env.example](./frontend/.env.example) |
| Backend env sample | [backend/.env.example](./backend/.env.example) |
| Render docs | https://render.com/docs/web-services |
| Vercel docs | https://vercel.com/docs |
