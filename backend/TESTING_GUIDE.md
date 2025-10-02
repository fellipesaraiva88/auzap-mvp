# 🧪 Guia de Testes - AuZap Backend

## 📦 Quick Start

```bash
# 1. Configurar ambiente de teste
cp .env.test.example .env.test
# Edite .env.test com suas credenciais do Supabase

# 2. Instalar dependências
npm install

# 3. Rodar todos os testes
npm test

# 4. Gerar relatório de coverage
npm run test:coverage
```

## 🎯 Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm test` | Roda todos os testes |
| `npm run test:watch` | Modo watch (desenvolvimento) |
| `npm run test:coverage` | Gera relatório de coverage |
| `npm run test:crud` | Apenas testes de CRUD |
| `npm run test:auth` | Apenas testes de Auth |
| `npm run test:queue` | Apenas testes de Queue |
| `npm run test:verbose` | Testes com output detalhado |

## 📊 Coverage Atual

Execute `npm run test:coverage` para ver o coverage atualizado.

Abra o relatório HTML:
```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

## ✅ Checklist de Testes

### CRUD de Contatos
- [x] Criar contato
- [x] Validar campos obrigatórios
- [x] Listar contatos por organização
- [x] Filtrar e paginar
- [x] Atualizar contato
- [x] Deletar contato
- [x] RLS (Row Level Security)

### Autenticação
- [x] Login válido
- [x] Login inválido
- [x] Estrutura JWT
- [x] organization_id no token
- [x] Registro de usuário
- [x] Refresh token
- [x] Logout
- [x] User metadata
- [x] Role-based access

### Queue/BullMQ
- [x] Adicionar job
- [x] Processar job
- [x] Retry automático
- [x] Falha após max attempts
- [x] Queue management
- [x] Job events
- [x] Message processing

## 🔧 Troubleshooting

### Redis não conecta
```bash
# Verificar se Redis está rodando
redis-cli ping

# Se não, iniciar Redis
docker run -d -p 6379:6379 redis:latest

# Ou pular testes de queue
npm run test:crud && npm run test:auth
```

### Timeout em testes
Aumentar timeout no `jest.config.js`:
```javascript
testTimeout: 60000, // 60 segundos
```

### Limpar dados de teste
Os testes limpam automaticamente, mas se precisar fazer manual:
```sql
-- No Supabase SQL Editor
DELETE FROM followups WHERE organization_id = 'test-org-id';
DELETE FROM bookings WHERE organization_id = 'test-org-id';
DELETE FROM pets WHERE organization_id = 'test-org-id';
DELETE FROM contacts WHERE organization_id = 'test-org-id';
DELETE FROM services WHERE organization_id = 'test-org-id';
DELETE FROM users WHERE organization_id = 'test-org-id';
DELETE FROM organizations WHERE name LIKE 'Test Org%';
```

## 📝 Estrutura de Arquivos

```
backend/tests/
├── setup.ts              # Setup global e helpers
├── crud.test.ts          # Testes de CRUD (Contatos)
├── auth.test.ts          # Testes de Autenticação
├── queue.test.ts         # Testes de Queue/BullMQ
└── README.md             # Documentação detalhada
```

## 🚀 Próximos Passos

1. **Integração com CI/CD**
   - Configurar GitHub Actions
   - Rodar testes em PRs
   - Bloquear merge se testes falharem

2. **Mais Testes**
   - Testes de Services (Pets, Bookings)
   - Testes de Followups
   - Testes de Aurora AI
   - Testes E2E com Playwright

3. **Performance**
   - Testes de carga
   - Benchmarks
   - Otimização de queries

## 📚 Referências

- [Jest Docs](https://jestjs.io/)
- [Supabase Testing](https://supabase.com/docs/guides/testing)
- [BullMQ Testing](https://docs.bullmq.io/guide/testing)

---

**Dúvidas?** Consulte `tests/README.md` para documentação completa.
