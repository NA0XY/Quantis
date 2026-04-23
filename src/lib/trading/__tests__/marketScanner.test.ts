import { afterEach, describe, expect, it, vi } from "vitest";
import {
  formatScannerMoney,
  resolveSimulationWorkerUrl,
  runBacktestForSymbol,
  scanMarkets,
  toUserSafeSimulationError,
  type WorkerSimulationResult,
} from "@/lib/trading/marketScanner";

function simulationResult(
  symbol: string,
  netProfit: number,
  totalTrades: number
): WorkerSimulationResult {
  return {
    success: true,
    symbol,
    metrics: {
      final_balance: 10000 + netProfit,
      final_assets: {},
      max_drawdown: 0,
      win_rate: 0,
      total_trades: totalTrades,
      net_profit: netProfit,
    },
    trades: Array.from({ length: totalTrades }, (_, index) => ({
      time: index,
      symbol,
      action: index % 2 === 0 ? "BUY" : "SELL",
      price: 100,
      amount: 1,
    })),
    logs: [],
  };
}

describe("marketScanner", () => {
  const originalWorkerUrl = process.env.NEXT_PUBLIC_WORKER_URL;

  afterEach(() => {
    vi.restoreAllMocks();
    process.env.NEXT_PUBLIC_WORKER_URL = originalWorkerUrl;
  });

  it("formats scanner money as USD with two decimal places", () => {
    expect(formatScannerMoney(1234.567)).toBe("$1,234.57");
    expect(formatScannerMoney(0)).toBe("$0.00");
  });

  it("preserves NaN formatting behavior for invalid numeric inputs", () => {
    expect(formatScannerMoney(Number.NaN)).toBe("$NaN");
  });

  it("prefers an explicitly provided worker URL", () => {
    process.env.NEXT_PUBLIC_WORKER_URL = "https://env-worker.test";

    expect(resolveSimulationWorkerUrl("https://explicit-worker.test")).toBe("https://explicit-worker.test");
  });

  it("falls back to NEXT_PUBLIC_WORKER_URL and then the deployed worker URL", () => {
    process.env.NEXT_PUBLIC_WORKER_URL = "https://env-worker.test";
    expect(resolveSimulationWorkerUrl()).toBe("https://env-worker.test");

    delete process.env.NEXT_PUBLIC_WORKER_URL;
    expect(resolveSimulationWorkerUrl()).toBe("https://quantis-sim-engine.quantis.workers.dev");
  });

  it("sanitizes infrastructure errors for UI display while preserving strategy errors", () => {
    expect(toUserSafeSimulationError("NEXT_PUBLIC_WORKER_URL is not set. Run wrangler dev.")).toBe(
      "Simulation engine is temporarily unavailable. Please try again in a moment."
    );
    expect(toUserSafeSimulationError("BTCUSDT: Simulation worker returned HTTP 500")).toBe(
      "Simulation engine is temporarily unavailable. Please try again in a moment."
    );
    expect(toUserSafeSimulationError("BTCUSDT: name 'price' is not defined")).toBe(
      "BTCUSDT: name 'price' is not defined"
    );
  });

  it("posts a symbol backtest request and normalizes missing arrays", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({
        success: true,
        metrics: simulationResult("BTCUSDT", 25, 0).metrics,
      }))
    );

    const result = await runBacktestForSymbol("https://worker.test", "print('x')", "BTCUSDT", 123);

    expect(fetchMock).toHaveBeenCalledWith("https://worker.test", expect.objectContaining({
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }));
    expect(JSON.parse(fetchMock.mock.calls[0][1]?.body as string)).toEqual({
      code: "print('x')",
      symbol: "BTCUSDT",
      interval: "1m",
      limit: 123,
    });
    expect(result.trades).toEqual([]);
    expect(result.logs).toEqual([]);
  });

  it("throws a useful error when the worker returns an HTTP failure", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("nope", { status: 503 }));

    await expect(runBacktestForSymbol("https://worker.test", "", "ETHUSDT")).rejects.toThrow(
      "ETHUSDT: Simulation worker returned HTTP 503"
    );
  });

  it("throws the worker error message when simulation fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ success: false, error: "bad strategy" }))
    );

    await expect(runBacktestForSymbol("https://worker.test", "", "SOLUSDT")).rejects.toThrow(
      "SOLUSDT: bad strategy"
    );
  });

  it("throws when a successful worker response omits metrics", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ success: true })));

    await expect(runBacktestForSymbol("https://worker.test", "", "BNBUSDT")).rejects.toThrow(
      "BNBUSDT: Simulation returned no metrics"
    );
  });

  it("ranks markets with actual trade activity ahead of no-trade high PnL results", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (_url, init) => {
      const body = JSON.parse(init?.body as string) as { symbol: string };
      const result = body.symbol === "ETHUSDT"
        ? simulationResult(body.symbol, 1, 2)
        : simulationResult(body.symbol, 500, 0);

      return new Response(JSON.stringify(result));
    });

    const onBatch = vi.fn();
    const result = await scanMarkets({
      code: "strategy",
      workerUrl: "https://worker.test",
      batchSize: 20,
      onBatch,
    });

    expect(result.best.symbol).toBe("ETHUSDT");
    expect(result.failures).toEqual([]);
    expect(onBatch).toHaveBeenCalledWith(1, 20, 41);
    expect(onBatch).toHaveBeenLastCalledWith(41, 41, 41);
  });

  it("collects individual market failures while returning successful rankings", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (_url, init) => {
      const body = JSON.parse(init?.body as string) as { symbol: string };
      if (body.symbol === "BTCUSDT") {
        return new Response("down", { status: 500 });
      }

      return new Response(JSON.stringify(simulationResult(body.symbol, 10, 1)));
    });

    const result = await scanMarkets({
      code: "strategy",
      workerUrl: "https://worker.test",
      batchSize: 41,
    });

    expect(result.ranked).toHaveLength(40);
    expect(result.failures).toEqual(["BTCUSDT: Simulation worker returned HTTP 500"]);
  });

  it("throws the first failure when every market scan fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("down", { status: 500 }));

    await expect(scanMarkets({
      code: "strategy",
      workerUrl: "https://worker.test",
      batchSize: 41,
    })).rejects.toThrow("BTCUSDT: Simulation worker returned HTTP 500");
  });
});
