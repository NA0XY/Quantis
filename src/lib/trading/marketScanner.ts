import { MARKET_SYMBOLS, type MarketSymbol } from '@/lib/trading/markets';

const DEPLOYED_SIM_WORKER_URL = 'https://quantis-sim-engine.quantis.workers.dev';
const USER_SAFE_SIMULATION_ERROR = 'Simulation engine is temporarily unavailable. Please try again in a moment.';
const sensitiveSimulationErrorPatterns = [
  /NEXT_PUBLIC_WORKER_URL/i,
  /SIM_WORKER_URL/i,
  /wrangler/i,
  /workers\.dev/i,
  /simulation worker returned HTTP/i,
  /failed to fetch/i,
  /network/i,
];

export interface SimulationMetrics {
  final_balance: number;
  final_assets: Record<string, number>;
  max_drawdown: number;
  win_rate: number;
  total_trades: number;
  net_profit: number;
}

export interface WorkerTrade {
  time: number;
  timestamp?: string;
  symbol: string;
  action: 'BUY' | 'SELL';
  price: number;
  amount: number;
}

export interface WorkerSimulationResult {
  success: true;
  symbol: string;
  metrics: SimulationMetrics;
  trades: WorkerTrade[];
  logs: string[];
}

interface ScanOptions {
  code: string;
  workerUrl: string;
  limit?: number;
  batchSize?: number;
  onBatch?: (from: number, to: number, total: number) => void;
}

export function formatScannerMoney(value: number) {
  return value.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2
  });
}

export function resolveSimulationWorkerUrl(workerUrl?: string) {
  return workerUrl?.trim()
    || process.env.NEXT_PUBLIC_WORKER_URL?.trim()
    || DEPLOYED_SIM_WORKER_URL;
}

export function toUserSafeSimulationError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return sensitiveSimulationErrorPatterns.some((pattern) => pattern.test(message))
    ? USER_SAFE_SIMULATION_ERROR
    : message;
}

export async function runBacktestForSymbol(
  workerUrl: string,
  code: string,
  symbol: MarketSymbol,
  limit = 300
): Promise<WorkerSimulationResult> {
  const response = await fetch(workerUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code,
      symbol,
      interval: '1m',
      limit
    })
  });

  if (!response.ok) {
    throw new Error(`${symbol}: Simulation worker returned HTTP ${response.status}`);
  }

  const result = await response.json() as Partial<WorkerSimulationResult> & { error?: string };
  if (!result.success) {
    throw new Error(`${symbol}: ${result.error || 'Simulation failed'}`);
  }

  if (!result.metrics) {
    throw new Error(`${symbol}: Simulation returned no metrics`);
  }

  return {
    success: true,
    symbol,
    metrics: result.metrics,
    trades: Array.isArray(result.trades) ? result.trades : [],
    logs: Array.isArray(result.logs) ? result.logs : []
  };
}

export async function scanMarkets({
  code,
  workerUrl,
  limit = 300,
  batchSize = 6,
  onBatch
}: ScanOptions) {
  const settledResults: PromiseSettledResult<WorkerSimulationResult>[] = [];

  for (let index = 0; index < MARKET_SYMBOLS.length; index += batchSize) {
    const batch = MARKET_SYMBOLS.slice(index, index + batchSize);
    const from = index + 1;
    const to = Math.min(index + batch.length, MARKET_SYMBOLS.length);
    onBatch?.(from, to, MARKET_SYMBOLS.length);

    const batchResults = await Promise.allSettled(
      batch.map((symbol) => runBacktestForSymbol(workerUrl, code, symbol, limit))
    );
    settledResults.push(...batchResults);
  }

  const successful: WorkerSimulationResult[] = [];
  const failures: string[] = [];

  settledResults.forEach((result) => {
    if (result.status === 'fulfilled') {
      successful.push(result.value);
    } else {
      failures.push(result.reason instanceof Error ? result.reason.message : String(result.reason));
    }
  });

  if (successful.length === 0) {
    throw new Error(failures[0] || 'Every market scan failed.');
  }

  const ranked = successful.toSorted((a, b) => {
    const tradeActivityDelta = Number(b.metrics.total_trades > 0) - Number(a.metrics.total_trades > 0);
    if (tradeActivityDelta !== 0) return tradeActivityDelta;

    const pnlDelta = b.metrics.net_profit - a.metrics.net_profit;
    if (pnlDelta !== 0) return pnlDelta;
    return b.metrics.total_trades - a.metrics.total_trades;
  });

  return { best: ranked[0], ranked, failures };
}
