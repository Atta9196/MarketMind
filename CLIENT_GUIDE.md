# MarketMinds — Client User Guide

A simple guide to using MarketMinds from your first launch through advanced options pricing.  
**No programming knowledge is required** to use the app once it is running.

> **For developers:** setup and technical details live in [README.md](./README.md).  
> **Environment / install / run only:** see [SETUP_GUIDE.md](./SETUP_GUIDE.md).  
> **This guide** is for people who want to *use* MarketMinds day to day.

---

## Table of Contents

1. [What is MarketMinds?](#1-what-is-marketminds)
2. [Before You Start](#2-before-you-start)
3. [Starting the Application](#3-starting-the-application)
4. [Tour of the App](#4-tour-of-the-app)
5. [Beginner: Using the Watchlist](#5-beginner-using-the-watchlist)
6. [Beginner: Viewing a Stock Chart](#6-beginner-viewing-a-stock-chart)
7. [Intermediate: Understanding Live Price Colors](#7-intermediate-understanding-live-price-colors)
8. [Intermediate: Options Calculator Basics](#8-intermediate-options-calculator-basics)
9. [Advanced: Reading Options Results](#9-advanced-reading-options-results)
10. [Advanced: Tips for Better Estimates](#10-advanced-tips-for-better-estimates)
11. [Troubleshooting](#11-troubleshooting)
12. [Glossary](#12-glossary)
13. [Important Disclaimer](#13-important-disclaimer)

---

## 1. What is MarketMinds?

MarketMinds helps you:

- **Watch** live (near real-time) stock prices for major companies  
- **See** how a stock’s price has moved recently on a chart  
- **Estimate** the theoretical price of a stock **option** using professional pricing models  

Think of it as three tools in one window:

| Tool | What it does |
|------|----------------|
| **Watchlist** | A live table of stock prices |
| **Stock Detail** | Company info + price chart |
| **Options Calc** | Option price calculator |

---

## 2. Before You Start

Ask your developer or IT helper to make sure these are ready on the computer:

1. The MarketMinds project folder is installed  
2. The **backend** (server) can start  
3. The **frontend** (website) can start  

You will use the app in a **web browser** (Chrome, Edge, or Safari work well).

**What you need while using it:**

- A working internet connection (prices come from online market data)  
- Two programs running at the same time: the **API server** and the **website**

If someone else starts MarketMinds for you, skip to [Section 4](#4-tour-of-the-app).

---

## 3. Starting the Application

If the project is not installed yet, follow **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** first.

You need **two terminal / command windows** open.

### Step A — Start the backend (API)

1. Open a terminal in the `backend` folder  
2. Activate the virtual environment (your developer may have already set this up)  
3. Run:

```text
uvicorn app:app --reload --port 8000
```

4. Leave this window **open**. You should see messages that the server is running.

**Check it worked:** open http://localhost:8000/api/health in your browser.  
You should see a short “healthy” / OK style response.

### Step B — Start the frontend (website)

1. Open a **second** terminal in the `frontend` folder  
2. Run:

```text
npm run dev
```

3. Leave this window **open** too  

**Open the app:** go to **http://localhost:5173**

You should see the MarketMinds dark screen with **Watchlist** and **Options Calc** at the top.

### Quick “am I ready?” checklist

| Check | OK? |
|-------|-----|
| Backend terminal is still running | ☐ |
| Frontend terminal is still running | ☐ |
| Browser shows http://localhost:5173 | ☐ |
| Watchlist shows company prices (not “No Connection”) | ☐ |

---

## 4. Tour of the App

At the top of every page:

| Item | Purpose |
|------|---------|
| **MarketMinds** logo / name | Click to return to the Watchlist |
| **Watchlist** | Live stock list |
| **Options Calc** | Option pricing tool |

On phones, menus are condensed but the same pages are available. Scroll if needed.

---

## 5. Beginner: Using the Watchlist

This is the home screen.

### What you will see

- A title: **Live Watchlist**  
- A small **market status** (Open / Closed style indicator)  
- A **refresh** button (circular arrow)  
- A table of stocks (for example AAPL, NVDA, TSLA)  

Each row shows:

- **Logo + ticker** (short stock code, e.g. `AAPL`)  
- **Company name** (on larger screens; on phones it appears under the ticker)  
- **Price** inside a small badge  

### What to do

1. Wait a few seconds for prices to load  
2. Prices refresh automatically about every **15 seconds**  
3. Click any row to open that stock’s **detail page**  
4. Use the refresh button if you want an immediate update  

### If you see “No Connection”

The website cannot reach the backend.

1. Confirm the backend terminal is still running  
2. Confirm you are using http://localhost:5173  
3. Click **Retry**  
4. If it still fails, ask your developer to restart both servers  

---

## 6. Beginner: Viewing a Stock Chart

1. From the Watchlist, click a stock (example: **AAPL**)  
2. You will see:
   - Company name and exchange/sector info  
   - Current **live price** badge  
   - A **green area chart** of recent price movement  

### How to read the chart

- The **green line** is the price over the recent trading period  
- The **shaded area** under the line highlights the path of the price  
- Dates run along the bottom  
- Prices run up the left side  

### Going back

Click **← Back to Watchlist** at the top.

---

## 7. Intermediate: Understanding Live Price Colors

Prices appear inside a rounded badge with a colored border.

| Color | Meaning |
|-------|---------|
| **Green border** | Price is up (rising vs the previous update, or up on the day) |
| **Red border** | Price is down |
| **Neutral / grayish border** | Little or no clear change yet |

This happens on both:

- The Watchlist table  
- The Stock Detail page  

**Tip:** Leave the page open for a minute. When prices refresh, the badge color can change as the market moves.

---

## 8. Intermediate: Options Calculator Basics

Click **Options Calc** in the top menu.

You will see **three columns** (they stack on phones):

1. **Input Parameters** — what you type in  
2. **Processing** — progress while the calculation runs  
3. **Results** — the estimated option price  

### Fill in the form (column 1)

| Field | What to enter | Example |
|-------|----------------|---------|
| **Ticker Symbol** | Stock code | `AAPL` |
| **Strike Price (USD)** | The option’s strike | `150.00` |
| **Option Type** | Call or Put | `Call` |
| **Expiration Date** | Future date the option expires | pick from the calendar |
| **Risk-Free Rate (%)** | Interest-rate style input | `4.25` |
| **Volatility (%)** | Expected price “swinginess” | `22.45` |

Then click the blue **Calculate** button.

### What happens next (column 2)

- A progress animation appears while the engine runs  
- On a successful run, you will see a completion message  
- If something goes wrong, you will see a **red warning icon** and **Error Details**

### Successful results (column 3)

- A large **Theoretical Option Price** (example: `$12.34`)  
- A status badge such as **In the Money (ITM)** or **Out of the Money (OTM)**  
- Extra details (model used, simulations, CPU cores, time, volatility)  
- A **Recalculate** button to run again with the same or new inputs  

---

## 9. Advanced: Reading Options Results

### Models MarketMinds uses

MarketMinds does not use only one formula. It compares several approaches:

| Model | In plain English |
|-------|------------------|
| **Black-Scholes** | Classic, fast formula for European-style options |
| **Binomial Tree** | Builds many possible future price steps, then works backward to a price |
| **Monte Carlo** | Simulates thousands of random future price paths, then averages them |

The main displayed price is based on the Black-Scholes primary result, and all three model outputs are included in the analysis.

### Status badges (moneyness)

| Status | Meaning (simplified) |
|--------|----------------------|
| **ITM — In the Money** | The option currently has intrinsic value (would be profitable if exercised now, ignoring fees) |
| **OTM — Out of the Money** | The option currently has no intrinsic value |
| **Knocked Out** | Used when time is effectively expired / settlement-style edge case where the option is worthless |

### Greeks (for more advanced users)

The backend also computes **Greeks** (sensitivity measures such as Delta, Gamma, Theta, Vega).  
These describe how the theoretical price might respond if the stock price, time, or volatility changes. They are estimates under model assumptions—not guarantees.

---

## 10. Advanced: Tips for Better Estimates

1. **Use a real ticker** that has liquid market data (`AAPL`, `MSFT`, `NVDA`, etc.).  
2. **Expiration must be in the future.** Past dates will fail validation.  
3. **Volatility** has a big impact. Higher volatility usually increases option value.  
4. **Strike vs current price:**
   - Call, strike well above current price → often **OTM**  
   - Call, strike below current price → often **ITM**  
5. **Risk-free rate** is usually a small percentage (for example around typical short-term rates). Enter it as a percent (e.g. `4.25`), not as `0.0425`.  
6. **Recalculate after changing only one input** so you can see how that input alone changes the price.  
7. **Compare Call vs Put** with the same strike and date to see how results differ.  

### Example practice drill

1. Open Options Calc  
2. Keep ticker `AAPL`  
3. Set strike near the current stock price from the Watchlist  
4. Calculate once  
5. Raise volatility by 5 points and Recalculate  
6. Observe how the theoretical price changes  

---

## 11. Troubleshooting

| Problem | What to try |
|---------|-------------|
| Page is blank or won’t load | Confirm frontend is running and open http://localhost:5173 |
| Watchlist shows **No Connection** | Start/restart the backend on port 8000, then click Retry |
| Prices stuck on “—” | Wait for load, click refresh, check internet |
| Options shows **Calculation Failed** | Check ticker spelling, expiration date, and that the backend is running |
| Error about market data / connection | Internet may be down, or Yahoo Finance data timed out — retry in a minute |
| Chart says no data | Try another popular ticker; some symbols have limited history |
| Site looks cramped on phone | Rotate to landscape or scroll; the layout is mobile-ready but tall pages need scrolling |

### When to ask your developer

- Commands fail when starting the servers  
- Port 8000 or 5173 is “already in use”  
- You need MarketMinds available on another computer or the internet  

---

## 12. Glossary

| Term | Simple meaning |
|------|----------------|
| **Ticker** | Short code for a stock (AAPL = Apple) |
| **Quote / Price** | Latest traded (or last available) market price |
| **Option** | A contract that gives the right (not obligation) to buy or sell a stock at a strike price by an expiration date |
| **Call** | Option that generally benefits if the stock price rises |
| **Put** | Option that generally benefits if the stock price falls |
| **Strike** | The fixed price in the option contract |
| **Volatility** | How much the stock price tends to move; more movement usually means pricier options |
| **Theoretical price** | Model-estimated fair value — not a guaranteed market quote |
| **Backend / API** | The engine that fetches data and runs math |
| **Frontend** | The website you click and view |

---

## 13. Important Disclaimer

MarketMinds is for **education and analysis only**.

- Market data may be **delayed or incomplete**  
- Option prices are **model estimates**, not live exchange quotes  
- Results are **not** investment advice  
- Do **not** use this app as your only input for real trading decisions  

Always consult a qualified financial professional if you are making financial decisions.

---

## Quick Reference Card

| I want to… | Go here | Do this |
|------------|---------|---------|
| See live stock prices | Watchlist | Wait for load / click refresh |
| Inspect one stock | Watchlist → click a row | Read price + chart |
| Go back | Stock Detail | Click “Back to Watchlist” |
| Price an option | Options Calc | Fill form → Calculate |
| Fix a failed option run | Options Calc | Read Error Details → fix inputs → Recalculate |
| Fix connection issues | Anywhere | Restart backend, then retry |

---

*Thank you for using MarketMinds. If you need a guided walkthrough on a shared call, use this document section by section from Beginner → Advanced.*
