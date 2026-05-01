interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  SIM_WORKER_URL: string;
  SIM_ENGINE?: {
    fetch(request: Request): Promise<Response>;
  };
  CRON_RUN_SECRET?: string;
}

interface ScheduledControllerLike {
  cron: string;
  scheduledTime: number;
}

interface ExecutionContextLike {
  waitUntil(promise: Promise<unknown>): void;
}

interface Algorithm {
  id: string;
  user_id: string;
  name: string;
  code: string;
  last_run_at: string | null;
}

interface WorkerTrade {
  time: number;
  timestamp?: string;
  symbol: string;
  action: 'BUY' | 'SELL';
  price: number;
  amount: number;
}

interface SimulationMetrics {
  final_balance: number;
  final_assets: Record<string, number>;
  total_trades: number;
  net_profit: number;
}

interface SimulationResult {
  success: boolean;
  symbol?: string;
  error?: string;
  trades?: WorkerTrade[];
  metrics?: SimulationMetrics;
}

interface SuccessfulSimulationResult {
  success: true;
  symbol: string;
  trades: WorkerTrade[];
  metrics: SimulationMetrics;
}

const MARKET_SYMBOLS = [
  "BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT", "ADAUSDT", "DOGEUSDT", "MATICUSDT",
  "DOTUSDT", "TRXUSDT", "LTCUSDT", "SHIBUSDT", "AVAXUSDT", "LINKUSDT", "ATOMUSDT", "UNIUSDT",
  "BCHUSDT", "XLMUSDT", "NEARUSDT", "FILUSDT", "ICPUSDT", "APTUSDT", "LDOUSDT", "HBARUSDT",
  "ETCUSDT", "KASUSDT", "ARBUSDT", "OPUSDT", "MKRUSDT", "AAVEUSDT", "RNDRUSDT", "INJUSDT",
  "STXUSDT", "SUIUSDT", "SEIUSDT", "TIAUSDT", "FETUSDT", "AGIXUSDT", "WLDUSDT", "ORDIUSDT", "PEPEUSDT"
] as const;

const CRON_PATTERN = "*/5 * * * *";
const CRON_INTERVAL_MS = 5 * 60 * 1000;
const MAX_ACTIVE_ALGORITHMS_PER_CYCLE = 3;

// Cloudflare Workers free plan safety budget:
// 50 external subrequests max per invocation.
// We reserve budget for Supabase reads/writes and keep headroom.
const MAX_EXTERNAL_SUBREQUESTS = 50;
const RESERVED_BASE_REQUESTS = 1; // getActiveAlgorithms
const RESERVED_REQUESTS_PER_ALGORITHM = 3; // trades insert + user patch + algo patch
const SUBREQUEST_HEADROOM = 4;
const MIN_MARKETS_PER_ALGORITHM = 6;

function hashSeed(input: string) {
  let hash = 0;
  for (let index = 0; index < input.length; index++) {
    hash = (hash * 31 + input.charCodeAt(index)) % 2147483647;
  }
  return hash;
}

function selectSymbolsForCycle(algorithmId: string, scheduledTimeMs: number, count: number) {
  const safeCount = Math.max(1, Math.min(MARKET_SYMBOLS.length, count));
  const cycle = Math.floor(scheduledTimeMs / CRON_INTERVAL_MS);
  const start = (hashSeed(algorithmId) + cycle * safeCount) % MARKET_SYMBOLS.length;
  const selected: string[] = [];

  for (let index = 0; index < safeCount; index++) {
    selected.push(MARKET_SYMBOLS[(start + index) % MARKET_SYMBOLS.length]);
  }

  return selected;
}

function supabaseHeaders(env: Env) {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY Worker secret");
  }

  return {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=representation"
  };
}

function toTimestampMs(trade: WorkerTrade) {
  if (trade.timestamp) {
    const parsed = Date.parse(trade.timestamp);
    if (Number.isFinite(parsed)) return parsed;
  }

  return trade.time > 100000000000 ? trade.time : trade.time * 1000;
}

async function supabaseRequest<T>(env: Env, path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      ...supabaseHeaders(env),
      ...(init.headers || {})
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase ${response.status}: ${body}`);
  }

  if (response.status === 204) return undefined as T;
  return await response.json() as T;
}

async function getActiveAlgorithms(env: Env) {
  return await supabaseRequest<Algorithm[]>(
    env,
    `algorithms?select=id,user_id,name,code,last_run_at&is_active=eq.true&order=last_run_at.asc.nullsfirst&limit=${MAX_ACTIVE_ALGORITHMS_PER_CYCLE}`
  );
}

async function runSimulation(env: Env, algorithm: Algorithm, symbol: string): Promise<SuccessfulSimulationResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(`${symbol}: simulation worker timed out after 30s`), 30_000);
  const request = new Request(env.SIM_WORKER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: controller.signal,
    body: JSON.stringify({
      code: algorithm.code,
      symbol,
      interval: "1m",
      limit: 300
    })
  });

  let response: Response;
  try {
    response = env.SIM_ENGINE
      ? await env.SIM_ENGINE.fetch(request)
      : await fetch(request);
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(`${symbol}: simulation worker timed out after 30s`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(`${symbol}: simulation worker returned HTTP ${response.status}`);
  }

  const result = await response.json() as SimulationResult;
  if (!result.success || !result.metrics) {
    throw new Error(`${symbol}: ${result.error || "simulation failed"}`);
  }

  return {
    success: true,
    symbol,
    metrics: result.metrics,
    trades: Array.isArray(result.trades) ? result.trades : []
  };
}

async function scanBestMarket(env: Env, algorithm: Algorithm, candidateSymbols: readonly string[]) {
  if (candidateSymbols.length === 0) {
    throw new Error(`No candidate markets provided for ${algorithm.id}`);
  }

  const results: SuccessfulSimulationResult[] = [];
  const batchSize = 6;

  for (let index = 0; index < candidateSymbols.length; index += batchSize) {
    const batch = candidateSymbols.slice(index, index + batchSize);
    const settled = await Promise.allSettled(batch.map((symbol) => runSimulation(env, algorithm, symbol)));

    for (const result of settled) {
      if (result.status === "fulfilled") {
        results.push(result.value);
      } else {
        console.warn(JSON.stringify({
          event: "market_scan_failure",
          algorithm_id: algorithm.id,
          error: result.reason instanceof Error ? result.reason.message : String(result.reason)
        }));
      }
    }
  }

  if (results.length === 0) {
    throw new Error(`No market simulations succeeded for ${algorithm.id}`);
  }

  return results.toSorted((a, b) => {
    const tradeActivityDelta = Number(b.metrics.total_trades > 0) - Number(a.metrics.total_trades > 0);
    if (tradeActivityDelta !== 0) return tradeActivityDelta;

    const pnlDelta = b.metrics.net_profit - a.metrics.net_profit;
    if (pnlDelta !== 0) return pnlDelta;
    return b.metrics.total_trades - a.metrics.total_trades;
  })[0];
}

async function persistExecution(
  env: Env,
  algorithm: Algorithm,
  result: SuccessfulSimulationResult,
  runStartedAt: string
) {
  const lastRunMs = algorithm.last_run_at ? Date.parse(algorithm.last_run_at) : 0;
  const newTrades = result.trades.filter((trade) => toTimestampMs(trade) > lastRunMs);

  if (newTrades.length > 0) {
    await supabaseRequest(env, "trade_history", {
      method: "POST",
      body: JSON.stringify(newTrades.map((trade) => ({
        user_id: algorithm.user_id,
        algorithm_id: algorithm.id,
        symbol: trade.symbol || result.symbol,
        action: trade.action,
        price: trade.price,
        amount: trade.amount,
        timestamp: trade.timestamp || new Date(toTimestampMs(trade)).toISOString()
      })))
    });

    await supabaseRequest(env, `users?id=eq.${algorithm.user_id}`, {
      method: "PATCH",
      body: JSON.stringify({
        portfolio_usd: result.metrics.final_balance,
        portfolio_assets: result.metrics.final_assets
      })
    });
  }

  await supabaseRequest(env, `algorithms?id=eq.${algorithm.id}`, {
    method: "PATCH",
    body: JSON.stringify({ last_run_at: runStartedAt })
  });

  return newTrades.length;
}

async function runBotCycle(env: Env) {
  const runStartedAt = new Date().toISOString();
  const runStartedAtMs = Date.parse(runStartedAt);
  const algorithms = await getActiveAlgorithms(env);
  const summaries: Array<{ algorithm_id: string; symbol?: string; trades: number; error?: string }> = [];
  const algorithmCount = algorithms.length;
  const maxSimulationCalls = Math.max(
    MIN_MARKETS_PER_ALGORITHM,
    MAX_EXTERNAL_SUBREQUESTS
      - RESERVED_BASE_REQUESTS
      - (algorithmCount * RESERVED_REQUESTS_PER_ALGORITHM)
      - SUBREQUEST_HEADROOM
  );
  const marketsPerAlgorithm = algorithmCount > 0
    ? Math.max(MIN_MARKETS_PER_ALGORITHM, Math.floor(maxSimulationCalls / algorithmCount))
    : MIN_MARKETS_PER_ALGORITHM;

  for (const algorithm of algorithms) {
    try {
      const candidateSymbols = selectSymbolsForCycle(algorithm.id, runStartedAtMs, marketsPerAlgorithm);
      const best = await scanBestMarket(env, algorithm, candidateSymbols);
      const trades = await persistExecution(env, algorithm, best, runStartedAt);
      summaries.push({ algorithm_id: algorithm.id, symbol: best.symbol, trades });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      summaries.push({ algorithm_id: algorithm.id, trades: 0, error: message });
      console.error(JSON.stringify({ event: "algorithm_cycle_failure", algorithm_id: algorithm.id, error: message }));
    }
  }

  console.log(JSON.stringify({
    event: "quantis_bot_cycle_complete",
    cron: CRON_PATTERN,
    markets_per_algorithm: marketsPerAlgorithm,
    max_simulation_calls: maxSimulationCalls,
    active_algorithms: algorithms.length,
    summaries
  }));

  return { active_algorithms: algorithms.length, summaries };
}

const worker = {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return Response.json({
        ok: true,
        worker: "quantis-bot-cron",
        schedule: CRON_PATTERN,
        bindings: {
          has_supabase_service_role_key: Boolean(env.SUPABASE_SERVICE_ROLE_KEY),
          has_cron_run_secret: Boolean(env.CRON_RUN_SECRET)
        }
      });
    }

    if (url.pathname === "/run" && request.method === "POST") {
      const expected = env.CRON_RUN_SECRET;
      const received = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");

      if (!expected || received !== expected) {
        return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
      }

      try {
        return Response.json({ ok: true, result: await runBotCycle(env) });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(JSON.stringify({ event: "manual_run_failure", error: message }));
        return Response.json({ ok: false, error: message }, { status: 500 });
      }
    }

    return Response.json({ ok: false, error: "Not found" }, { status: 404 });
  },

  async scheduled(controller: ScheduledControllerLike, env: Env, ctx: ExecutionContextLike) {
    console.log(JSON.stringify({
      event: "quantis_bot_cycle_started",
      cron: controller.cron,
      scheduled_time: new Date(controller.scheduledTime).toISOString()
    }));

    ctx.waitUntil(runBotCycle(env));
  }
};

export default worker;
