
-- 1) Split SELECT policy on checklists by role
DROP POLICY IF EXISTS "Autenticados leem checklists" ON public.checklists;

CREATE POLICY "Executante le seus checklists"
  ON public.checklists
  FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'executante'::app_role)
    AND auth.uid() = user_id
  );

CREATE POLICY "Gestores leem todos checklists"
  ON public.checklists
  FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'supervisor'::app_role)
    OR has_role(auth.uid(), 'planejador'::app_role)
  );

-- 2) Revoke EXECUTE on the trigger function from signed-in users (only the trigger needs it)
REVOKE ALL ON FUNCTION public.handle_new_user_role() FROM PUBLIC, anon, authenticated;
