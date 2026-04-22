import { createClient } from '../supabase/client';

export interface Strategy {
  id?: string;
  user_id?: string;
  name: string;
  code: string;
  is_active?: boolean;
  last_run_at?: string;
}

export interface StrategyStats {
  strategy: Strategy;
  username: string;
  portfolio_usd: number;
  starting_balance: number;
  roi: number;
  total_pnl: number;
  trade_count: number;
  buy_count: number;
  sell_count: number;
  success_rate: number;
  trades: {
    id: string;
    symbol: string;
    action: 'BUY' | 'SELL';
    price: number;
    amount: number;
    timestamp: string;
  }[];
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message?: unknown }).message);
  }
  return String(error);
}

export const strategyService = {
  async ensureUserProfile() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data: existing, error: readError } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (readError) throw new Error(getErrorMessage(readError));
    if (existing) return user;

    const username = user.user_metadata?.username || user.email?.split('@')[0] || `trader_${user.id.slice(0, 8)}`;
    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id: user.id,
        username,
        starting_balance: 10000,
        portfolio_usd: 10000,
        portfolio_assets: {}
      });

    if (insertError) throw new Error(getErrorMessage(insertError));
    return user;
  },

  async saveStrategy(strategy: Strategy) {
    const supabase = createClient();
    const user = await this.ensureUserProfile();

    if (strategy.id) {
      const payload = {
        name: strategy.name,
        code: strategy.code,
        is_active: strategy.is_active ?? false,
      };

      const { data, error } = await supabase
        .from('algorithms')
        .update(payload)
        .eq('id', strategy.id)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw new Error(getErrorMessage(error));
      return data;
    } else {
      const payload = {
        name: strategy.name,
        code: strategy.code,
        is_active: strategy.is_active ?? false,
        user_id: user.id,
      };

      const { data, error } = await supabase
        .from('algorithms')
        .insert(payload)
        .select()
        .single();
      
      if (error) throw new Error(getErrorMessage(error));
      return data;
    }
  },

  async getStrategies() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('algorithms')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async getStrategyById(id: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('algorithms')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async logTrades(trades: { symbol: string, action: 'BUY' | 'SELL', price: number, amount: number, timestamp?: string }[], algorithmId?: string | null) {
    if (trades.length === 0) return;

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const formattedTrades = trades.map(t => ({
      user_id: user.id,
      symbol: t.symbol,
      action: t.action,
      price: t.price,
      amount: t.amount,
      timestamp: t.timestamp || new Date().toISOString(),
      algorithm_id: algorithmId || null
    }));

    const { error } = await supabase
      .from('trade_history')
      .insert(formattedTrades);
    
    if (error) throw new Error(getErrorMessage(error));
  },

  async updatePortfolio(portfolio_usd: number, portfolio_assets: Record<string, number>) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('users')
      .update({
        portfolio_usd,
        portfolio_assets,
      })
      .eq('id', user.id);
    
    if (error) throw new Error(getErrorMessage(error));
  },

  async toggleStrategy(id: string, is_active: boolean) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('algorithms')
      .update({ is_active })
      .eq('id', id)
      .eq('user_id', user.id);
    
    if (error) throw error;
  },

  async deleteStrategy(id: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('algorithms')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    
    if (error) throw error;
  },

  async getStrategyStats(id: string): Promise<StrategyStats> {
    const supabase = createClient();

    const { data: strategy, error: strategyError } = await supabase
      .from('algorithms')
      .select('*')
      .eq('id', id)
      .single();

    if (strategyError) throw new Error(getErrorMessage(strategyError));

    const { data: owner, error: ownerError } = await supabase
      .from('users')
      .select('username, portfolio_usd, starting_balance')
      .eq('id', strategy.user_id)
      .single();

    if (ownerError) throw new Error(getErrorMessage(ownerError));

    const tradesQuery = supabase
      .from('trade_history')
      .select('id, symbol, action, price, amount, timestamp')
      .order('timestamp', { ascending: false })
      .limit(50);

    const { data: strategyTrades, error: strategyTradesError } = await tradesQuery.eq('algorithm_id', id);
    if (strategyTradesError) throw new Error(getErrorMessage(strategyTradesError));

    let trades = strategyTrades || [];

    if (trades.length === 0) {
      const { data: userTrades, error: userTradesError } = await supabase
        .from('trade_history')
        .select('id, symbol, action, price, amount, timestamp')
        .eq('user_id', strategy.user_id)
        .order('timestamp', { ascending: false })
        .limit(20);

      if (userTradesError) throw new Error(getErrorMessage(userTradesError));
      trades = userTrades || [];
    }

    const portfolioUsd = Number(owner.portfolio_usd || 0);
    const startingBalance = Number(owner.starting_balance || 10000);
    const totalPnl = portfolioUsd - startingBalance;
    const roi = startingBalance > 0 ? (totalPnl / startingBalance) * 100 : 0;
    const buyCount = trades.filter((trade) => trade.action === 'BUY').length;
    const sellCount = trades.filter((trade) => trade.action === 'SELL').length;
    const successRate = trades.length > 0 ? (sellCount / trades.length) * 100 : 0;

    return {
      strategy,
      username: owner.username,
      portfolio_usd: portfolioUsd,
      starting_balance: startingBalance,
      roi: Number(roi.toFixed(2)),
      total_pnl: Number(totalPnl.toFixed(2)),
      trade_count: trades.length,
      buy_count: buyCount,
      sell_count: sellCount,
      success_rate: Number(successRate.toFixed(1)),
      trades: trades.map((trade) => ({
        ...trade,
        price: Number(trade.price),
        amount: Number(trade.amount)
      }))
    };
  }
};
