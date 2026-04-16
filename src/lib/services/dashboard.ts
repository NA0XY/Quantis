import { createClient } from '../supabase/client';

export interface UserSnapshot {
  portfolio_usd: number;
  portfolio_assets: Record<string, number>;
  starting_balance: number;
}

export interface TradeRecord {
  id: string;
  symbol: string;
  action: 'BUY' | 'SELL';
  price: number;
  amount: number;
  timestamp: string;
}

export const dashboardService = {
  async getUserSnapshot(): Promise<UserSnapshot | null> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;

    const { data, error } = await supabase
      .from('users')
      .select('portfolio_usd, portfolio_assets, starting_balance')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching user snapshot:', error);
      return null;
    }

    return data as UserSnapshot;
  },

  async getTradeHistory(): Promise<TradeRecord[]> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return [];

    const { data, error } = await supabase
      .from('trade_history')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching trade history:', error);
      return [];
    }

    return data as TradeRecord[];
  },

  async getMarketPrices(symbols: string[]): Promise<Record<string, number>> {
    if (symbols.length === 0) return {};
    
    try {
      // Binance Ticker Price API
      // Format: https://api.binance.com/api/v3/ticker/price?symbols=["BTCUSDT","ETHUSDT"]
      const encodedSymbols = JSON.stringify(symbols);
      const url = `https://api.binance.com/api/v3/ticker/price?symbols=${encodedSymbols}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      const priceMap: Record<string, number> = {};
      
      if (Array.isArray(data)) {
        data.forEach((ticker: any) => {
          priceMap[ticker.symbol] = parseFloat(ticker.price);
        });
      } else if (data.symbol && data.price) {
        // Single symbol response
        priceMap[data.symbol] = parseFloat(data.price);
      }
      
      return priceMap;
    } catch (error) {
      console.error('Error fetching market prices:', error);
      return {};
    }
  },

  async getActiveBotsCount(): Promise<number> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return 0;

    const { count, error } = await supabase
      .from('algorithms')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (error) {
       console.error('Error fetching active bots count:', error);
       return 0;
    }

    return count || 0;
  }
};
