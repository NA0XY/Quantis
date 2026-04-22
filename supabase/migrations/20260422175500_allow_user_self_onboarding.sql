DROP POLICY IF EXISTS "Users can insert their own row" ON public.users;

CREATE POLICY "Users can insert their own row"
  ON public.users
  FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = id);
