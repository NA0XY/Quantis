import { createClient } from '../supabase/client';

export interface Strategy {
  id?: string;
  user_id?: string;
  name: string;
  code: string;
  is_active?: boolean;
  last_run_at?: string;
}

export const strategyService = {
  async saveStrategy(strategy: Strategy) {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("User not authenticated");

    const payload = {
      ...strategy,
      user_id: userData.user.id,
    };

    if (strategy.id) {
      const { data, error } = await supabase
        .from('algorithms')
        .update(payload)
        .eq('id', strategy.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('algorithms')
        .insert([payload])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
  },

  async getStrategies() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('algorithms')
      .select('*')
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

  async logTrades(trades: any[]) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const formattedTrades = trades.map(t => ({
      user_id: user.id,
      symbol: t.symbol,
      action: t.action,
      price: t.price,
      amount: t.amount,
      timestamp: t.timestamp || new Date().toISOString()
    }));

    const { error } = await supabase
      .from('trade_history')
      .insert(formattedTrades);
    
    if (error) console.error("Error logging trades:", error);
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
    
    if (error) console.error("Error updating portfolio:", error);
  },

  async toggleStrategy(id: string, is_active: boolean) {
    const supabase = createClient();
    const { error } = await supabase
      .from('algorithms')
      .update({ is_active })
      .eq('id', id);
    
    if (error) throw error;
  },

  async deleteStrategy(id: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from('algorithms')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};
