-- Adicionar colunas faltantes à tabela authorized_owner_numbers
ALTER TABLE authorized_owner_numbers
ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT true;

ALTER TABLE authorized_owner_numbers
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

ALTER TABLE authorized_owner_numbers
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'owner';

-- Adicionar constraint para role
ALTER TABLE authorized_owner_numbers
DROP CONSTRAINT IF EXISTS authorized_owner_numbers_role_check;

ALTER TABLE authorized_owner_numbers
ADD CONSTRAINT authorized_owner_numbers_role_check
CHECK (role IN ('owner', 'manager', 'admin'));

-- Criar indexes se não existirem
CREATE INDEX IF NOT EXISTS idx_authorized_owners_org
  ON authorized_owner_numbers(organization_id);

CREATE INDEX IF NOT EXISTS idx_authorized_owners_phone
  ON authorized_owner_numbers(organization_id, phone_number)
  WHERE is_active = true;

-- Habilitar RLS
ALTER TABLE authorized_owner_numbers ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Users can access their org owner numbers" ON authorized_owner_numbers;

-- Criar nova política
CREATE POLICY "Users can access their org owner numbers"
  ON authorized_owner_numbers FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_users
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM organization_users
      WHERE user_id = auth.uid()
    )
  );

-- Criar ou atualizar função de trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar trigger se não existir
DROP TRIGGER IF EXISTS update_authorized_owner_numbers_updated_at ON authorized_owner_numbers;

CREATE TRIGGER update_authorized_owner_numbers_updated_at
  BEFORE UPDATE ON authorized_owner_numbers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'authorized_owner_numbers'
ORDER BY ordinal_position;