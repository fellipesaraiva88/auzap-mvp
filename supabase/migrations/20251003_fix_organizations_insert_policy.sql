-- ============================================
-- FIX: Allow INSERT on organizations table
-- ============================================
-- PROBLEMA: Tabela organizations não tinha policy de INSERT
-- SOLUÇÃO: Adicionar policy que permite INSERT via service role
-- durante o registro de novos usuários
-- ============================================

-- Remove existing policies to recreate them properly
DROP POLICY IF EXISTS "org_select" ON public.organizations;
DROP POLICY IF EXISTS "org_update_admin" ON public.organizations;

-- SELECT: Users can view their own organization
CREATE POLICY "org_select" ON public.organizations
  FOR SELECT TO authenticated
  USING (id = public.user_organization_id(auth.uid()));

-- INSERT: Allow service role to create organizations (for registration)
-- This policy allows backend with service_role to create organizations
CREATE POLICY "org_insert_service" ON public.organizations
  FOR INSERT TO service_role
  WITH CHECK (true);

-- UPDATE: Only admins can update organization
CREATE POLICY "org_update_admin" ON public.organizations
  FOR UPDATE TO authenticated
  USING (id = public.user_organization_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (id = public.user_organization_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

-- COMMENT: Explain the security model
COMMENT ON POLICY "org_insert_service" ON public.organizations IS
  'Allows backend service (with service_role key) to create organizations during user registration. This bypasses RLS as intended.';
