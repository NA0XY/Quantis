-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: users
CREATE TABLE users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username      TEXT UNIQUE NOT NULL,
  portfolio_usd     NUMERIC(20, 8) NOT NULL DEFAULT 10000.00,
  portfolio_assets  JSONB NOT NULL DEFAULT '{}',
  starting_balance  NUMERIC(20, 8) NOT NULL DEFAULT 10000.00,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for performance
CREATE INDEX idx_users_username ON users(username);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Public profiles (username, total_usd) are viewable, but ASSETS ARE PRIVATE
CREATE POLICY "Public profiles are viewable by everyone" 
ON users FOR SELECT 
USING (true);

-- To hide assets from public, we'd ideally use a View or Column-level security.
-- Since Supabase works best with table-level RLS, we'll keep this but ensure 
-- the application service layers filter out 'portfolio_assets' for non-owners.
-- Alternatively: CREATE POLICY "View assets only if owner" ON users FOR SELECT USING (auth.uid() = id);
-- But that hides the WHOLE row. So public SELECT using (true) is kept, but we handle column privacy in the API/service layer.

CREATE POLICY "Users can update their own row" ON users FOR UPDATE USING (auth.uid() = id);

-- Table: algorithms
CREATE TABLE algorithms (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL DEFAULT 'My Strategy',
  code        TEXT NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT FALSE,
  last_run_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_algorithms_user_id ON algorithms(user_id);
CREATE INDEX idx_algorithms_is_active ON algorithms(is_active);

ALTER TABLE algorithms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public algorithms are viewable by everyone" ON algorithms FOR SELECT USING (true);
CREATE POLICY "Users manage own algorithms" ON algorithms FOR ALL USING (auth.uid() = user_id);

-- Table: trade_history
CREATE TABLE trade_history (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol    TEXT NOT NULL,
  action    TEXT NOT NULL CHECK (action IN ('BUY','SELL')),
  price     NUMERIC(20, 8) NOT NULL,
  amount    NUMERIC(20, 8) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_trade_history_user_id ON trade_history(user_id);
CREATE INDEX idx_trade_history_timestamp ON trade_history(timestamp);

ALTER TABLE trade_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own trades" ON trade_history FOR SELECT USING (auth.uid() = user_id);

-- [NEW] Table: portfolio_snapshots (Hourly tracking)
CREATE TABLE portfolio_snapshots (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  equity      NUMERIC(20, 8) NOT NULL,
  timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_snapshots_user_timestamp ON portfolio_snapshots(user_id, timestamp);

ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Snapshots viewable by everyone" ON portfolio_snapshots FOR SELECT USING (true);

-- [NEW] Function: Automatic User Onboarding
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, username, starting_balance, portfolio_usd)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', 'trader_' || substr(NEW.id::text, 1, 8)), 10000.00, 10000.00);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auth.users
-- Note: This requires running as a superuser or via the Supabase UI SQL editor
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- [NEW] Function: Rollup Hourly Snapshots to Daily (Maintenance)
-- Keeps only the first snapshot of each day for records older than 24 hours
CREATE OR REPLACE FUNCTION rollup_portfolio_snapshots()
RETURNS void AS $$
BEGIN
  DELETE FROM portfolio_snapshots
  WHERE id IN (
    SELECT id
    FROM (
      SELECT id,
             ROW_NUMBER() OVER (PARTITION BY user_id, timestamp::date ORDER BY timestamp ASC) as rank
      FROM portfolio_snapshots
      WHERE timestamp < NOW() - INTERVAL '24 hours'
    ) sub
    WHERE rank > 1
  );
END;
$$ LANGUAGE plpgsql;

-- Enable publication for trade_history to support Realtime subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE trade_history;
