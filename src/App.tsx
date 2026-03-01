import { useState, useMemo, useEffect, useRef, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  ShieldCheck, 
  BarChart3, 
  Brain, 
  Zap, 
  Search, 
  CheckCircle2, 
  Circle, 
  ChevronRight, 
  Info,
  Menu,
  X,
  LayoutGrid,
  List,
  Sparkles,
  Send,
  AlertTriangle,
  Loader2,
  Settings,
  Key
} from 'lucide-react';
import { TIPS, CATEGORIES, Tip } from './data/tips';
import { GoogleGenAI } from "@google/genai";
import Markdown from 'react-markdown';

// AI initialization
const getAi = (customKey?: string) => {
  try {
    const apiKey = customKey || import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey || apiKey === "undefined") {
      console.warn("GEMINI_API_KEY is missing or undefined.");
      return null;
    }
    return new GoogleGenAI({ apiKey });
  } catch (e) {
    console.error("Failed to initialize GoogleGenAI:", e);
    return null;
  }
};

function Calculator() {
  const [capital, setCapital] = useState<number>(1000);
  const [riskPercent, setRiskPercent] = useState<number>(1);
  const [entry, setEntry] = useState<number>(0);
  const [stopLoss, setStopLoss] = useState<number>(0);

  const riskAmount = (capital * riskPercent) / 100;
  const priceDiff = Math.abs(entry - stopLoss);
  const positionSize = priceDiff > 0 ? riskAmount / priceDiff : 0;
  const totalValue = positionSize * entry;
  const leverage = capital > 0 ? totalValue / capital : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Capitale Totale ($)</label>
          <input 
            type="number" 
            value={capital} 
            onChange={(e) => setCapital(Number(e.target.value))}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rischio per Trade (%)</label>
          <select 
            value={riskPercent} 
            onChange={(e) => setRiskPercent(Number(e.target.value))}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value={0.5}>0.5% (Conservativo)</option>
            <option value={1}>1% (Standard Bible)</option>
            <option value={2}>2% (Aggressivo)</option>
            <option value={3}>3% (Max Expert)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prezzo Entry ($)</label>
          <input 
            type="number" 
            value={entry} 
            onChange={(e) => setEntry(Number(e.target.value))}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prezzo Stop Loss ($)</label>
          <input 
            type="number" 
            value={stopLoss} 
            onChange={(e) => setStopLoss(Number(e.target.value))}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
      </div>

      <div className="p-6 bg-slate-900 rounded-2xl text-white space-y-4 shadow-xl">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <span className="text-xs text-slate-400">Rischio Monetario:</span>
          <span className="font-mono font-bold text-indigo-400">${riskAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <span className="text-xs text-slate-400">Dimensione Posizione (Coin):</span>
          <span className="font-mono font-bold text-emerald-400">{positionSize.toFixed(4)}</span>
        </div>
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <span className="text-xs text-slate-400">Valore Totale Posizione:</span>
          <span className="font-mono font-bold text-white">${totalValue.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-400">Leva Consigliata:</span>
          <span className={`font-mono font-bold ${leverage > 5 ? 'text-red-400' : 'text-emerald-400'}`}>
            {leverage.toFixed(1)}x
          </span>
        </div>
      </div>

      <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
        <p className="text-[10px] text-indigo-800 leading-relaxed italic">
          "Non importa quanto sei sicuro del trade, non rischiare mai più del 3% del capitale totale su una singola operazione." - Trucco #15
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'signals' | 'rules' | 'calculator' | 'settings'>('signals');

  const API_BASE = import.meta.env.VITE_API_BASE || "";
  const [apiLive, setApiLive] = useState<boolean>(false);
  const [apiLast, setApiLast] = useState<string>("-");
  const [realReportMd, setRealReportMd] = useState<string>("");
  const [realLoading, setRealLoading] = useState<boolean>(false);
  const [realError, setRealError] = useState<string>("");

  const fetchJson = async (path: string) => {
    const url = API_BASE ? `${API_BASE}${path}` : path;
    const resp = await fetch(url);
    const data = await resp.json();
    if (!resp.ok) throw new Error(data?.error || data?.message || `HTTP ${resp.status}`);
    return data;
  };

  const toMdFromScan = (scan: any) => {
    const date = new Date().toLocaleDateString("it-IT", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    const lines: string[] = [];
    lines.push(`# 📅 SEGNALI CRYPTO - ${date}`);
    lines.push(`> 🔍 Analizzate: **${scan?.analyzed ?? "-"}** crypto | 🎯 Opportunità trovate: **${scan?.opportunities ?? 0}**`);
    lines.push(`> 🕒 Ultimo aggiornamento dati: **${scan?.timestamp ?? "-"}**`);
    lines.push("");
    lines.push("## 🏆 TOP OPPORTUNITÀ DEL GIORNO");
    lines.push("");

    const top = Array.isArray(scan?.top) ? scan.top : [];
    if (top.length === 0) {
      lines.push("**Nessuna opportunità con score sufficiente. CASH MODE consigliata.**");
      lines.push("");
    } else {
      top.forEach((s: any, i: number) => {
        const badge =
          s.status === "BUY" ? "🟢 COMPRA" :
          s.status === "SELL" ? "🔴 VENDI" :
          s.status === "DCA" ? "💎 ACCUMULA" : "🟡 ASPETTA";

        lines.push(`### ${i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "🏅"} OPPORTUNITÀ #${i+1} — ${s.name} (${s.symbol})`);
        lines.push(`**STATO: ${badge}**`);
        lines.push("");
        lines.push(`| Parametro | Valore |`);
        lines.push(`| :--- | :--- |`);
        lines.push(`| **Market Cap** | ${s.marketCap ? `$${Number(s.marketCap).toLocaleString("en-US")}` : "n/d"} |`);
        lines.push(`| **Rank** | ${s.rank ?? "n/d"} |`);
        lines.push(`| **Entry** | ${s.entry ? `$${Number(s.entry).toFixed(6)}` : "n/d"} |`);
        lines.push(`| **Target 1** | ${s.targets?.t1 ? `$${Number(s.targets.t1).toFixed(6)} (+10%)` : "n/d"} |`);
        lines.push(`| **Target 2** | ${s.targets?.t2 ? `$${Number(s.targets.t2).toFixed(6)} (+20%)` : "n/d"} |`);
        lines.push(`| **Target 3** | ${s.targets?.t3 ? `$${Number(s.targets.t3).toFixed(6)} (+40%)` : "n/d"} |`);
        lines.push(`| **Stop Loss** | ${s.stop ? `$${Number(s.stop).toFixed(6)} (max -7% circa)` : "n/d"} |`);
        lines.push(`| **Timeframe** | ${s.timeframe ?? "n/d"} |`);
        lines.push(`| **Confidenza** | ${s.confidence ?? 0}% |`);
        lines.push(`| **Rischio** | ${s.risk ?? "n/d"} |`);
        lines.push("");
        lines.push("**Perché oggi:**");
        (Array.isArray(s.notes) ? s.notes : []).slice(0, 8).forEach((n: string) => lines.push(`- ${n}`));
        lines.push("");
        lines.push(`**AZIONE IMMEDIATA:** Apri ${s.symbol} su Bitget e imposta entry/stop/target come sopra (solo capitale che puoi perdere).`);
        lines.push("");
      });
    }

    lines.push("## ⛔ NOTE DATI / TRASPARENZA");
    lines.push(`- Fonte market/universe: **${scan?.top?.[0]?.source?.market ?? scan?.source ?? "n/d"}**`);
    lines.push(`- Fonte candles: **Bitget public candles (cache)**`);
    lines.push(`- Se un provider è OFFLINE, l'app non inventa numeri.`);
    lines.push("");
    lines.push("⚠️ DISCLAIMER: scopo informativo, non consulenza finanziaria. Crypto rischiose. Opera solo con capitale che puoi perdere. Nessuna garanzia di profitto.");
    return lines.join("\n");
  };

  const generateRealReport = async () => {
    try {
      setRealLoading(true);
      setRealError("");
      if (!API_BASE) {
        throw new Error("VITE_API_BASE non configurato. Imposta l'URL del backend /api.");
      }
      const scan = await fetchJson(`/api/scan?universe=50&concurrency=4`);
      setRealReportMd(toMdFromScan(scan));
    } catch (e: any) {
      setRealError(e?.message ?? "Errore sconosciuto");
    } finally {
      setRealLoading(false);
    }
  };

  // health ping
  useEffect(() => {
    let alive = true;
    const ping = async () => {
      try {
        if (!API_BASE) {
          if (alive) { setApiLive(false); setApiLast("-"); }
          return;
        }
        const h = await fetchJson("/api/health");
        if (alive) {
          setApiLive(true);
          setApiLast(h?.timestamp ?? "-");
        }
      } catch {
        if (alive) setApiLive(false);
      }
    };
    ping();
    const id = setInterval(ping, 10_000);
    return () => { alive = false; clearInterval(id); };
  }, [API_BASE]);

  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [completedTips, setCompletedTips] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedTip, setSelectedTip] = useState<Tip | null>(null);

  // API Key State
  const [storedApiKey, setStoredApiKey] = useState<string>("");

  // AI Advisor State
  const [aiInput, setAiInput] = useState("");
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [hasInitialScan, setHasInitialScan] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load progress and API key from local storage
  useEffect(() => {
    const savedProgress = localStorage.getItem('crypto-bible-progress');
    if (savedProgress) {
      setCompletedTips(JSON.parse(savedProgress));
    }

    const savedKey = localStorage.getItem('gemini-api-key');
    if (savedKey) {
      setStoredApiKey(savedKey);
    }
  }, []);

  const saveApiKey = (key: string) => {
    setStoredApiKey(key);
    localStorage.setItem('gemini-api-key', key);
  };

  const handleAiConsultation = async (eOrInput?: FormEvent | string) => {
    let query = aiInput;
    
    if (typeof eOrInput === 'string') {
      query = eOrInput;
    } else if (eOrInput && 'preventDefault' in eOrInput) {
      eOrInput.preventDefault();
    }

    if (isAiLoading) return;

    setIsAiLoading(true);
    setAiResponse(null);

    try {
      const ai = getAi(storedApiKey);
      if (!ai) {
        setAiResponse("Errore: Chiave API non configurata. Vai nelle Impostazioni per inserirla.");
        setIsAiLoading(false);
        return;
      }
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Sei "Crypto Signal Pro", un generatore di segnali di trading professionale. Oggi è il 1 Marzo 2026. Il tuo stile è DIRETTO, OPERATIVO e senza ambiguità. Il tuo obiettivo è dire all'utente ESATTAMENTE cosa fare oggi.
        
        UNIVERSO DI ANALISI:
        - Top 100 crypto (BTC, ETH, SOL, ecc.)
        - Altcoin con volume >$50M/24h
        - Token DeFi, AI, Gaming, L1, L2, Meme
        - Nuovi listing principali
        
        LOGICA DECISIONALE:
        1. Scansione completa multi-timeframe (Daily, 4H, 1H)
        2. Filtri tecnici (RSI, MACD, EMA, Bollinger, Volume)
        3. Analisi fondamentale (On-chain, Sentiment, News)
        4. Scoring (0-100) e Ranking
        
        OUTPUT RICHIESTO:
        Genera un report giornaliero COMPLETO seguendo ESATTAMENTE questa struttura. Usa Markdown AVANZATO (tabelle, grassetti, liste, blocchi di codice per i dati) per la massima leggibilità.
        
        # 📅 SEGNALI CRYPTO - 01/03/2026
        > 🔍 Analizzate: [Numero] crypto | 🎯 Opportunità trovate: [Numero]
        
        ## 🏆 TOP 10 OPPORTUNITÀ DEL GIORNO
        
        ### 🥇 OPPORTUNITÀ #1 - [MIGLIORE SETUP]
        **STATO: [🟢 COMPRA / 🔴 VENDI / 🟡 ASPETTA / 💎 ACCUMULA]**
        
        | Parametro | Valore |
        | :--- | :--- |
        | **Crypto** | [NOME] ([SIMBOLO]) |
        | **Entry Point** | \`$XXX.XX - $XXX.XX\` |
        | **Target 1** | \`$XXX.XX (+XX%)\` |
        | **Target 2** | \`$XXX.XX (+XX%)\` |
        | **Moonbag** | \`$XXX.XX (+XX%)\` |
        | **Stop Loss** | \`$XXX.XX (-X%)\` |
        | **Timeframe** | X ore/giorni |
        
        **Indicatori:**
        - 💪 Confidenza: [█████████░] XX%
        - ⚠️ Rischio: [⭐⭐⭐]
        - 🔥 Potenziale: [█████████░] XX%
        
        #### 📋 ANALISI COMPLETA:
        [2-3 righe di analisi professionale]
        
        > **💡 AZIONE IMMEDIATA:** [1 frase chiara e imperativa]
        
        ---
        
        ### 🥈 OPPORTUNITÀ #2 - [SECONDO MIGLIOR SETUP]
        ... (stessa struttura tabellare)
        
        ### 🥉 OPPORTUNITÀ #3 - [TERZO MIGLIOR SETUP]
        ... (stessa struttura tabellare)

        ### 🏅 OPPORTUNITÀ #4 - [QUARTO MIGLIOR SETUP]
        ... (stessa struttura tabellare)

        ### 🏅 OPPORTUNITÀ #5 - [QUINTO MIGLIOR SETUP]
        ... (stessa struttura tabellare)

        ### 🏅 OPPORTUNITÀ #6 - #10 (LISTA RAPIDA)
        | Crypto | Entry | Target | SL | Stato |
        | :--- | :--- | :--- | :--- | :--- |
        | [NOME] | $X.XX | $X.XX | $X.XX | [STATO] |
        | ... | ... | ... | ... | ... |
        
        ## 🎲 WILD CARD - ALTO RISCHIO
        ...
        
        ## 💎 STRATEGIA DCA
        ...
        
        ## 🔥 SCALPING VELOCE
        ...
        
        ## ⛔ TOP 5 CRYPTO DA EVITARE
        ...
        
        ## 🔍 SETTORI IN FOCUS
        ...
        
        ## 📊 MARKET OVERVIEW
        ...
        
        ## ⚡ ALERT E MOVIMENTI
        ...
        
        ## 📈 PERFORMANCE PRECEDENTI
        ...
        
        ## 🎯 STATISTICHE SCANSIONE
        ...
        
        ---
        **⚠️ DISCLAIMER:** [Testo standard]
        
        Richiesta Utente: "${query || "Genera il report segnali di oggi"}"`,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });

      setAiResponse(response.text || "Analisi non disponibile al momento.");
    } catch (error) {
      console.error("AI Error:", error);
      setAiResponse("Errore durante la consultazione dell'AI. Riprova più tardi.");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Auto-trigger initial scan
  useEffect(() => {
    if (activeTab === 'signals' && !hasInitialScan && !aiResponse) {
      handleAiConsultation("Genera il report segnali di oggi");
      setHasInitialScan(true);
    }
  }, [activeTab]);

  const toggleTip = (id: number) => {
    const newCompleted = completedTips.includes(id)
      ? completedTips.filter(t => t !== id)
      : [...completedTips, id];
    setCompletedTips(newCompleted);
    localStorage.setItem('crypto-bible-progress', JSON.stringify(newCompleted));
  };

  const filteredTips = useMemo(() => {
    return TIPS.filter(tip => {
      const matchesCategory = selectedCategory === "All" || tip.category === selectedCategory;
      const matchesSearch = tip.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           tip.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const progress = Math.round((completedTips.length / TIPS.length) * 100);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Setup Iniziale": return <ShieldCheck className="w-4 h-4" />;
      case "Analisi Tecnica": return <BarChart3 className="w-4 h-4" />;
      case "Analisi Fondamentale": return <TrendingUp className="w-4 h-4" />;
      case "Gestione Rischio": return <Zap className="w-4 h-4" />;
      case "Psicologia": return <Brain className="w-4 h-4" />;
      case "Strategie": return <LayoutGrid className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#1A1A1A] font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-black/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-200">
                <TrendingUp className="text-white w-5 h-5" />
              </div>
              <h1 className="font-bold text-lg tracking-tight hidden sm:block">Crypto Signal Pro</h1>
            </div>

            <div className="flex-1 max-w-md mx-4 hidden md:block">
              {activeTab === 'rules' && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Cerca trucchi..." 
                    className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-full text-sm focus:ring-2 focus:ring-black transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Progress</span>
                <span className="text-sm font-mono font-bold">{progress}%</span>
              </div>
              <div className="w-12 h-12 rounded-full border-2 border-gray-100 flex items-center justify-center relative">
                <svg className="w-full h-full -rotate-90">
                  <circle 
                    cx="24" cy="24" r="20" 
                    fill="transparent" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    className="text-gray-100"
                  />
                  <circle 
                    cx="24" cy="24" r="20" 
                    fill="transparent" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeDasharray={125.6}
                    strokeDashoffset={125.6 - (125.6 * progress) / 100}
                    className="text-emerald-500 transition-all duration-500"
                  />
                </svg>
                <CheckCircle2 className="absolute w-4 h-4 text-emerald-500" />
              </div>
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {isMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <aside className={`md:w-64 flex-shrink-0 space-y-1 ${isMenuOpen ? 'block' : 'hidden md:block'}`}>
            <h2 className="text-[11px] uppercase font-bold text-gray-400 tracking-widest px-4 mb-4">Trading Terminal</h2>
            
            <button 
              onClick={() => { setActiveTab('signals'); setIsMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'signals' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'hover:bg-white text-gray-600'}`}
            >
              <Zap className="w-4 h-4" />
              Signal Generator
            </button>

            <button 
              onClick={() => { setActiveTab('calculator'); setIsMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'calculator' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'hover:bg-white text-gray-600'}`}
            >
              <BarChart3 className="w-4 h-4" />
              Risk Calculator
            </button>

            <button 
              onClick={() => { setActiveTab('rules'); setIsMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'rules' ? 'bg-slate-800 text-white shadow-lg' : 'hover:bg-white text-gray-600'}`}
            >
              <ShieldCheck className="w-4 h-4" />
              Trading Bible
            </button>

            <button 
              onClick={() => { setActiveTab('settings'); setIsMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'settings' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'hover:bg-white text-gray-600'}`}
            >
              <Settings className="w-4 h-4" />
              Impostazioni
            </button>

            {activeTab === 'rules' && (
              <>
                <div className="h-px bg-black/5 my-4 mx-4" />
                <h2 className="text-[11px] uppercase font-bold text-gray-400 tracking-widest px-4 mb-4">Knowledge Base</h2>
                <button 
                  onClick={() => { setSelectedCategory("All"); setIsMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${selectedCategory === "All" ? 'bg-slate-100 text-slate-900' : 'hover:bg-white text-gray-600'}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                  Tutti i principi
                </button>
                {CATEGORIES.map(cat => (
                  <button 
                    key={cat}
                    onClick={() => { setSelectedCategory(cat); setIsMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${selectedCategory === cat ? 'bg-slate-100 text-slate-900' : 'hover:bg-white text-gray-600'}`}
                  >
                    {getCategoryIcon(cat)}
                    {cat}
                  </button>
                ))}
              </>
            )}

            <div className="mt-8 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 hidden md:block">
              <p className="text-xs text-emerald-800 font-medium leading-relaxed">
                "Il trading non è una scommessa, è una gestione professionale del rischio."
              </p>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1">
            {activeTab === 'settings' ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-xl mx-auto"
              >
                <div className="bg-white rounded-3xl border border-black/5 overflow-hidden shadow-sm">
                  <div className="p-6 border-b border-black/5 bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg">
                        <Settings className="text-white w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold tracking-tight">Impostazioni</h2>
                        <p className="text-xs text-slate-500 font-medium">Configurazione Terminale</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-8 space-y-8">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Key className="w-4 h-4 text-indigo-600" />
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Gemini API Key</h3>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Inserisci la tua chiave API di Google Gemini per abilitare il generatore di segnali. 
                        La chiave verrà salvata localmente nel tuo browser.
                      </p>
                      <div className="relative">
                        <input 
                          type="password"
                          placeholder="Incolla qui la tua API Key..."
                          value={storedApiKey}
                          onChange={(e) => saveApiKey(e.target.value)}
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                        />
                      </div>
                      <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                        <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <p className="text-[10px] text-amber-800">
                          Puoi ottenere una chiave gratuita su <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline font-bold">Google AI Studio</a>.
                        </p>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Stato Sistema</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-600">Connessione AI:</span>
                          <span className={`font-bold ${storedApiKey ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {storedApiKey ? 'Configurata' : 'Mancante'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-600">Storage Locale:</span>
                          <span className="text-emerald-600 font-bold">Attivo</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : activeTab === 'calculator' ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-xl mx-auto"
              >
                <div className="bg-white rounded-3xl border border-black/5 overflow-hidden shadow-sm">
                  <div className="p-6 border-b border-black/5 bg-indigo-50/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                        <BarChart3 className="text-white w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold tracking-tight">Position Size Calculator</h2>
                        <p className="text-xs text-indigo-700 font-medium">Gestione Rischio Maniacale (Regola 1-3%)</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-8 space-y-6">
                    <Calculator />
                  </div>
                </div>
              </motion.div>
            ) : activeTab === 'rules' ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold tracking-tight">
                    {selectedCategory === "All" ? "Trading Bible" : selectedCategory}
                    <span className="ml-2 text-sm font-mono text-gray-400 font-normal">({filteredTips.length})</span>
                  </h2>
                  <div className="flex bg-white p-1 rounded-lg border border-black/5">
                    <button 
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-gray-100 text-black' : 'text-gray-400'}`}
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setViewMode('list')}
                      className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-gray-100 text-black' : 'text-gray-400'}`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
                  <AnimatePresence mode="popLayout">
                    {filteredTips.map((tip) => (
                      <motion.div
                        layout
                        key={tip.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`group relative bg-white rounded-2xl border border-black/5 p-5 transition-all hover:shadow-xl hover:-translate-y-1 ${completedTips.includes(tip.id) ? 'border-emerald-200 bg-emerald-50/30' : ''}`}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <span className="text-[10px] font-mono font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                            #{String(tip.id).padStart(2, '0')}
                          </span>
                          <button 
                            onClick={() => toggleTip(tip.id)}
                            className={`transition-colors ${completedTips.includes(tip.id) ? 'text-emerald-500' : 'text-gray-200 hover:text-gray-400'}`}
                          >
                            {completedTips.includes(tip.id) ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                          </button>
                        </div>

                        <h3 className="font-bold text-lg mb-2 group-hover:text-emerald-600 transition-colors">{tip.title}</h3>
                        <p className="text-sm text-gray-600 leading-relaxed mb-4">{tip.description}</p>
                        
                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-black/5">
                          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest flex items-center gap-1">
                            {getCategoryIcon(tip.category)}
                            {tip.category}
                          </span>
                          <button 
                            onClick={() => setSelectedTip(tip)}
                            className="text-xs font-bold flex items-center gap-1 hover:gap-2 transition-all text-black"
                          >
                            Dettagli <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-3xl mx-auto"
              >
                <div className="bg-white rounded-3xl border border-black/5 overflow-hidden shadow-sm">
                  <div className="p-6 border-b border-black/5 bg-indigo-50/50">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                        <Zap className="text-white w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold tracking-tight">Crypto Signal Pro</h2>
                        <p className="text-xs text-indigo-700 font-medium">Professional Signal Generation Terminal</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-900 text-white rounded-2xl p-5 flex gap-4 items-center">
                        <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <Sparkles className="text-indigo-400 w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm">Signal Engine Online</h4>
                          <p className="text-[10px] text-slate-400 leading-relaxed">
                            Scansione multi-fattore attiva su Top 100 e Altcoin emergenti.
                          </p>
                        </div>
                      </div>

                      <div className="bg-white border border-black/5 rounded-2xl p-5 flex gap-4 items-center shadow-sm">
                        <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <TrendingUp className="text-emerald-500 w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <h4 className="font-bold text-xs text-slate-600 uppercase">Sentiment</h4>
                            <span className="text-[10px] font-bold text-emerald-600">74 (Greed)</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: '74%' }}
                              className="h-full bg-emerald-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex flex-col gap-2">
                        
                      <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-xs font-bold text-slate-700 uppercase tracking-widest">Modalità DATI REALI</div>
                            <div className="text-[11px] text-slate-500 mt-1">
                              Fonte: CoinGecko (universe/overview) + Bitget (candles). Se un provider è giù: <b>OFFLINE</b>, niente numeri inventati.
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${apiLive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                              {apiLive ? "LIVE" : "OFFLINE"}
                            </span>
                            <span className="text-[10px] text-slate-400">Ping: {apiLast}</span>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-col sm:flex-row gap-3">
                          <button
                            type="button"
                            onClick={generateRealReport}
                            disabled={realLoading}
                            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition disabled:opacity-60"
                          >
                            {realLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            Genera Report (Dati Reali)
                          </button>
                          <div className="text-[11px] text-slate-500 flex items-center">
                            Imposta <code className="mx-1 px-1 rounded bg-white border">VITE_API_BASE</code> nelle env del frontend su Render.
                          </div>
                        </div>

                        {realError && (
                          <div className="mt-3 flex items-start gap-2 p-3 bg-rose-50 border border-rose-100 rounded-xl">
                            <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5" />
                            <div className="text-[11px] text-rose-700">
                              <b>Errore:</b> {realError}
                            </div>
                          </div>
                        )}

                        {realReportMd && (
                          <div className="mt-4 p-4 bg-white rounded-2xl border border-slate-200">
                            <Markdown>{realReportMd}</Markdown>
                          </div>
                        )}
                      </div>

                      <div className="h-px bg-slate-100" />
<label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Generazione Segnali</label>
                        <form onSubmit={handleAiConsultation} className="relative">
                          <input 
                            type="text" 
                            placeholder="Clicca invia per il report giornaliero o chiedi una crypto specifica..." 
                            className="w-full pl-4 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-medium"
                            value={aiInput}
                            onChange={(e) => setAiInput(e.target.value)}
                          />
                          <button 
                            type="submit"
                            disabled={isAiLoading}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-slate-900 text-white rounded-xl hover:bg-indigo-600 transition-all disabled:opacity-50 disabled:hover:bg-slate-900"
                          >
                            {isAiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                          </button>
                        </form>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {["Top 10 Report", "Analisi BTC", "Scalping SOL", "Top 5 Evitare"].map(tag => (
                          <button 
                            key={tag}
                            onClick={() => { setAiInput(tag); handleAiConsultation(tag); }}
                            className="text-[10px] font-bold px-3 py-1.5 bg-white border border-slate-200 hover:border-indigo-500 rounded-full transition-all text-slate-600"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    <AnimatePresence mode="wait">
                      {aiResponse && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-8 bg-slate-900 text-slate-100 rounded-3xl border border-slate-800 relative shadow-2xl overflow-hidden"
                        >
                          <div className="p-6 overflow-x-auto">
                            <div className="markdown-body prose prose-invert prose-slate max-w-none text-slate-300 leading-relaxed">
                              <Markdown>{aiResponse}</Markdown>
                            </div>
                          </div>
                          <div className="bg-slate-800/50 px-6 py-3 border-t border-slate-800 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Signal Report Verified</span>
                            </div>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(aiResponse);
                                // Potresti aggiungere un toast qui
                              }}
                              className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-widest"
                            >
                              Copia Report
                            </button>
                          </div>
                          <div className="absolute top-4 right-6 px-3 py-1 bg-indigo-600 text-white text-[10px] font-bold rounded-full uppercase tracking-widest shadow-lg shadow-indigo-200">
                            Expert Selection
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {!aiResponse && !isAiLoading && (
                      <div className="py-12 text-center">
                        <Zap className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <p className="text-sm text-slate-400 font-medium">Avvia la scansione per generare i segnali operativi di oggi.</p>
                      </div>
                    )}

                    {isAiLoading && (
                      <div className="py-12 text-center space-y-4">
                        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto" />
                        <p className="text-sm text-indigo-600 font-bold animate-pulse">Scansione multi-timeframe in corso...</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-800 leading-relaxed">
                    <strong>Disclaimer Professionale:</strong> Crypto Signal Pro fornisce analisi basate su algoritmi e intelligenza artificiale. Non costituisce sollecitazione al pubblico risparmio. Il trading di criptovalute è un'attività ad alto rischio. Opera solo con capitale che puoi permetterti di perdere.
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </main>

      {/* Tip Detail Modal */}
      <AnimatePresence>
        {selectedTip && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTip(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded mb-2 inline-block">
                      TRUCCO #{selectedTip.id}
                    </span>
                    <h2 className="text-2xl font-bold tracking-tight">{selectedTip.title}</h2>
                  </div>
                  <button 
                    onClick={() => setSelectedTip(null)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-[11px] uppercase font-bold text-gray-400 tracking-widest mb-2">Concetto Base</h4>
                    <p className="text-gray-700 leading-relaxed">{selectedTip.description}</p>
                  </div>

                  {selectedTip.details && (
                    <div>
                      <h4 className="text-[11px] uppercase font-bold text-gray-400 tracking-widest mb-3">Approfondimento</h4>
                      <ul className="space-y-3">
                        {selectedTip.details.map((detail, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                            {detail}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="pt-6 border-t border-black/5 flex gap-3">
                    <button 
                      onClick={() => { toggleTip(selectedTip.id); setSelectedTip(null); }}
                      className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${completedTips.includes(selectedTip.id) ? 'bg-gray-100 text-gray-500' : 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 hover:bg-emerald-600'}`}
                    >
                      {completedTips.includes(selectedTip.id) ? 'Segna come non fatto' : 'Segna come completato'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-white border-t border-black/5 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-400 mb-4">
            &copy; 2026 Crypto Signal Pro. Professional Grade Trading Signals.
          </p>
          <div className="flex justify-center gap-6">
            <a href="https://www.metaskill.com" target="_blank" className="text-xs font-bold text-gray-400 hover:text-indigo-600 transition-colors">METASKILL</a>
            <a href="#" className="text-xs font-bold text-gray-400 hover:text-indigo-600 transition-colors">TERMINAL</a>
            <a href="#" className="text-xs font-bold text-gray-400 hover:text-indigo-600 transition-colors">LEGAL</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
