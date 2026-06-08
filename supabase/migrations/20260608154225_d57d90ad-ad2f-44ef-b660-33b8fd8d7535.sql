CREATE TABLE IF NOT EXISTS public.checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.checklists TO authenticated;
GRANT ALL ON public.checklists TO service_role;

ALTER TABLE public.checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios leem seus checklists"
  ON public.checklists FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Usuarios criam seus checklists"
  ON public.checklists FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios atualizam seus checklists"
  ON public.checklists FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios removem seus checklists"
  ON public.checklists FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS checklists_user_id_idx ON public.checklists(user_id);