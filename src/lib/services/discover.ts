import { createClient } from '../supabase/client';

const supabase = createClient();

export interface PublicStrategy {
  id: string;
  name: string;
  username: string;
  roi_all_time: number;
  is_active: boolean;
  user_id: string;
}

export const discoverService = {
  async getTrendingStrategies(): Promise<PublicStrategy[]> {
    // 1. Fetch all users and their basic info
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, username, starting_balance, portfolio_usd');

    if (userError) throw userError;

    // 2. Fetch all active algorithms
    const { data: algos, error: algoError } = await supabase
      .from('algorithms')
      .select('id, name, user_id, is_active')
      .eq('is_active', true)
      .limit(20);

    if (algoError) throw algoError;

    // 3. Map algorithms to their owners and calculate proxy ROI using fixed $10k base
    const userMap = new Map(users.map(u => [u.id, u]));
    const FIXED_BASE = 10000;
    
    return algos.map(a => {
      const owner = userMap.get(a.user_id);
      const roi = owner ? ((Number(owner.portfolio_usd) - FIXED_BASE) / FIXED_BASE) * 100 : 0;
      
      return {
        id: a.id,
        name: a.name,
        username: owner?.username || 'unknown',
        roi_all_time: Number(roi.toFixed(2)),
        is_active: a.is_active,
        user_id: a.user_id
      };
    }).sort((a, b) => b.roi_all_time - a.roi_all_time);
  },

  async getMarketStats() {
    // Fetch live data from Binance for trending assets
    try {
      const response = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbols=["BTCUSDT","ETHUSDT","SOLUSDT","BNBUSDT","DOGEUSDT"]');
      const data = await response.json();
      return data;
    } catch (err) {
      console.error("Market fetch failed:", err);
      return [];
    }
  }
};
