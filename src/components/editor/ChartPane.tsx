import React, { useRef, useState, useEffect } from 'react';
import { createChart, ColorType, CandlestickSeries, IChartApi, ISeriesApi, SeriesMarker, Time } from 'lightweight-charts';



const SYMBOLS = [
  "BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT", "ADAUSDT", "DOGEUSDT", "MATICUSDT", 
  "DOTUSDT", "TRXUSDT", "LTCUSDT", "SHIBUSDT", "AVAXUSDT", "LINKUSDT", "ATOMUSDT", "UNIUSDT", 
  "BCHUSDT", "XLMUSDT", "NEARUSDT", "FILUSDT", "ICPUSDT", "APTUSDT", "LDOUSDT", "HBARUSDT", 
  "ETCUSDT", "KASUSDT", "ARBUSDT", "OPUSDT", "MKRUSDT", "AAVEUSDT", "RNDRUSDT", "INJUSDT", 
  "STXUSDT", "SUIUSDT", "SEIUSDT", "TIAUSDT", "FETUSDT", "AGIXUSDT", "WLDUSDT", "ORDIUSDT", "PEPEUSDT"
];

interface Candle {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface ChartPaneProps {
  markers?: SeriesMarker<Time>[];
  onDataLoaded?: (data: unknown[]) => void;
  selectedSymbol?: string;
}


export function ChartPane({ markers = [], onDataLoaded, selectedSymbol }: ChartPaneProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick", Time> | null>(null);


  const [symbol, setSymbol] = useState(selectedSymbol || "BTCUSDT");
  const [isLoading, setIsLoading] = useState(true);
  const [priceInfo, setPriceInfo] = useState({ price: "0.00", change: "0.00" });

  useEffect(() => {
    if (selectedSymbol) setSymbol(selectedSymbol);
  }, [selectedSymbol]);

  // Handle Markers Update
  useEffect(() => {
    if (candleSeriesRef.current) {
      const series = candleSeriesRef.current as unknown as { setMarkers: (m: SeriesMarker<Time>[]) => void };
      series.setMarkers(markers);
    }
  }, [markers, candleSeriesRef]);




  // Chart Cleanup
  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        candleSeriesRef.current = null;
      }
    };
  }, []);

  // Main Chart Logic
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Initialize Chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0a0a0a' },
        textColor: '#ddd',
      },
      grid: {
        vertLines: { color: '#1a1a1a' },
        horzLines: { color: '#1a1a1a' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      timeScale: {
        borderColor: '#333',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#FF90E8', // Cyber Pink
      downColor: '#555',
      borderDownColor: '#555',
      borderUpColor: '#FF90E8',
      wickDownColor: '#555',
      wickUpColor: '#FF90E8',
    });

    if (markers.length > 0) {
      const series = candleSeries as unknown as { setMarkers: (m: SeriesMarker<Time>[]) => void };
      series.setMarkers(markers);
    }
    
    candleSeriesRef.current = candleSeries as unknown as ISeriesApi<"Candlestick", Time>;




    chartRef.current = chart;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1m&limit=200`);
        const result = await response.json();
        
        const formattedData: Candle[] = result.map((d: [number, string, string, string, string]) => ({
          time: d[0] / 1000,
          open: parseFloat(d[1]),
          high: parseFloat(d[2]),
          low: parseFloat(d[3]),
          close: parseFloat(d[4]),
        }));

        candleSeries.setData(formattedData);
        chart.timeScale().fitContent();

        // Feed data back to parent for backtesting
        if (onDataLoaded) {
          onDataLoaded(result);
        }

        // Set live price info
        const lastCandle = formattedData[formattedData.length - 1];
        const firstCandle = formattedData[0];
        const change = ((lastCandle.close - firstCandle.open) / firstCandle.open * 100).toFixed(2);
        
        setPriceInfo({
          price: lastCandle.close.toLocaleString(undefined, { minimumFractionDigits: 2 }),
          change: (parseFloat(change) >= 0 ? "+" : "") + change + "%"
        });

      } catch (error) {
        console.error("Failed to fetch Binance data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
    };
  }, [symbol, markers, onDataLoaded]);


  return (
    <div className="flex-[0.6] flex flex-col min-h-0 bg-[#0a0a0a] border-b-4 border-ink relative overflow-hidden">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-20 bg-ink/80 flex items-center justify-center backdrop-blur-sm">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent animate-spin mb-4" />
            <span className="font-mono text-primary font-black uppercase tracking-[0.3em] animate-pulse">Syncing Pipeline...</span>
          </div>
        </div>
      )}

      {/* Control Module */}
      <div className="absolute top-4 left-6 z-10 flex space-x-4">
        <select 
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="bg-primary text-ink border-4 border-ink shadow-[4px_4px_0_#111] px-4 py-2 font-black uppercase text-sm outline-none cursor-pointer hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all max-h-[200px]"
        >
          {SYMBOLS.map(s => (
            <option key={s} value={s}>{s.replace('USDT', ' / USDT')}</option>
          ))}
        </select>
        
        <div className="bg-ink/60 border-4 border-ink px-4 py-2 flex items-center space-x-3 shadow-[4px_4px_0_#111]">
          <span className="text-chalk/40 font-mono text-[10px] uppercase font-black tracking-widest">Interval</span>
          <span className="text-primary font-black text-sm">1m</span>
        </div>
      </div>

      {/* Data Module */}
      <div className="absolute top-4 right-6 z-10 flex items-center space-x-6 bg-ink/40 border-4 border-ink p-3 shadow-[4px_4px_0_#111] backdrop-blur-md">
        <div className="flex flex-col items-end">
          <span className="text-chalk/40 text-[10px] uppercase font-black tracking-widest">Live Feed</span>
          <span className="text-primary text-2xl font-black font-mono tracking-tighter">${priceInfo.price}</span>
        </div>
        <div className="flex flex-col items-end border-l-4 border-ink pl-4">
          <span className="text-chalk/40 text-[10px] uppercase font-black tracking-widest">24h Variance</span>
          <span className={`${parseFloat(priceInfo.change) >= 0 ? 'text-[#00c853]' : 'text-red-500'} text-2xl font-black font-mono tracking-tighter`}>
            {priceInfo.change}
          </span>
        </div>
      </div>

      <div className="flex-1 min-h-[400px]" ref={chartContainerRef} />
      
      {/* Background Grid */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
    </div>
  );
}
