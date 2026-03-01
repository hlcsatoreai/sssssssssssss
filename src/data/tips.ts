export interface Tip {
  id: number;
  title: string;
  description: string;
  category: string;
  details?: string[];
}

export const CATEGORIES = [
  "Setup Iniziale",
  "Analisi Tecnica",
  "Analisi Fondamentale",
  "Gestione Rischio",
  "Psicologia",
  "Strategie"
];

export const TIPS: Tip[] = [
  // Setup Iniziale (1-10)
  {
    id: 1,
    category: "Setup Iniziale",
    title: "Investi solo 'lost money'",
    description: "Max 1-5% del patrimonio netto totale, mai prestiti o risparmi essenziali.",
    details: ["Non usare mai soldi destinati ad affitto o bollette", "Considera il capitale perso al 100% dal momento del deposito"]
  },
  {
    id: 2,
    category: "Setup Iniziale",
    title: "Scegli exchange top",
    description: "Bitget/KuCoin per copy trading, leva 3-5x max, fee <0.1%.",
    details: ["Verifica la liquidità delle coppie che tradi", "Usa exchange con Proof of Reserves (PoR)"]
  },
  {
    id: 3,
    category: "Setup Iniziale",
    title: "Sicurezza Hardware",
    description: "Abilita 2FA hardware (YubiKey), usa wallet separati (Ledger per HODL).",
    details: ["Evita SMS 2FA (vulnerabile a SIM swapping)", "KYC immediato per evitare blocchi prelievi"]
  },
  {
    id: 4,
    category: "Setup Iniziale",
    title: "Crea 3 account distinti",
    description: "Demo (90% pratica), Spot (HODL), Futures (leva bassa).",
    details: ["Usa il conto Demo per almeno 3 mesi prima del live", "Non mischiare mai capitale HODL con quello da trading"]
  },
  {
    id: 5,
    category: "Setup Iniziale",
    title: "Budget e Journaling",
    description: "Max 1% capitale per trade, journal Excel con entry/exit/motivo/PnL.",
    details: ["Senza dati non puoi migliorare", "Analizza i trade perdenti ogni weekend"]
  },
  {
    id: 6,
    category: "Setup Iniziale",
    title: "VPN e Privacy",
    description: "Imposta VPN fissa (NordVPN) per IP italiano, evita geoblock.",
    details: ["Usa una mail dedicata solo per le crypto", "Non condividere mai screenshot dei tuoi saldi"]
  },
  {
    id: 7,
    category: "Setup Iniziale",
    title: "Portfolio Rule 60/30/10",
    description: "60% BTC/ETH, 30% altcoin solide (SOL), 10% meme/high-risk (WIF).",
    details: ["La base deve essere solida", "Le meme coin sono scommesse, non investimenti"]
  },
  {
    id: 8,
    category: "Setup Iniziale",
    title: "Automatizza DCA",
    description: "€50/settimana su BTC via Auto-Invest, ignora prezzo spot.",
    details: ["Il tempo nel mercato batte il timing del mercato", "Riduci lo stress della volatilità"]
  },
  {
    id: 9,
    category: "Setup Iniziale",
    title: "Backup Fisico",
    description: "Backup seed wallet su metallo inciso, mai foto/cloud.",
    details: ["La carta brucia, il metallo resta", "Dividi il seed in due parti in luoghi diversi"]
  },
  {
    id: 10,
    category: "Setup Iniziale",
    title: "Pianificazione Fiscale",
    description: "Traccia ogni trade (FIFO), dichiara quadro RW/RT >€51k.",
    details: ["Consulta un CAF specializzato crypto", "Usa software come Koinly per i report"]
  },

  // Analisi Tecnica (11-20)
  {
    id: 11,
    category: "Analisi Tecnica",
    title: "Conferma Candele",
    description: "Entra solo su pattern confirmed (hammer/doji + volume x2 media).",
    details: ["Usa timeframe 1H/4H per segnali più affidabili", "Aspetta sempre la chiusura della candela"]
  },
  {
    id: 12,
    category: "Analisi Tecnica",
    title: "Indicatori Essenziali",
    description: "RSI (buy<30, sell>70), MACD crossover, EMA20/50 cross.",
    details: ["Cerca divergenze tra prezzo e RSI", "Il Golden Cross (EMA20 sopra 50) è un segnale bullish forte"]
  },
  {
    id: 13,
    category: "Analisi Tecnica",
    title: "Supporti e Resistenze",
    description: "Disegna daily/weekly, invalida se break con volume alto.",
    details: ["I livelli psicologici (numeri tondi) sono fondamentali", "Un supporto rotto diventa resistenza"]
  },
  {
    id: 14,
    category: "Analisi Tecnica",
    title: "Volume Profile",
    description: "Trade solo spike >150% media 7gg, ignora low-liq pump.",
    details: ["Il volume conferma il movimento", "Senza volume, il trend è debole"]
  },
  {
    id: 15,
    category: "Analisi Tecnica",
    title: "Fibonacci Retracement",
    description: "Target 38.2%/61.8%, stop sotto 0%.",
    details: ["Il livello 0.618 è la 'Golden Pocket'", "Usalo per trovare entry dopo un forte impulso"]
  },
  {
    id: 16,
    category: "Analisi Tecnica",
    title: "Ichimoku Cloud",
    description: "Entra long solo sopra cloud, exit sotto.",
    details: ["La nuvola indica il trend futuro", "Il Tenkan/Kijun cross è un segnale di momentum"]
  },
  {
    id: 17,
    category: "Analisi Tecnica",
    title: "VWAP Daily",
    description: "Price > VWAP = bullish bias, short sotto.",
    details: ["Indica il prezzo medio ponderato per il volume", "Usalo per capire se stai comprando a sconto o sovrapprezzo"]
  },
  {
    id: 18,
    category: "Analisi Tecnica",
    title: "Bollinger Bands Squeeze",
    description: "Breakout con RSI conferma per swing 2-5gg.",
    details: ["La bassa volatilità precede sempre l'alta volatilità", "Attendi l'espansione delle bande"]
  },
  {
    id: 19,
    category: "Analisi Tecnica",
    title: "Backtest Manuale",
    description: "100 trade storici su TradingView prima di andare live.",
    details: ["Verifica se la tua strategia ha un vantaggio statistico", "Non barare con il replay mode"]
  },
  {
    id: 20,
    category: "Analisi Tecnica",
    title: "Multi-Timeframe",
    description: "4H trend, 15m entry—mai contro HTF (Higher Time Frame).",
    details: ["Se il daily è bearish, non cercare long sul 15m", "Allineati con la forza dominante"]
  },

  // Analisi Fondamentale (21-25)
  {
    id: 21,
    category: "Analisi Fondamentale",
    title: "Metriche On-Chain",
    description: "Whale alert (CryptoQuant), netflow exchange negativi = bullish.",
    details: ["Se le balene prelevano dagli exchange, vogliono holdare", "Monitora l'attività dei wallet dormienti"]
  },
  {
    id: 22,
    category: "Analisi Fondamentale",
    title: "Sentiment AI",
    description: "LunarCrush Galaxy Score > 65 + RSI oversold per long.",
    details: ["Usa l'AI per filtrare il rumore dei social", "L'euforia estrema è spesso un segnale di top"]
  },
  {
    id: 23,
    category: "Analisi Fondamentale",
    title: "News Filter",
    description: "CoinTelegraph/Binance Square, ignora hype Telegram.",
    details: ["Verifica sempre le fonti", "Diffida dei DM di 'guru' o supporto tecnico"]
  },
  {
    id: 24,
    category: "Analisi Fondamentale",
    title: "Tokenomics",
    description: "Circ supply < 50%, burn attivi, vesting lockup.",
    details: ["Evita progetti con sblocchi massicci imminenti", "Controlla la distribuzione tra i fondatori"]
  },
  {
    id: 25,
    category: "Analisi Fondamentale",
    title: "ETF Flow",
    description: "Buy BTC dip se BlackRock inflow > $1B settimanale.",
    details: ["Segui i soldi istituzionali", "Gli ETF hanno cambiato la struttura del mercato"]
  },

  // Gestione Rischio (26-35)
  {
    id: 26,
    category: "Gestione Rischio",
    title: "R:R Minimo 1:2.5",
    description: "Risk 1% per gain 2.5%.",
    details: ["Con questo ratio puoi avere ragione solo il 40% delle volte e fare profitto", "Non inseguire trade con scarso potenziale"]
  },
  {
    id: 27,
    category: "Gestione Rischio",
    title: "Position Sizing",
    description: "(Capitale * 1%) / distanza stop-loss in %.",
    details: ["La size dipende dallo stop, non dal feeling", "Non rischiare mai più dell'1% del totale su un trade"]
  },
  {
    id: 28,
    category: "Gestione Rischio",
    title: "Stop-Loss Trailing",
    description: "2% ATR dopo +5% profit.",
    details: ["Proteggi il capitale una volta in gain", "Lascia correre i profitti ma con cintura di sicurezza"]
  },
  {
    id: 29,
    category: "Gestione Rischio",
    title: "Correlazione Asset",
    description: "Max 3 trade open, correlazione < 0.7.",
    details: ["Non aprire SOL e WIF insieme (sono correlati)", "Diversifica i settori (L1, DeFi, Meme)"]
  },
  {
    id: 30,
    category: "Gestione Rischio",
    title: "Drawdown Rule",
    description: "Pausa 7gg se -5% settimanale.",
    details: ["Il mercato non scappa, la tua lucidità sì", "Evita il tilt dopo una serie di perdite"]
  },
  {
    id: 31,
    category: "Gestione Rischio",
    title: "No Revenge Trading",
    description: "1 loss = journal + pausa 1h.",
    details: ["Non cercare di 'riprenderti' i soldi dal mercato", "Il mercato non ha memoria dei tuoi trade"]
  },
  {
    id: 32,
    category: "Gestione Rischio",
    title: "Leva Finanziaria",
    description: "1x spot primi 6 mesi, 3x max futures.",
    details: ["La leva è un'arma a doppio taglio", "Aumenta la leva solo quando sei profittevole in spot"]
  },
  {
    id: 33,
    category: "Gestione Rischio",
    title: "Diversifica Settori",
    description: "L1 (SOL), DeFi (UNI), Meme (WIF 5% max).",
    details: ["Non mettere tutte le uova in un paniere", "Le meme coin servono solo per la speculazione veloce"]
  },
  {
    id: 34,
    category: "Gestione Rischio",
    title: "Hedging",
    description: "Short BTC futures se portfolio > 20% up.",
    details: ["Proteggi i guadagni spot durante le correzioni", "Usa leva bassa per l'hedging"]
  },
  {
    id: 35,
    category: "Gestione Rischio",
    title: "Insurance Fund",
    description: "10% stablecoin (USDT) per dip market.",
    details: ["Tieni sempre polvere da sparo per i crolli", "Le migliori opportunità nascono nel sangue"]
  },

  // Psicologia (36-42)
  {
    id: 36,
    category: "Psicologia",
    title: "Journal Video",
    description: "Registra motivo trade pre-entry.",
    details: ["Ascoltati mentre spieghi il trade: se suoni incerto, non entrare", "Analizza le tue emozioni a freddo"]
  },
  {
    id: 37,
    category: "Psicologia",
    title: "Disciplina Quotidiana",
    description: "Meditazione 10'/giorno, no trade post-22:00.",
    details: ["Il trading richiede una mente riposata", "La stanchezza porta a errori banali"]
  },
  {
    id: 38,
    category: "Psicologia",
    title: "FOMO Test",
    description: "Lista 'perché NO questo trade?'—skip se emozioni.",
    details: ["Se hai paura di perdere l'occasione, l'hai già persa", "Il mercato offre opportunità ogni giorno"]
  },
  {
    id: 39,
    category: "Psicologia",
    title: "Focus Expectancy",
    description: "Win-rate non conta: focus su expectancy.",
    details: ["Expectancy = (win% * avg win) - (loss% * avg loss)", "Puoi avere un win-rate del 30% ed essere milionario"]
  },
  {
    id: 40,
    category: "Psicologia",
    title: "Review Settimanale",
    description: "PnL per strategia, elimina perdenti.",
    details: ["Taglia quello che non funziona", "Raddoppia su quello che ti porta profitto costante"]
  },
  {
    id: 41,
    category: "Psicologia",
    title: "Community Filter",
    description: "Segui solo 5 top (CZ, Vitalik), ignora Reddit pump.",
    details: ["Il rumore dei social distrugge la strategia", "Pensa con la tua testa"]
  },
  {
    id: 42,
    category: "Psicologia",
    title: "Exit Plan",
    description: "Scala out 50% a TP1, trail resto.",
    details: ["Il profitto non è reale finché non è in stablecoin", "Non essere avido: porta a casa il pane"]
  },

  // Strategie (43-50)
  {
    id: 43,
    category: "Strategie",
    title: "Scalping",
    description: "5m RSI div, target 0.5%, 20 trade/giorno max.",
    details: ["Richiede riflessi pronti e commissioni basse", "Non farlo se non hai tempo di stare al PC"]
  },
  {
    id: 44,
    category: "Strategie",
    title: "Swing Trading",
    description: "Breakout 4H con volume, hold 2-7gg.",
    details: ["Meno stress, profitti più ampi", "Ideale per chi lavora e non può stare sui grafici"]
  },
  {
    id: 45,
    category: "Strategie",
    title: "Arbitrage",
    description: "Spot-futures basis > 0.5% su Bitget.",
    details: ["Sfrutta le differenze di prezzo tra mercati", "Rischio quasi nullo se eseguito bene"]
  },
  {
    id: 46,
    category: "Strategie",
    title: "Copy Trading",
    description: "Top 10 Bitget master (win-rate > 70%).",
    details: ["Alloca max 20% del capitale", "Scegli trader con drawdown basso (<15%)"]
  },
  {
    id: 47,
    category: "Strategie",
    title: "Grid Bot",
    description: "Range-bound (BTC 50-60k), profit 0.2%/grid.",
    details: ["Ottimo per mercati laterali", "Automatizza il buy low / sell high"]
  },
  {
    id: 48,
    category: "Strategie",
    title: "News Catalyst",
    description: "Long pre-listing CEX (Binance), exit +20%.",
    details: ["Compra il rumor, vendi la notizia", "Attenzione ai dump post-listing"]
  },
  {
    id: 49,
    category: "Strategie",
    title: "Staking Serio",
    description: "10% portfolio ETH/SOL per yield 5-10%.",
    details: ["Fai lavorare le tue coin mentre dormi", "Usa solo protocolli ufficiali o exchange sicuri"]
  },
  {
    id: 50,
    category: "Strategie",
    title: "Long-Term HODL",
    description: "Ciclo halving BTC, ritira 20% profitti/anno.",
    details: ["La pazienza paga più della velocità", "Bitcoin è l'asset scarso per eccellenza"]
  }
];
