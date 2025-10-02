-- ============================================
-- AUZAP - MIGRATION 001: AUDIT TRAIL + SOFT DELETE
-- Autor: Claude Code + Fellipe Saraiva
-- Data: 2025-10-02
-- ============================================
--
-- DECISÕES ARQUITETURAIS:
-- 1. IDs: UUID v4 (mantido atual)
-- 2. Audit Trail: Tabela audit_logs com triggers automáticos
-- 3. Soft Delete: Implementado em 5 tabelas críticas
-- 4. Backup: Supabase daily (7 days retention)
-- ============================================

-- ============================================
-- PARTE 1: AUDIT LOGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificação do registro alterado
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Tipo de operação
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),

  -- Dados antes/depois
  old_values JSONB,
  new_values JSONB,

  -- Auditoria
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Contexto adicional
  ip_address INET,
  user_agent TEXT,

  -- Índices
  CONSTRAINT audit_logs_action_check CHECK (
    (action = 'INSERT' AND old_values IS NULL) OR
    (action = 'UPDATE' AND old_values IS NOT NULL AND new_values IS NOT NULL) OR
    (action = 'DELETE' AND new_values IS NULL)
  )
);

-- Indexes para performance
CREATE INDEX idx_audit_logs_table_record ON public.audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_org ON public.audit_logs(organization_id, changed_at DESC);
CREATE INDEX idx_audit_logs_changed_at ON public.audit_logs(changed_at DESC);
CREATE INDEX idx_audit_logs_changed_by ON public.audit_logs(changed_by);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);

-- RLS para audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view audit logs from their org"
ON public.audit_logs FOR SELECT TO authenticated
USING (organization_id = public.user_organization_id(auth.uid()));

-- Service role pode inserir (usado pelos triggers)
CREATE POLICY "Service role can insert audit logs"
ON public.audit_logs FOR INSERT TO authenticated
WITH CHECK (true);

COMMENT ON TABLE public.audit_logs IS 'Audit trail automático para compliance e debugging';

-- ============================================
-- PARTE 2: AUDIT TRIGGER FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION public.audit_trigger_func()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  org_id UUID;
BEGIN
  -- Extrair organization_id do registro
  IF TG_OP = 'DELETE' THEN
    org_id := OLD.organization_id;
  ELSE
    org_id := NEW.organization_id;
  END IF;

  -- Inserir no audit log
  INSERT INTO public.audit_logs (
    table_name,
    record_id,
    organization_id,
    action,
    old_values,
    new_values,
    changed_by
  ) VALUES (
    TG_TABLE_NAME,
    CASE
      WHEN TG_OP = 'DELETE' THEN OLD.id
      ELSE NEW.id
    END,
    org_id,
    TG_OP,
    CASE
      WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD)
      ELSE NULL
    END,
    CASE
      WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW)
      ELSE NULL
    END,
    auth.uid()
  );

  -- Retornar registro apropriado
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.audit_trigger_func() IS 'Trigger function para capturar mudanças em tabelas auditadas';

-- ============================================
-- PARTE 3: SOFT DELETE - ADICIONAR COLUNAS
-- ============================================

-- Adicionar deleted_at em tabelas críticas
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Indexes para queries eficientes (WHERE deleted_at IS NULL)
CREATE INDEX idx_contacts_not_deleted ON public.contacts(organization_id, deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_pets_not_deleted ON public.pets(organization_id, deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_bookings_not_deleted ON public.bookings(organization_id, deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_conversations_not_deleted ON public.conversations(organization_id, deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_messages_not_deleted ON public.messages(organization_id, deleted_at) WHERE deleted_at IS NULL;

COMMENT ON COLUMN public.contacts.deleted_at IS 'Soft delete timestamp - NULL = ativo, NOT NULL = deletado';
COMMENT ON COLUMN public.pets.deleted_at IS 'Soft delete timestamp - NULL = ativo, NOT NULL = deletado';
COMMENT ON COLUMN public.bookings.deleted_at IS 'Soft delete timestamp - NULL = ativo, NOT NULL = deletado';
COMMENT ON COLUMN public.conversations.deleted_at IS 'Soft delete timestamp - NULL = ativo, NOT NULL = deletado';
COMMENT ON COLUMN public.messages.deleted_at IS 'Soft delete timestamp - NULL = ativo, NOT NULL = deletado';

-- ============================================
-- PARTE 4: APLICAR AUDIT TRIGGERS
-- ============================================

-- Contacts
DROP TRIGGER IF EXISTS audit_contacts_changes ON public.contacts;
CREATE TRIGGER audit_contacts_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Pets
DROP TRIGGER IF EXISTS audit_pets_changes ON public.pets;
CREATE TRIGGER audit_pets_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.pets
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Bookings
DROP TRIGGER IF EXISTS audit_bookings_changes ON public.bookings;
CREATE TRIGGER audit_bookings_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Conversations
DROP TRIGGER IF EXISTS audit_conversations_changes ON public.conversations;
CREATE TRIGGER audit_conversations_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Messages
DROP TRIGGER IF EXISTS audit_messages_changes ON public.messages;
CREATE TRIGGER audit_messages_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Organization Settings (importante para compliance)
DROP TRIGGER IF EXISTS audit_org_settings_changes ON public.organization_settings;
CREATE TRIGGER audit_org_settings_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.organization_settings
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Services (mudanças de preço)
DROP TRIGGER IF EXISTS audit_services_changes ON public.services;
CREATE TRIGGER audit_services_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- ============================================
-- PARTE 5: HELPER VIEWS (OPCIONAL)
-- ============================================

-- View para consultar registros ativos (não deletados)
CREATE OR REPLACE VIEW public.active_contacts AS
SELECT * FROM public.contacts WHERE deleted_at IS NULL;

CREATE OR REPLACE VIEW public.active_pets AS
SELECT * FROM public.pets WHERE deleted_at IS NULL;

CREATE OR REPLACE VIEW public.active_bookings AS
SELECT * FROM public.bookings WHERE deleted_at IS NULL;

CREATE OR REPLACE VIEW public.active_conversations AS
SELECT * FROM public.conversations WHERE deleted_at IS NULL;

CREATE OR REPLACE VIEW public.active_messages AS
SELECT * FROM public.messages WHERE deleted_at IS NULL;

-- ============================================
-- PARTE 6: FUNCÕES HELPER PARA SOFT DELETE
-- ============================================

-- Função para "deletar" (soft delete) um contato
CREATE OR REPLACE FUNCTION public.soft_delete_contact(contact_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.contacts
  SET deleted_at = NOW()
  WHERE id = contact_id
    AND organization_id = public.user_organization_id(auth.uid())
    AND deleted_at IS NULL;
END;
$$;

-- Função para restaurar um contato deletado
CREATE OR REPLACE FUNCTION public.restore_contact(contact_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.contacts
  SET deleted_at = NULL
  WHERE id = contact_id
    AND organization_id = public.user_organization_id(auth.uid())
    AND deleted_at IS NOT NULL;
END;
$$;

-- Função para purgar registros antigos (executar via cron job)
CREATE OR REPLACE FUNCTION public.purge_old_deleted_records(days_old INTEGER DEFAULT 90)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  -- Purgar contacts
  DELETE FROM public.contacts
  WHERE deleted_at IS NOT NULL
    AND deleted_at < NOW() - INTERVAL '1 day' * days_old;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  -- Purgar pets
  DELETE FROM public.pets
  WHERE deleted_at IS NOT NULL
    AND deleted_at < NOW() - INTERVAL '1 day' * days_old;

  -- Purgar bookings
  DELETE FROM public.bookings
  WHERE deleted_at IS NOT NULL
    AND deleted_at < NOW() - INTERVAL '1 day' * days_old;

  -- Purgar conversations
  DELETE FROM public.conversations
  WHERE deleted_at IS NOT NULL
    AND deleted_at < NOW() - INTERVAL '1 day' * days_old;

  -- Purgar messages
  DELETE FROM public.messages
  WHERE deleted_at IS NOT NULL
    AND deleted_at < NOW() - INTERVAL '1 day' * days_old;

  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION public.purge_old_deleted_records IS 'Purga registros soft-deleted após X dias (default 90)';

-- ============================================
-- PARTE 7: VALIDAÇÃO
-- ============================================

DO $$
BEGIN
  -- Verificar se audit_logs foi criada
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'audit_logs') THEN
    RAISE EXCEPTION 'Tabela audit_logs não foi criada corretamente';
  END IF;

  -- Verificar se colunas deleted_at foram adicionadas
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'contacts'
      AND column_name = 'deleted_at'
  ) THEN
    RAISE EXCEPTION 'Coluna deleted_at não foi adicionada em contacts';
  END IF;

  RAISE NOTICE '✅ Migration 001 executada com sucesso!';
END $$;

-- ============================================
-- RESUMO DA MIGRATION
-- ============================================
-- ✅ Criada tabela audit_logs com 5 indexes
-- ✅ Criada função audit_trigger_func()
-- ✅ Adicionado deleted_at em 5 tabelas
-- ✅ Criados 5 indexes para soft delete
-- ✅ Aplicados 7 audit triggers
-- ✅ Criadas 5 views helper (active_*)
-- ✅ Criadas 3 funções helper (soft_delete, restore, purge)
-- ✅ RLS configurado para audit_logs
-- ============================================
