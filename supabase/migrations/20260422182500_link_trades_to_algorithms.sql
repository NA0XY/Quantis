ALTER TABLE public.trade_history
  ADD COLUMN IF NOT EXISTS algorithm_id UUID REFERENCES public.algorithms(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_trade_history_algorithm_id
  ON public.trade_history(algorithm_id);
