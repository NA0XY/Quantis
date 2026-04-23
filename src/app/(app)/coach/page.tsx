import { AIStrategyCoach, type PortfolioSnapshot } from "@/components/ai/AIStrategyCoach";
import { StrategyGeneratorEditorBridge } from "@/components/ai/StrategyGenerator";
import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/server";

type CoachModeParam = "chat" | "analyze" | "recommend";

interface CoachPageProps {
  searchParams?: Promise<{
    strategyId?: string;
    mode?: string;
  }>;
}

interface UserSnapshotRow {
  portfolio_usd: number | string | null;
  starting_balance: number | string | null;
}

interface TradeRow {
  action: "BUY" | "SELL";
  price: number | string;
  amount: number | string;
  timestamp: string;
}

function toNumber(value: number | string | null | undefined, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function formatUsd(value: number) {
  return value.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

function buildPortfolioSnapshot(
  userSnapshot: UserSnapshotRow | null,
  trades: TradeRow[],
  strategyName?: string
): PortfolioSnapshot | undefined {
  if (!userSnapshot) return undefined;

  const portfolioUsd = toNumber(userSnapshot.portfolio_usd, 10000);
  const startingBalance = toNumber(userSnapshot.starting_balance, 10000);
  const pnl = portfolioUsd - startingBalance;
  const totalReturn = startingBalance > 0 ? (pnl / startingBalance) * 100 : 0;
  const sellTrades = trades.filter((trade) => trade.action === "SELL").length;
  const totalTrades = trades.length;
  const averageTrade = totalTrades > 0 ? pnl / totalTrades : 0;

  return {
    strategyName: strategyName ?? "Latest active strategy",
    totalReturn: formatPercent(totalReturn),
    winRate: totalTrades > 0 ? formatPercent((sellTrades / totalTrades) * 100) : "0.00%",
    totalTrades,
    avgProfitPerTrade: formatUsd(averageTrade),
    period: trades.at(-1)?.timestamp
      ? `${new Date(trades.at(-1)?.timestamp ?? "").toLocaleDateString()} - Now`
      : "All time",
  };
}

function getInitialMode(mode?: string): CoachModeParam {
  return mode === "analyze" || mode === "recommend" ? mode : "chat";
}

export default async function CoachPage({ searchParams }: CoachPageProps) {
  const params = searchParams ? await searchParams : {};
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const latestStrategyPromise = user
    ? params.strategyId
      ? supabase
        .from("algorithms")
        .select("id, name, code")
        .eq("user_id", user.id)
        .eq("id", params.strategyId)
        .maybeSingle()
      : supabase
      .from("algorithms")
      .select("id, name, code")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("last_run_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    : Promise.resolve({ data: null });

  const userSnapshotPromise = user
    ? supabase
      .from("users")
      .select("portfolio_usd, starting_balance")
      .eq("id", user.id)
      .maybeSingle()
    : Promise.resolve({ data: null });

  const tradesPromise = user
    ? supabase
      .from("trade_history")
      .select("action, price, amount, timestamp")
      .eq("user_id", user.id)
      .order("timestamp", { ascending: false })
      .limit(100)
    : Promise.resolve({ data: [] });

  const [latestStrategyResult, userSnapshotResult, tradesResult] = await Promise.all([
    latestStrategyPromise,
    userSnapshotPromise,
    tradesPromise,
  ]);

  const latestStrategy = latestStrategyResult.data;
  const userSnapshot = userSnapshotResult.data as UserSnapshotRow | null;
  const trades = (tradesResult.data ?? []) as TradeRow[];
  const portfolioSnapshot = buildPortfolioSnapshot(userSnapshot, trades, latestStrategy?.name);

  return (
    <div className="min-h-screen bg-sky p-6 md:p-10 lg:p-14">
      <div className="max-w-5xl mx-auto space-y-8">
        <header>
          <Badge className="mb-4 bg-ink text-primary border-2 border-primary shadow-[4px_4px_0_#000] uppercase tracking-widest font-black">
            AI-Powered
          </Badge>
          <h1 className="text-[clamp(3rem,6vw,5rem)] font-black text-ink uppercase tracking-tighter leading-none">
            Strategy Coach
          </h1>
          <div className="mt-2 h-3 w-48 bg-primary border-2 border-ink" />
          <p className="mt-4 text-ink/60 font-bold max-w-xl">
            Get AI-powered analysis, recommendations, and coaching for your algorithmic trading strategies.
          </p>
        </header>

        <AIStrategyCoach
          portfolioData={portfolioSnapshot}
          defaultStrategy={latestStrategy?.code ?? undefined}
          defaultStrategyName={latestStrategy?.name ?? undefined}
          initialTab={getInitialMode(params.mode)}
        />

        <section className="pt-8">
          <div className="mb-6">
            <Badge className="mb-4 bg-primary text-ink border-2 border-ink shadow-[4px_4px_0_#000] uppercase tracking-widest font-black">
              Generator
            </Badge>
            <h2 className="text-[clamp(2.5rem,5vw,4rem)] font-black text-ink uppercase tracking-tighter leading-none">
              AI Strategy Generator
            </h2>
            <div className="mt-2 h-3 w-56 bg-primary border-2 border-ink" />
            <p className="mt-4 text-ink/60 font-bold max-w-2xl">
              Turn a plain-English trading idea into runnable Quantis Python code, then inspect and edit it before saving or activating.
            </p>
          </div>

          <StrategyGeneratorEditorBridge />
        </section>
      </div>
    </div>
  );
}
