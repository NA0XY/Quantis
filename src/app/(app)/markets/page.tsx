"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  createChart,
  ColorType,
  CandlestickSeries,
  IChartApi,
  ISeriesApi,
  Time,
} from 'lightweight-charts';
import { Activity, BarChart3, Loader2, Radio, Search, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

const SYMBOLS = [
  "BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT", "ADAUSDT", "DOGEUSDT", "MATICUSDT",
  "DOTUSDT", "TRXUSDT", "LTCUSDT", "SHIBUSDT", "AVAXUSDT", "LINKUSDT", "ATOMUSDT", "UNIUSDT",
  "BCHUSDT", "XLMUSDT", "NEARUSDT", "FILUSDT", "ICPUSDT", "APTUSDT", "HBARUSDT", "ETCUSDT",
  "ARBUSDT", "OPUSDT", "MKRUSDT", "AAVEUSDT", "INJUSDT", "SUIUSDT", "SEIUSDT", "TIAUSDT",
  "WLDUSDT", "ORDIUSDT", "PEPEUSDT"
];

interface TickerState {
  symbol: string;
  lastPrice: number;
  priceChangePercent: number;
  quoteVolume: number;
  highPrice: number;
  lowPrice: number;
}

interface Candle {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
}

function formatCompact(value: number) {
  return Intl.NumberFormat(undefined, {
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPrice(value: number) {
  if (value < 0.01) return value.toFixed(8);
  if (value < 1) return value.toFixed(5);
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function MarketsPage() {
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT');
  const [tickers, setTickers] = useState<Record<string, TickerState>>({});
  const [query, setQuery] = useState('');
  const [chartLoading, setChartLoading] = useState(true);
  const [isTickerLive, setIsTickerLive] = useState(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick", Time> | null>(null);

  const selectedTicker = tickers[selectedSymbol];
  const filteredSymbols = useMemo(() => {
    const normalizedQuery = query.trim().toUpperCase();
    return SYMBOLS.filter((symbol) => symbol.includes(normalizedQuery));
  }, [query]);

  useEffect(() => {
    let cancelled = false;

    const loadInitialTickers = async () => {
      try {
        const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(SYMBOLS))}`);
        const data = await response.json();
        if (cancelled || !Array.isArray(data)) return;

        const nextTickers: Record<string, TickerState> = {};
        data.forEach((ticker: {
          symbol: string;
          lastPrice: string;
          priceChangePercent: string;
          quoteVolume: string;
          highPrice: string;
          lowPrice: string;
        }) => {
          nextTickers[ticker.symbol] = {
            symbol: ticker.symbol,
            lastPrice: Number(ticker.lastPrice),
            priceChangePercent: Number(ticker.priceChangePercent),
            quoteVolume: Number(ticker.quoteVolume),
            highPrice: Number(ticker.highPrice),
            lowPrice: Number(ticker.lowPrice),
          };
        });

        setTickers(nextTickers);
      } catch (error) {
        console.error('Failed to fetch initial market data:', error);
      }
    };

    loadInitialTickers();

    const streams = SYMBOLS.map((symbol) => `${symbol.toLowerCase()}@ticker`).join('/');
    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleReconnect = (attempt: number) => {
      if (cancelled) return;
      const delay = Math.min(30_000, 1000 * 2 ** attempt);
      reconnectTimer = setTimeout(() => connectTickerStream(attempt + 1), delay);
    };

    const connectTickerStream = (attempt = 0) => {
      if (cancelled) return;

      socket = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);

      socket.onopen = () => setIsTickerLive(true);
      socket.onclose = () => {
        setIsTickerLive(false);
        scheduleReconnect(attempt);
      };
      socket.onerror = () => {
        setIsTickerLive(false);
        socket?.close();
      };
      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const ticker = payload.data;
          if (!ticker?.s) return;

          setTickers((current) => ({
            ...current,
            [ticker.s]: {
              symbol: ticker.s,
              lastPrice: Number(ticker.c),
              priceChangePercent: Number(ticker.P),
              quoteVolume: Number(ticker.q),
              highPrice: Number(ticker.h),
              lowPrice: Number(ticker.l),
            }
          }));
        } catch (error) {
          console.error('Failed to parse ticker stream message:', error);
        }
      };
    };

    connectTickerStream();

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, []);

  useEffect(() => {
    if (!chartContainerRef.current) return;
    let disposed = false;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0a0a0a' },
        textColor: '#f8f8f8',
      },
      grid: {
        vertLines: { color: '#1f1f1f' },
        horzLines: { color: '#1f1f1f' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 520,
      timeScale: {
        borderColor: '#333',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: '#333',
      },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#FF90E8',
      downColor: '#5d6470',
      borderUpColor: '#FF90E8',
      borderDownColor: '#5d6470',
      wickUpColor: '#FF90E8',
      wickDownColor: '#5d6470',
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const loadCandles = async () => {
      setChartLoading(true);
      try {
        const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${selectedSymbol}&interval=1m&limit=240`);
        const data = await response.json();
        if (disposed || !Array.isArray(data)) return;

        const candles: Candle[] = data.map((candle: [number, string, string, string, string]) => ({
          time: (candle[0] / 1000) as Time,
          open: Number(candle[1]),
          high: Number(candle[2]),
          low: Number(candle[3]),
          close: Number(candle[4]),
        }));

        series.setData(candles);
        chart.timeScale().fitContent();
      } catch (error) {
        if (!disposed) console.error('Failed to load candles:', error);
      } finally {
        if (!disposed) setChartLoading(false);
      }
    };

    loadCandles();

    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleReconnect = (attempt: number) => {
      if (disposed) return;
      const delay = Math.min(30_000, 1000 * 2 ** attempt);
      reconnectTimer = setTimeout(() => connectCandleStream(attempt + 1), delay);
    };

    const connectCandleStream = (attempt = 0) => {
      if (disposed) return;

      socket = new WebSocket(`wss://stream.binance.com:9443/ws/${selectedSymbol.toLowerCase()}@kline_1m`);
      socket.onclose = () => scheduleReconnect(attempt);
      socket.onerror = () => socket?.close();
      socket.onmessage = (event) => {
        if (disposed || !seriesRef.current) return;

        try {
          const payload = JSON.parse(event.data);
          const candle = payload.k;
          if (!candle) return;

          seriesRef.current.update({
            time: (candle.t / 1000) as Time,
            open: Number(candle.o),
            high: Number(candle.h),
            low: Number(candle.l),
            close: Number(candle.c),
          });
        } catch (error) {
          console.error('Failed to parse candle stream message:', error);
        }
      };
    };

    connectCandleStream();

    const handleResize = () => {
      if (!disposed && chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      disposed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      resizeObserver.disconnect();
      socket?.close();
      chartRef.current = null;
      seriesRef.current = null;
      chart.remove();
    };
  }, [selectedSymbol]);

  return (
    <div className="min-h-screen bg-sky p-8 lg:p-12 overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-10">
        <header className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-8 items-end">
          <div>
            <Badge className="mb-5 bg-primary text-ink border-2 border-ink shadow-[4px_4px_0_#111] uppercase tracking-widest font-black">
              Realtime Market Radar
            </Badge>
            <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-[0.82] text-ink">
              Live Coin <span className="text-primary [text-shadow:5px_5px_0_#111]">Charts.</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-ink/60 font-bold max-w-2xl">
              Binance tickers stream directly into Quantis. Pick a symbol, inspect the 1-minute tape, and route the same asset into your strategy.
            </p>
          </div>

          <div className="bg-ink text-chalk border-8 border-ink shadow-[12px_12px_0_#111] p-6">
            <div className="flex items-center gap-3 mb-4">
              <Radio className={`w-5 h-5 ${isTickerLive ? 'text-primary animate-pulse' : 'text-chalk/30'}`} />
              <span className="font-black uppercase tracking-widest text-sm">{isTickerLive ? 'Ticker Stream Live' : 'Connecting Stream'}</span>
            </div>
            <div className="text-4xl font-black text-primary">{Object.keys(tickers).length}/{SYMBOLS.length}</div>
            <p className="text-xs font-mono text-chalk/40 uppercase tracking-widest mt-2">Tracked Binance USDT pairs</p>
          </div>
        </header>

        <section className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_390px] gap-8">
          <div className="bg-[#0a0a0a] border-8 border-ink shadow-[14px_14px_0_#111] overflow-hidden">
            <div className="bg-chalk border-b-8 border-ink p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <BarChart3 className="text-primary w-7 h-7" />
                  <h2 className="text-4xl font-black uppercase tracking-tighter text-ink">{selectedSymbol.replace('USDT', '')} / USDT</h2>
                </div>
                <p className="font-mono text-xs uppercase tracking-widest font-black text-ink/40 mt-1">1m candlestick stream</p>
              </div>

              {selectedTicker && (
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-[10px] font-black uppercase tracking-widest text-ink/40">Last Price</div>
                    <div className="text-3xl font-black text-ink">${formatPrice(selectedTicker.lastPrice)}</div>
                  </div>
                  <div className={`border-4 border-ink px-4 py-2 shadow-[4px_4px_0_#111] font-black ${
                    selectedTicker.priceChangePercent >= 0 ? 'bg-primary text-ink' : 'bg-[#FF5C5C] text-chalk'
                  }`}>
                    {selectedTicker.priceChangePercent >= 0 ? '+' : ''}{selectedTicker.priceChangePercent.toFixed(2)}%
                  </div>
                </div>
              )}
            </div>

            <div className="relative min-h-[520px]">
              {chartLoading && (
                <div className="absolute inset-0 z-10 bg-ink/80 backdrop-blur-sm flex items-center justify-center">
                  <div className="flex flex-col items-center">
                    <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                    <span className="font-black uppercase tracking-[0.3em] text-primary text-xs">Loading candles</span>
                  </div>
                </div>
              )}
              <div ref={chartContainerRef} className="h-[520px]" />
            </div>
          </div>

          <aside className="space-y-5">
            <div className="bg-chalk border-4 border-ink shadow-[8px_8px_0_#111] p-4">
              <label className="flex items-center gap-3">
                <Search className="w-5 h-5 text-ink/40" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search symbol"
                  className="w-full bg-transparent outline-none font-black uppercase tracking-widest text-sm placeholder:text-ink/30"
                />
              </label>
            </div>

            <div className="max-h-[620px] overflow-y-auto pr-2 space-y-4 custom-scrollbar">
              {filteredSymbols.map((symbol) => {
                const ticker = tickers[symbol];
                const isSelected = symbol === selectedSymbol;
                const isUp = (ticker?.priceChangePercent || 0) >= 0;

                return (
                  <button
                    key={symbol}
                    type="button"
                    onClick={() => setSelectedSymbol(symbol)}
                    className={`w-full text-left border-4 border-ink p-4 shadow-[6px_6px_0_#111] transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none ${
                      isSelected ? 'bg-primary' : 'bg-chalk hover:bg-sky'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-xl font-black uppercase tracking-tighter text-ink">
                          {symbol.replace('USDT', '')}<span className="text-xs text-ink/40 ml-1">/USDT</span>
                        </div>
                        <div className="font-mono text-xs font-black text-ink/40 uppercase mt-1">
                          Vol {ticker ? formatCompact(ticker.quoteVolume) : 'syncing'}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-mono font-black text-ink">
                          {ticker ? `$${formatPrice(ticker.lastPrice)}` : '...'}
                        </div>
                        <div className={`font-black text-xs ${isUp ? 'text-[#00c853]' : 'text-[#FF5C5C]'}`}>
                          {ticker ? `${isUp ? '+' : ''}${ticker.priceChangePercent.toFixed(2)}%` : '--'}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-chalk border-8 border-ink p-6 shadow-[10px_10px_0_#111]">
            <div className="flex items-center gap-3 text-ink/40 mb-2">
              <Activity className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-widest">24h High</span>
            </div>
            <div className="text-4xl font-black text-ink">{selectedTicker ? `$${formatPrice(selectedTicker.highPrice)}` : '--'}</div>
          </div>

          <div className="bg-primary border-8 border-ink p-6 shadow-[10px_10px_0_#111]">
            <div className="flex items-center gap-3 text-ink/40 mb-2">
              <Zap className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-widest">24h Volume</span>
            </div>
            <div className="text-4xl font-black text-ink">{selectedTicker ? formatCompact(selectedTicker.quoteVolume) : '--'}</div>
          </div>

          <div className="bg-ink border-8 border-ink p-6 shadow-[10px_10px_0_#111]">
            <div className="flex items-center gap-3 text-primary/40 mb-2">
              <BarChart3 className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-widest">24h Low</span>
            </div>
            <div className="text-4xl font-black text-primary">{selectedTicker ? `$${formatPrice(selectedTicker.lowPrice)}` : '--'}</div>
          </div>
        </section>
      </div>
    </div>
  );
}
