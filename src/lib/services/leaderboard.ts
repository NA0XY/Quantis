import { createClient } from '../supabase/client';

const supabase = createClient();

export type Timeframe = 'ALL' | '24H' | '7D';


export interface LeaderboardEntry {
  id: string;
  username: string;
  total_value: number;
  starting_balance: number;
  roi: number;
  has_active_bot: boolean;
  rank?: number;
}

interface Snapshot {
  user_id: string;
  equity: number;
}

export const leaderboardService = {
  async getLeaderboard(timeframe: Timeframe = 'ALL'): Promise<LeaderboardEntry[]> {
    // 1. Fetch all users (Exclude assets for privacy/RLS)
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, username, portfolio_usd, starting_balance');

    if (userError) throw userError;

    // 2. Fetch active bot status
    const { data: activeBots, error: botError } = await supabase
      .from('algorithms')
      .select('user_id')
      .eq('is_active', true);

    if (botError) throw botError;
    const activeUserIds = new Set(activeBots.map(b => b.user_id));

    // 3. Historical Data for ROI
    let snapshots: Snapshot[] = [];
    if (timeframe !== 'ALL') {
      const days = timeframe === '24H' ? 1 : 7;
      const dateLimit = new Date();
      dateLimit.setDate(dateLimit.getDate() - days);

      // Find the snapshot closest to the limit
      const { data: pastSnapshots, error: snapshotError } = await supabase
        .from('portfolio_snapshots')
        .select('user_id, equity')
        .gte('timestamp', dateLimit.toISOString())
        .order('timestamp', { ascending: true });
      
      if (snapshotError) throw snapshotError;
      snapshots = (pastSnapshots as unknown) as Snapshot[];

    }


    // 4. Calculate entries using fixed $10k base
    const FIXED_BASE = 10000;
    
    const entries: LeaderboardEntry[] = users.map(u => {
      const currentNetWorth = Number(u.portfolio_usd);
      
      let roi = 0;
      if (timeframe === 'ALL') {
        roi = ((currentNetWorth - FIXED_BASE) / FIXED_BASE) * 100;
      } else {
        // Find the earliest snapshot for this user in the period
        const historicalEquity = snapshots.find(s => s.user_id === u.id)?.equity || FIXED_BASE;
        roi = ((currentNetWorth - Number(historicalEquity)) / FIXED_BASE) * 100;
      }

      return {
        id: u.id,
        username: u.username,
        total_value: currentNetWorth,
        starting_balance: FIXED_BASE,
        roi: Number(roi.toFixed(2)),
        has_active_bot: activeUserIds.has(u.id)
      };
    });

    return entries.sort((a, b) => b.roi - a.roi).map((e, index) => ({ ...e, rank: index + 1 }));
  },

  async getMyRank(): Promise<LeaderboardEntry | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const leaderboard = await this.getLeaderboard('ALL');
    return leaderboard.find(e => e.id === user.id) || null;
  }
};
