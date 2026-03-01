import express from "express";
import cors from "cors";
import axios from "axios";
import pLimit from "p-limit";

const app = express();
app.use(cors());
app.use(express.json());

// -------------------------
// Helpers
// -------------------------
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function nowIso() {
  return new Date().toISOString();
}

function safeNumber(x: any): number | null {
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
}

// -------------------------
// Simple in-memory cache
// -------------------------
type CacheEntry<T> = { value: T; ts: number; ttl: number };
const cache = new Map<string, CacheEntry<any>>();

function cacheGet<T>(key: string): T | null {
  const e = cache.get(key);
  if (!e) return null;
  if (Date.now() - e.ts > e.ttl) return null;
  return e.value as T;
}
function cacheSet<T>(key: string, value: T, ttl: number) {
  cache.set(key, { value, ts: Date.now(), ttl });
}

// TTLs
const TTL = {
  coingeckoUniverse: 5 * 60_000,  // 5m
  coingeckoGlobal: 60_000,        // 60s
  bitgetTickers: 10_000,          // 10s
  bitgetCandles: 5 * 60_000,      // 5m
  news: 10 * 60_000               // 10m
};

// -------------------------
// Providers
// -------------------------
const COINGECKO_BASE = "https://api.coingecko.com/api/v3";
const BITGET_BASE = "https://api.bitget.com";

// CoinGecko (no key by default). If you have a key, set COINGECKO_API_KEY in env.
// Note: CoinGecko Demo/Pro keys use different base/headers; we keep free-compatible.
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY?.trim() || "";

// Axios instance with timeouts
const http = axios.create({ timeout: 12_000 });

async function coingeckoCoinsMarketsTop(n = 100) {
  const key = `cg:markets:${n}`;
  const cached = cacheGet<any[]>(key);
  if (cached) return { source: "cache", data: cached };

  try {
    // Use 1 request only (top n) to avoid rate limits
    const perPage = Math.min(100, Math.max(1, n));
    const url = `${COINGECKO_BASE}/coins/markets`;
    const resp = await http.get(url, {
      params: {
        vs_currency: "usd",
        order: "market_cap_desc",
        per_page: perPage,
        page: 1,
        sparkline: false,
        price_change_percentage: "24h"
      },
      headers: COINGECKO_API_KEY ? { "x-cg-demo-api-key": COINGECKO_API_KEY } : undefined
    });

    cacheSet(key, resp.data, TTL.coingeckoUniverse);
    return { source: "coingecko", data: resp.data };
  } catch (err: any) {
    const status = err?.response?.status;
    // fallback to cache if exists
    const fallback = cacheGet<any[]>(key);
    if (fallback) return { source: "cache-fallback", data: fallback, warning: `CoinGecko error ${status ?? ""}` };
    throw err;
  }
}

async function coingeckoGlobal() {
  const key = `cg:global`;
  const cached = cacheGet<any>(key);
  if (cached) return { source: "cache", data: cached };

  try {
    const resp = await http.get(`${COINGECKO_BASE}/global`, {
      headers: COINGECKO_API_KEY ? { "x-cg-demo-api-key": COINGECKO_API_KEY } : undefined
    });
    cacheSet(key, resp.data, TTL.coingeckoGlobal);
    return { source: "coingecko", data: resp.data };
  } catch (err: any) {
    const fallback = cacheGet<any>(key);
    if (fallback) return { source: "cache-fallback", data: fallback };
    throw err;
  }
}

// Bitget public: tickers (spot)
async function bitgetSpotTickers() {
  const key = "bg:spot:tickers";
  const cached = cacheGet<any>(key);
  if (cached) return { source: "cache", data: cached };

  const url = `${BITGET_BASE}/api/v2/spot/market/tickers`;
  const resp = await http.get(url);
  // Bitget format: { code:"00000", data:[...] }
  if (resp.data?.code !== "00000") throw new Error(`Bitget tickers error: ${resp.data?.msg || "unknown"}`);
  cacheSet(key, resp.data, TTL.bitgetTickers);
  return { source: "bitget", data: resp.data };
}

// Bitget spot candles
// granularity: "15min" | "1H" | "4H" | "1D"
async function bitgetSpotCandles(symbol: string, granularity: string, limit = 120) {
  const key = `bg:candles:${symbol}:${granularity}:${limit}`;
  const cached = cacheGet<any>(key);
  if (cached) return { source: "cache", data: cached };

  const url = `${BITGET_BASE}/api/v2/spot/market/candles`;
  const resp = await http.get(url, { params: { symbol, granularity, limit } });
  if (resp.data?.code !== "00000") throw new Error(`Bitget candles error: ${resp.data?.msg || "unknown"}`);

  cacheSet(key, resp.data, TTL.bitgetCandles);
  return { source: "bitget", data: resp.data };
}

// News RSS via rss2json (free may rate limit too, hence cache)
async function cointelegraphRss() {
  const key = "news:cointelegraph";
  const cached = cacheGet<any>(key);
  if (cached) return { source: "cache", data: cached };

  const url = "https://api.rss2json.com/v1/api.json";
  const resp = await http.get(url, { params: { rss_url: "https://cointelegraph.com/rss" } });
  const items = resp.data?.items || [];
  cacheSet(key, items, TTL.news);
  return { source: "rss", data: items };
}

// -------------------------
// Indicators (deterministic)
// -------------------------
type Candle = { t: number; o: number; h: number; l: number; c: number; v: number };

function parseBitgetCandles(raw: any): Candle[] {
  // Bitget returns array of arrays: [ts, open, high, low, close, volume, quoteVolume?]
  const arr = raw?.data;
  if (!Array.isArray(arr)) return [];
  const candles: Candle[] = [];
  for (const row of arr) {
    if (!Array.isArray(row) || row.length < 6) continue;
    const t = Number(row[0]);
    const o = Number(row[1]);
    const h = Number(row[2]);
    const l = Number(row[3]);
    const c = Number(row[4]);
    const v = Number(row[5]);
    if ([t, o, h, l, c, v].some((x) => !Number.isFinite(x))) continue;
    candles.push({ t, o, h, l, c, v });
  }
  // Bitget often returns newest first; sort ascending time
  candles.sort((a, b) => a.t - b.t);
  return candles;
}

function EMA(values: number[], period: number): number[] {
  if (values.length === 0) return [];
  const k = 2 / (period + 1);
  const out: number[] = [];
  let ema = values[0];
  out.push(ema);
  for (let i = 1; i < values.length; i++) {
    ema = values[i] * k + ema * (1 - k);
    out.push(ema);
  }
  return out;
}

function RSI(values: number[], period = 14): number[] {
  if (values.length < period + 1) return [];
  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = values[i] - values[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  const out: number[] = new Array(period).fill(NaN);
  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  out.push(100 - 100 / (1 + rs));

  for (let i = period + 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    out.push(100 - 100 / (1 + rs));
  }

  return out;
}

function MACD(values: number[], fast = 12, slow = 26, signal = 9) {
  const emaFast = EMA(values, fast);
  const emaSlow = EMA(values, slow);
  const macdLine = values.map((_, i) => (emaFast[i] ?? NaN) - (emaSlow[i] ?? NaN));
  const signalLine = EMA(macdLine.map((x) => (Number.isFinite(x) ? x : 0)), signal);
  const histogram = macdLine.map((x, i) => x - (signalLine[i] ?? NaN));
  return { macdLine, signalLine, histogram };
}

function ATR(candles: Candle[], period = 14): number[] {
  if (candles.length < period + 1) return [];
  const trs: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const c = candles[i];
    const p = candles[i - 1];
    const tr = Math.max(c.h - c.l, Math.abs(c.h - p.c), Math.abs(c.l - p.c));
    trs.push(tr);
  }
  const out: number[] = [];
  // first ATR = SMA of TRs first period
  let sum = trs.slice(0, period).reduce((a, b) => a + b, 0);
  out.push(sum / period);
  for (let i = period; i < trs.length; i++) {
    const prev = out[out.length - 1];
    out.push((prev * (period - 1) + trs[i]) / period);
  }
  // align length to candles length by prefix NaNs
  const pad = new Array(1 + period).fill(NaN); // because trs starts at index1
  return pad.concat(out);
}

function bollinger(values: number[], period = 20, mult = 2) {
  const out = values.map(() => ({ mid: NaN, upper: NaN, lower: NaN, width: NaN }));
  for (let i = period - 1; i < values.length; i++) {
    const window = values.slice(i - period + 1, i + 1);
    const mean = window.reduce((a, b) => a + b, 0) / period;
    const variance = window.reduce((a, b) => a + (b - mean) ** 2, 0) / period;
    const sd = Math.sqrt(variance);
    const upper = mean + mult * sd;
    const lower = mean - mult * sd;
    out[i] = { mid: mean, upper, lower, width: (upper - lower) / (mean || 1) };
  }
  return out;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

// -------------------------
// Scoring (0-100) deterministic
// -------------------------
type Signal = {
  status: "BUY" | "SELL" | "WAIT" | "DCA";
  symbol: string;        // Bitget symbol like BTCUSDT
  name: string;
  coingeckoId: string;
  rank: number | null;
  marketCap: number | null;
  volume24h: number | null;
  entry: number | null;
  targets: { t1: number | null; t2: number | null; t3: number | null };
  stop: number | null;
  timeframe: string;
  confidence: number; // 0-100
  risk: "LOW" | "MEDIUM" | "HIGH";
  notes: string[];
  source: { market: string; candles: string };
  updatedAt: string;
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function scoreFromIndicators(opts: {
  rsi: number | null;
  macdHist: number | null;
  ema20: number | null;
  ema50: number | null;
  ema200: number | null;
  volSpike: number | null; // ratio
  bbWidth: number | null;
}): { score: number; status: Signal["status"]; notes: string[] } {
  const notes: string[] = [];
  let score = 0;

  // RSI (max 20)
  if (opts.rsi == null) {
    notes.push("RSI: dati non disponibili");
  } else if (opts.rsi < 30) {
    score += 18; notes.push(`RSI ${opts.rsi.toFixed(1)} (oversold)`);
  } else if (opts.rsi < 45) {
    score += 12; notes.push(`RSI ${opts.rsi.toFixed(1)} (rising zone)`);
  } else if (opts.rsi < 65) {
    score += 8; notes.push(`RSI ${opts.rsi.toFixed(1)} (neutral)`);
  } else if (opts.rsi >= 70) {
    score += 3; notes.push(`RSI ${opts.rsi.toFixed(1)} (overbought)`);
  }

  // EMA alignment (max 30)
  const { ema20, ema50, ema200 } = opts;
  if ([ema20, ema50, ema200].some((x) => x == null)) {
    notes.push("EMA: dati non completi");
  } else {
    // we assume caller compares price vs EMAs separately; here we just reward bullish structure
    if (ema20! > ema50!) { score += 10; notes.push("EMA20 > EMA50 (bullish)"); }
    if (ema50! > ema200!) { score += 12; notes.push("EMA50 > EMA200 (trend strong)"); }
    if (ema20! > ema200!) { score += 8; notes.push("EMA20 > EMA200"); }
  }

  // MACD (max 15)
  if (opts.macdHist == null) notes.push("MACD: non disponibile");
  else if (opts.macdHist > 0) { score += 12; notes.push("MACD hist positivo"); }
  else { score += 4; notes.push("MACD hist negativo"); }

  // Volume spike (max 20)
  if (opts.volSpike == null) notes.push("Volume: non disponibile");
  else if (opts.volSpike >= 2.0) { score += 20; notes.push(`Volume spike x${opts.volSpike.toFixed(2)}`); }
  else if (opts.volSpike >= 1.5) { score += 14; notes.push(`Volume sopra media x${opts.volSpike.toFixed(2)}`); }
  else if (opts.volSpike >= 1.1) { score += 8; notes.push(`Volume leggermente sopra media x${opts.volSpike.toFixed(2)}`); }
  else { score += 3; notes.push(`Volume normale x${opts.volSpike.toFixed(2)}`); }

  // Bollinger width (squeeze) (max 15)
  if (opts.bbWidth == null) notes.push("Bollinger: non disponibile");
  else if (opts.bbWidth < 0.05) { score += 14; notes.push("Bollinger squeeze (possibile breakout)"); }
  else if (opts.bbWidth < 0.10) { score += 10; notes.push("Bollinger compressione moderata"); }
  else { score += 4; notes.push("Bollinger ampia (volatilità già alta)"); }

  score = clamp(score, 0, 100);

  // Determine status
  let status: Signal["status"] = "WAIT";
  if (score >= 75) status = "BUY";
  else if (score <= 35) status = "WAIT";
  else status = "WAIT";

  // if RSI overbought and MACD negative, suggest SELL/WAIT
  if (opts.rsi != null && opts.rsi > 72 && (opts.macdHist ?? 0) < 0) {
    status = "SELL";
  }

  return { score, status, notes };
}

// -------------------------
// Routes
// -------------------------
app.get("/api/health", (_req, res) => {
  res.json({ status: "OK", timestamp: nowIso() });
});

app.get("/api/universe", async (req, res) => {
  const limit = clamp(Number(req.query.limit ?? 100), 1, 100);
  try {
    const { source, data, warning } = await coingeckoCoinsMarketsTop(limit) as any;
    res.json({ status: "LIVE", source, warning: warning ?? null, timestamp: nowIso(), data });
  } catch (e: any) {
    res.status(503).json({ status: "OFFLINE", source: "coingecko", timestamp: nowIso(), error: e?.message ?? "unknown" });
  }
});

app.get("/api/market/overview", async (_req, res) => {
  try {
    const { source, data } = await coingeckoGlobal();
    res.json({ status: "LIVE", source, timestamp: nowIso(), data });
  } catch (e: any) {
    res.status(503).json({ status: "OFFLINE", source: "coingecko", timestamp: nowIso(), error: e?.message ?? "unknown" });
  }
});

app.get("/api/news", async (_req, res) => {
  try {
    const { source, data } = await cointelegraphRss();
    res.json({ status: "LIVE", source, timestamp: nowIso(), data });
  } catch (e: any) {
    res.status(503).json({ status: "OFFLINE", source: "rss", timestamp: nowIso(), error: e?.message ?? "unknown" });
  }
});

// bitget tickers passthrough (cached)
app.get("/api/bitget/tickers", async (_req, res) => {
  try {
    const { source, data } = await bitgetSpotTickers();
    res.json({ status: "LIVE", source, timestamp: nowIso(), data });
  } catch (e: any) {
    res.status(503).json({ status: "OFFLINE", source: "bitget", timestamp: nowIso(), error: e?.message ?? "unknown" });
  }
});

// candles endpoint (cached)
app.get("/api/bitget/candles", async (req, res) => {
  const symbol = String(req.query.symbol ?? "").trim().toUpperCase();
  const granularity = String(req.query.granularity ?? "4H").trim();
  const limit = clamp(Number(req.query.limit ?? 120), 20, 200);

  if (!symbol) return res.status(400).json({ error: "symbol required" });

  try {
    const { source, data } = await bitgetSpotCandles(symbol, granularity, limit);
    res.json({ status: "LIVE", source, timestamp: nowIso(), data });
  } catch (e: any) {
    res.status(503).json({ status: "OFFLINE", source: "bitget", timestamp: nowIso(), error: e?.message ?? "unknown" });
  }
});

// MAIN: scan (limited, cached, bitget-first)
app.get("/api/scan", async (req, res) => {
  const limitUniverse = clamp(Number(req.query.universe ?? 50), 10, 100);
  const concurrency = clamp(Number(req.query.concurrency ?? 5), 1, 10);

  // scan cache: avoid re-scanning too frequently
  const scanKey = `scan:${limitUniverse}`;
  const cached = cacheGet<any>(scanKey);
  if (cached) {
    return res.json({ status: "LIVE", source: "cache", timestamp: nowIso(), ...cached });
  }

  try {
    // 1) universe (coingecko top N)
    const u = await coingeckoCoinsMarketsTop(limitUniverse);
    const universe = (u as any).data as any[];

    // 2) bitget tickers (spot)
    const t = await bitgetSpotTickers();
    const tickers = (t as any).data?.data ?? [];
    const tickerMap = new Map<string, any>();
    for (const row of tickers) {
      // row: { symbol:"BTCUSDT", lastPr, ... }
      if (row?.symbol) tickerMap.set(String(row.symbol).toUpperCase(), row);
    }

    // 3) candidates tradable on bitget spot USDT
    const candidates = universe
      .map((c) => ({
        id: c.id,
        name: c.name,
        symbol: String(c.symbol || "").toUpperCase(),
        rank: safeNumber(c.market_cap_rank),
        marketCap: safeNumber(c.market_cap),
        volume24h: safeNumber(c.total_volume),
      }))
      .filter((c) => c.symbol && (c.volume24h ?? 0) >= 10_000_000) // liquidity filter
      .map((c) => {
        const pair = `${c.symbol}USDT`;
        const ticker = tickerMap.get(pair);
        return { ...c, pair, ticker, tradable: Boolean(ticker) };
      });

    // 4) analyze candles for tradable ones
    const tradables = candidates.filter((c) => c.tradable);

    const limiter = pLimit(concurrency);

    const analyzed = await Promise.all(
      tradables.map((c) =>
        limiter(async () => {
          // lightweight anti-burst
          await sleep(250);

          const candlesResp = await bitgetSpotCandles(c.pair, "4H", 120);
          const candles = parseBitgetCandles((candlesResp as any).data);
          if (candles.length < 60) {
            return { c, ok: false, reason: "candles insufficient" };
          }

          const closes = candles.map((x) => x.c);
          const vols = candles.map((x) => x.v);

          const rsiArr = RSI(closes, 14);
          const macd = MACD(closes, 12, 26, 9);
          const ema20 = EMA(closes, 20);
          const ema50 = EMA(closes, 50);
          const ema200 = EMA(closes, 200); // may be shorter than closes if start, but EMA returns full length
          const atrArr = ATR(candles, 14);
          const bb = bollinger(closes, 20, 2);

          const last = closes[closes.length - 1];
          const lastRSI = rsiArr.length ? rsiArr[rsiArr.length - 1] : null;
          const lastMacdHist = macd.histogram.length ? macd.histogram[macd.histogram.length - 1] : null;
          const lastEma20 = ema20[ema20.length - 1] ?? null;
          const lastEma50 = ema50[ema50.length - 1] ?? null;
          const lastEma200 = ema200[ema200.length - 1] ?? null;
          const lastAtr = atrArr.length ? atrArr[atrArr.length - 1] : null;
          const lastBbWidth = bb.length ? bb[bb.length - 1].width : null;

          // volume spike = last volume / avg last 20
          const volWindow = vols.slice(-20);
          const avgVol = average(volWindow);
          const volSpike = avgVol > 0 ? vols[vols.length - 1] / avgVol : null;

          const { score, status, notes } = scoreFromIndicators({
            rsi: lastRSI,
            macdHist: lastMacdHist,
            ema20: lastEma20,
            ema50: lastEma50,
            ema200: lastEma200,
            volSpike,
            bbWidth: lastBbWidth
          });

          // entry from ticker lastPr
          const entry = safeNumber(c.ticker?.lastPr) ?? last;

          // stop: max -7% or ATR-based (2*ATR)
          let stop: number | null = null;
          if (entry != null) {
            const pctStop = entry * 0.93; // -7%
            if (lastAtr != null) {
              stop = Math.max(pctStop, entry - 2 * lastAtr);
            } else {
              stop = pctStop;
            }
          }

          const targets =
            entry == null
              ? { t1: null, t2: null, t3: null }
              : { t1: entry * 1.10, t2: entry * 1.20, t3: entry * 1.40 };

          const risk: Signal["risk"] = score >= 80 ? "MEDIUM" : score >= 70 ? "MEDIUM" : "HIGH";

          const sig: Signal = {
            status,
            symbol: c.pair,
            name: c.name,
            coingeckoId: c.id,
            rank: c.rank,
            marketCap: c.marketCap,
            volume24h: c.volume24h,
            entry,
            targets,
            stop,
            timeframe: "4H (entry) / trend higher TF",
            confidence: score,
            risk,
            notes,
            source: { market: (u as any).source, candles: (candlesResp as any).source },
            updatedAt: nowIso()
          };

          return { c, ok: true, signal: sig };
        })
      )
    );

    const okSignals = analyzed.filter((x) => x.ok).map((x: any) => x.signal as Signal);
    okSignals.sort((a, b) => b.confidence - a.confidence);

    const top = okSignals.filter((s) => s.confidence >= 70 && s.status !== "WAIT").slice(0, 5);

    const watchlist = okSignals.slice(0, 10);

    const payload = {
      analyzed: tradables.length,
      opportunities: top.length,
      top,
      watchlist,
      offline: false
    };

    cacheSet(scanKey, payload, 60_000); // cache scan results 60s
    res.json({ status: "LIVE", source: "scan", timestamp: nowIso(), ...payload });

  } catch (e: any) {
    res.status(503).json({
      status: "OFFLINE",
      source: "scan",
      timestamp: nowIso(),
      message: "Data provider temporarily unavailable",
      error: e?.message ?? "unknown"
    });
  }
});

// -------------------------
// Start
// -------------------------
const PORT = Number(process.env.PORT || 8787);
app.listen(PORT, () => {
  console.log(`API listening on :${PORT}`);
});
