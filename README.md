# Crypto Signal Pro (Real Data)

This repo contains:

- **Frontend (Vite + React + TS)** in `/`
- **Backend API (Express + TS)** in `/backend`

The app shows **REAL market data** from:
- CoinGecko (universe + global overview)
- Bitget public endpoints (tickers + candles)

If a provider fails (rate-limit, downtime), the UI must show **OFFLINE / DATI NON DISPONIBILI** (no invented numbers).

---

## 1) Run locally

### Backend
```bash
cd backend
npm install
npm run dev
```
Backend runs on `http://localhost:8787`.

### Frontend
Open a second terminal:
```bash
npm install
# point the UI to your backend
export VITE_API_BASE="http://localhost:8787"
npm run dev
```

---

## 2) Deploy on Render (step-by-step)

### Option A (recommended): 2 services

#### A1) Create Backend service
1. Render → **New** → **Web Service**
2. Connect your GitHub repo
3. **Root Directory**: `backend`
4. **Build Command**: `npm install && npm run build`
5. **Start Command**: `npm start`
6. Deploy → copy the backend URL (example: `https://crypto-signal-pro-api.onrender.com`)

#### A2) Create Frontend (Static Site)
1. Render → **New** → **Static Site**
2. Connect the same GitHub repo
3. **Root Directory**: *(empty / repo root)*
4. **Build Command**: `npm install && npm run build`
5. **Publish Directory**: `dist`
6. Add **Environment Variable**:
   - `VITE_API_BASE` = the backend URL (example: `https://crypto-signal-pro-api.onrender.com`)
7. Deploy

> IMPORTANT: On free plan, Render can “sleep” when inactive (first request may be slow). This is normal.

---

## 3) Common errors

### CoinGecko 429 (rate limit)
This means you exceeded CoinGecko limits. The backend already uses cache, but you can also:
- increase cache TTLs in `backend/src/index.ts`
- reduce universe size in `/api/scan?universe=30`
- add your CoinGecko key on Render:
  - `COINGECKO_API_KEY=...` (optional)

### CORS
The UI calls the backend only. No API keys are in the frontend.

---

## Environment variables

### Backend
- `COINGECKO_API_KEY` (optional)

### Frontend
- `VITE_API_BASE` (required on Render)
- `VITE_GEMINI_API_KEY` (optional, only if you still use the AI sections)

