import express from "express";
import cors from "cors";
import axios from "axios";

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

let cache:any = {
  tickers: null,
  lastUpdate: 0
};

const CACHE_TIME = 60000;


// HEALTH CHECK
app.get("/api/health", async (req, res) => {

  try {

    const response = await axios.get(
      "https://api.bitget.com/api/v2/spot/market/tickers"
    );

    res.json({
      status: "ONLINE",
      source: "bitget",
      total: response.data.data.length,
      timestamp: new Date()
    });

  } catch (err:any) {

    res.json({
      status: "OFFLINE",
      error: err.message
    });

  }

});


// UNIVERSE
app.get("/api/universe", async (req, res) => {

  try {

    if (
      cache.tickers &&
      Date.now() - cache.lastUpdate < CACHE_TIME
    ) {
      return res.json(cache.tickers);
    }

    const response = await axios.get(
      "https://api.bitget.com/api/v2/spot/market/tickers"
    );

    const coins = response.data.data
      .filter((c:any)=>c.symbol.endsWith("USDT"))
      .map((c:any)=>({

        symbol:c.symbol,
        price:parseFloat(c.lastPr),
        change24h:parseFloat(c.changeUtc24h),
        volume:parseFloat(c.quoteVolume)

      }))
      .sort((a:any,b:any)=>b.volume-a.volume)
      .slice(0,100);

    cache.tickers = coins;
    cache.lastUpdate = Date.now();

    res.json(coins);

  } catch(err:any){

    res.status(500).json({
      error:err.message
    });

  }

});


// SCAN SIGNALS
app.get("/api/scan", async (req, res) => {

  try {

    const response = await axios.get(
      "https://api.bitget.com/api/v2/spot/market/tickers"
    );

    const signals = response.data.data
      .filter((c:any)=>c.symbol.endsWith("USDT"))
      .map((c:any)=>{

        const change = parseFloat(c.changeUtc24h);

        let signal = "WAIT";

        if(change < -5) signal = "BUY";
        if(change > 5) signal = "SELL";

        return {

          symbol:c.symbol,
          price:parseFloat(c.lastPr),
          change24h:change,
          volume:parseFloat(c.quoteVolume),
          signal

        };

      })
      .sort((a:any,b:any)=>b.volume-a.volume)
      .slice(0,50);

    res.json(signals);

  } catch(err:any){

    res.status(500).json({
      error:err.message
    });

  }

});


// ROOT FIX
app.get("/",(req,res)=>{

  res.send("Crypto Signal Pro Bitget Backend ONLINE");

});


app.listen(PORT,()=>{

  console.log("Server running on port",PORT);

});
