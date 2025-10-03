-- =============================================
-- Fix Internal Users - Corrigir hash de senha
-- =============================================
-- Senha: AuZap2025! (hash bcrypt correto)

UPDATE internal_users
SET password_hash = '$2b$10$/8w1nvmPRDDlYyrkbD3L9.Nl4S5dvSnAmUeNGUhtuhpqfyouVWE3u'
WHERE email IN (
  'eu@saraiva.ai',
  'julio@auzap.com',
  'arthur@auzap.com',
  'leo@auzap.com',
  'joaquim@auzap.com',
  'leticia@auzap.com'
);

-- Verificar se os usuários foram atualizados
DO $$
DECLARE
  updated_count INT;
BEGIN
  SELECT COUNT(*) INTO updated_count
  FROM internal_users
  WHERE email IN (
    'eu@saraiva.ai',
    'julio@auzap.com',
    'arthur@auzap.com',
    'leo@auzap.com',
    'joaquim@auzap.com',
    'leticia@auzap.com'
  );

  RAISE NOTICE 'Updated % internal users with correct password hash', updated_count;
END $$;
