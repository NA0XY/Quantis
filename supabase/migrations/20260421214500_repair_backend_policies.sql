CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, username, starting_balance, portfolio_usd)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    10000.00,
    10000.00
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP POLICY IF EXISTS "Users can read their own row" ON public.users;
DROP POLICY IF EXISTS "Users can update their own row" ON public.users;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;

CREATE POLICY "Public profiles are viewable by everyone"
  ON public.users
  FOR SELECT
  USING (true);

CREATE POLICY "Users can read their own row"
  ON public.users
  FOR SELECT
  USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users can update their own row"
  ON public.users
  FOR UPDATE
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users manage own algorithms" ON public.algorithms;
DROP POLICY IF EXISTS "Public algorithms are viewable by everyone" ON public.algorithms;

CREATE POLICY "Public algorithms are viewable by everyone"
  ON public.algorithms
  FOR SELECT
  USING (true);

CREATE POLICY "Users manage own algorithms"
  ON public.algorithms
  FOR ALL
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users read own trades" ON public.trade_history;
DROP POLICY IF EXISTS "Users insert own trades" ON public.trade_history;

CREATE POLICY "Users read own trades"
  ON public.trade_history
  FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users insert own trades"
  ON public.trade_history
  FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE TABLE IF NOT EXISTS public.portfolio_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  equity NUMERIC(20, 8) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_snapshots_user_timestamp
  ON public.portfolio_snapshots(user_id, timestamp);

ALTER TABLE public.portfolio_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users insert own snapshots" ON public.portfolio_snapshots;
DROP POLICY IF EXISTS "Snapshots viewable by everyone" ON public.portfolio_snapshots;

CREATE POLICY "Snapshots viewable by everyone"
  ON public.portfolio_snapshots
  FOR SELECT
  USING (true);

CREATE POLICY "Users insert own snapshots"
  ON public.portfolio_snapshots
  FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);
