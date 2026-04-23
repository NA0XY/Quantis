import { afterEach, describe, expect, it, vi } from "vitest";
import { strategyService } from "@/lib/services/strategy";
import { createClient } from "@/lib/supabase/client";

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(),
}));

const createClientMock = vi.mocked(createClient);

interface QueryResult {
  data?: unknown;
  error?: unknown;
}

interface MockQuery {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  then: (
    resolve: (value: QueryResult) => unknown,
    reject: (reason: unknown) => unknown
  ) => Promise<unknown>;
}

function createQuery(result: QueryResult = { data: null, error: null }): MockQuery {
  const query = {} as MockQuery;

  Object.assign(query, {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    order: vi.fn(() => query),
    limit: vi.fn(() => query),
    update: vi.fn(() => query),
    insert: vi.fn(() => query),
    delete: vi.fn(() => query),
    maybeSingle: vi.fn(async () => result),
    single: vi.fn(async () => result),
    then: (resolve: (value: QueryResult) => unknown, reject: (reason: unknown) => unknown) =>
      Promise.resolve(result).then(resolve, reject),
  });

  return query;
}

function mockSupabase({
  user = { id: "user-1", email: "trader@example.com", user_metadata: { username: "ace" } },
  queries = [],
}: {
  user?: unknown;
  queries?: Array<ReturnType<typeof createQuery>>;
} = {}) {
  const from = vi.fn(() => {
    const query = queries.shift();
    if (!query) throw new Error("Unexpected Supabase query");
    return query;
  });

  createClientMock.mockReturnValue({
    auth: {
      getUser: vi.fn(async () => ({ data: { user } })),
    },
    from,
  } as never);

  return { from };
}

describe("strategyService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("throws when ensureUserProfile is called without an authenticated user", async () => {
    mockSupabase({ user: null });

    await expect(strategyService.ensureUserProfile()).rejects.toThrow("User not authenticated");
  });

  it("inserts a missing user profile with portfolio defaults", async () => {
    const readProfile = createQuery({ data: null, error: null });
    const insertProfile = createQuery({ data: null, error: null });
    mockSupabase({ queries: [readProfile, insertProfile] });

    await expect(strategyService.ensureUserProfile()).resolves.toMatchObject({ id: "user-1" });

    expect(insertProfile.insert).toHaveBeenCalledWith({
      id: "user-1",
      username: "ace",
      starting_balance: 10000,
      portfolio_usd: 10000,
      portfolio_assets: {},
    });
  });

  it("updates an existing strategy for the authenticated owner", async () => {
    const readProfile = createQuery({ data: { id: "user-1" }, error: null });
    const updateStrategy = createQuery({ data: { id: "strategy-1" }, error: null });
    mockSupabase({ queries: [readProfile, updateStrategy] });

    const result = await strategyService.saveStrategy({
      id: "strategy-1",
      name: "Momentum",
      code: "def on_candle(): pass",
      is_active: true,
    });

    expect(updateStrategy.update).toHaveBeenCalledWith({
      name: "Momentum",
      code: "def on_candle(): pass",
      is_active: true,
    });
    expect(updateStrategy.eq).toHaveBeenCalledWith("id", "strategy-1");
    expect(updateStrategy.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(result).toEqual({ id: "strategy-1" });
  });

  it("creates a new strategy with the authenticated user id", async () => {
    const readProfile = createQuery({ data: { id: "user-1" }, error: null });
    const insertStrategy = createQuery({ data: { id: "strategy-2" }, error: null });
    mockSupabase({ queries: [readProfile, insertStrategy] });

    await strategyService.saveStrategy({
      name: "Breakout",
      code: "def on_candle(): pass",
    });

    expect(insertStrategy.insert).toHaveBeenCalledWith({
      name: "Breakout",
      code: "def on_candle(): pass",
      is_active: false,
      user_id: "user-1",
    });
  });

  it("filters strategy lists by the authenticated user", async () => {
    const getStrategies = createQuery({ data: [{ id: "strategy-1" }], error: null });
    mockSupabase({ queries: [getStrategies] });

    await expect(strategyService.getStrategies()).resolves.toEqual([{ id: "strategy-1" }]);

    expect(getStrategies.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(getStrategies.order).toHaveBeenCalledWith("created_at", { ascending: false });
  });

  it("logs formatted trades with the current user and strategy id", async () => {
    const insertTrades = createQuery({ data: null, error: null });
    mockSupabase({ queries: [insertTrades] });

    await strategyService.logTrades([
      {
        symbol: "BTCUSDT",
        action: "BUY",
        price: 100,
        amount: 0.5,
        timestamp: "2026-04-23T00:00:00.000Z",
      },
    ], "strategy-1");

    expect(insertTrades.insert).toHaveBeenCalledWith([
      {
        user_id: "user-1",
        symbol: "BTCUSDT",
        action: "BUY",
        price: 100,
        amount: 0.5,
        timestamp: "2026-04-23T00:00:00.000Z",
        algorithm_id: "strategy-1",
      },
    ]);
  });

  it("computes strategy stats and converts numeric trade fields", async () => {
    const strategy = createQuery({
      data: { id: "strategy-1", user_id: "user-1", name: "Momentum", code: "code" },
      error: null,
    });
    const owner = createQuery({
      data: { username: "ace", portfolio_usd: "10500.45", starting_balance: "10000" },
      error: null,
    });
    const trades = createQuery({
      data: [
        { id: "t1", symbol: "BTCUSDT", action: "BUY", price: "100", amount: "0.1", timestamp: "2026-04-23T00:00:00.000Z" },
        { id: "t2", symbol: "BTCUSDT", action: "SELL", price: "110", amount: "0.1", timestamp: "2026-04-23T00:01:00.000Z" },
      ],
      error: null,
    });
    mockSupabase({ queries: [strategy, owner, trades] });

    const stats = await strategyService.getStrategyStats("strategy-1");

    expect(stats.roi).toBe(5);
    expect(stats.total_pnl).toBe(500.45);
    expect(stats.trade_count).toBe(2);
    expect(stats.buy_count).toBe(1);
    expect(stats.sell_count).toBe(1);
    expect(stats.success_rate).toBe(50);
    expect(stats.trades[0]).toEqual(expect.objectContaining({ price: 100, amount: 0.1 }));
  });
});
