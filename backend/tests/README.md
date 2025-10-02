# 🧪 AuZap Backend - Test Suite

Suite completa de testes de integração para Sprint 1 do AuZap Backend.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Configuração](#configuração)
- [Executando Testes](#executando-testes)
- [Estrutura de Testes](#estrutura-de-testes)
- [Coverage](#coverage)
- [Troubleshooting](#troubleshooting)

## 🎯 Visão Geral

Esta suite de testes cobre:

- ✅ **CRUD de Contatos** - Operações completas de Create, Read, Update, Delete
- ✅ **Autenticação** - Login, JWT, refresh tokens, roles
- ✅ **Queue/BullMQ** - Processamento assíncrono de mensagens
- ✅ **RLS (Row Level Security)** - Isolamento de dados por organização

## ⚙️ Configuração

### 1. Instalar Dependências

```bash
cd backend
npm install
```

### 2. Configurar Variáveis de Ambiente

Copie o arquivo `.env.test` e configure suas credenciais do Supabase:

```bash
cp .env.test.example .env.test
```

Edite `.env.test`:

```env
# Supabase Test Environment
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=seu_anon_key
SUPABASE_SERVICE_ROLE_KEY=seu_service_role_key

# OpenAI (use mock ou deixe vazio)
OPENAI_API_KEY=sk-test-mock-key

# Redis (local ou mock)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Server
PORT=3001
NODE_ENV=test
LOG_LEVEL=error
```

### 3. Configurar Redis (Opcional)

Para testes de Queue, você precisa de uma instância Redis rodando:

**Opção 1: Docker**
```bash
docker run -d -p 6379:6379 redis:latest
```

**Opção 2: Homebrew (macOS)**
```bash
brew install redis
brew services start redis
```

**Opção 3: Pular testes de Queue**
```bash
npm run test:crud
npm run test:auth
```

## 🚀 Executando Testes

### Todos os Testes

```bash
npm test
```

### Testes Específicos

```bash
# CRUD de Contatos
npm run test:crud

# Autenticação
npm run test:auth

# Queue/BullMQ
npm run test:queue
```

### Modo Watch (desenvolvimento)

```bash
npm run test:watch
```

### Testes com Verbose

```bash
npm run test:verbose
```

### Coverage Report

```bash
npm run test:coverage
```

Isso gerará relatórios em:
- `coverage/lcov-report/index.html` - Relatório HTML
- `coverage/coverage-final.json` - Dados JSON
- Terminal - Resumo de coverage

## 📁 Estrutura de Testes

```
backend/tests/
├── setup.ts           # Setup global e helpers
├── crud.test.ts       # Testes de CRUD de Contatos
├── auth.test.ts       # Testes de Autenticação
├── queue.test.ts      # Testes de Queue/BullMQ
└── README.md          # Esta documentação
```

### setup.ts

Gerencia o ambiente de testes:
- ✅ Cria organização de teste
- ✅ Cria usuário de teste
- ✅ Gera token de acesso
- ✅ Limpa dados após testes
- ✅ Fornece helpers reutilizáveis

### crud.test.ts

Testa operações de contatos:
- ✅ Criar contato
- ✅ Listar contatos
- ✅ Atualizar contato
- ✅ Deletar contato
- ✅ Filtros e paginação
- ✅ RLS (isolamento por organização)

### auth.test.ts

Testa autenticação:
- ✅ Login com credenciais válidas/inválidas
- ✅ Estrutura e validação de JWT
- ✅ organization_id no token
- ✅ Registro de novos usuários
- ✅ Refresh de tokens
- ✅ Logout
- ✅ User metadata
- ✅ Role-based access

### queue.test.ts

Testa processamento assíncrono:
- ✅ Adicionar jobs à fila
- ✅ Processar jobs com sucesso
- ✅ Retry de jobs com falha
- ✅ Gerenciamento de filas
- ✅ Eventos de jobs
- ✅ Processamento de mensagens

## 📊 Coverage

Objetivos de cobertura:

| Métrica     | Target | Atual |
|-------------|--------|-------|
| Branches    | 70%    | TBD   |
| Functions   | 70%    | TBD   |
| Lines       | 70%    | TBD   |
| Statements  | 70%    | TBD   |

Para visualizar coverage detalhado:

```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

## 🔍 Estrutura de um Teste

Exemplo de teste bem estruturado:

```typescript
describe('Feature Name', () => {
  beforeEach(async () => {
    // Setup antes de cada teste
    await resetTestData();
  });

  describe('Specific Functionality', () => {
    it('should do something specific', async () => {
      // Arrange
      const { supabase, testOrgId } = getTestContext();
      const testData = { ... };

      // Act
      const { data, error } = await supabase
        .from('table')
        .insert(testData)
        .select()
        .single();

      // Assert
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.field).toBe(expectedValue);
    });
  });
});
```

## 🐛 Troubleshooting

### Redis Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

**Solução:**
- Certifique-se que Redis está rodando: `redis-cli ping`
- Ou pule testes de queue: `npm run test:crud && npm run test:auth`

### Supabase Connection Error

```
Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY
```

**Solução:**
- Verifique `.env.test` existe
- Confirme as credenciais estão corretas
- Teste a conexão no dashboard do Supabase

### Timeout em Testes

```
Error: Timeout - Async callback was not invoked within the 30000 ms timeout
```

**Solução:**
- Aumente o timeout no jest.config.js
- Verifique se o Supabase está respondendo
- Verifique logs de rede/firewall

### Cleanup Falhou

```
Cleanup error: foreign key constraint
```

**Solução:**
- A ordem de limpeza no setup.ts respeita foreign keys
- Se ainda falhar, limpe manualmente no Supabase

## 📝 Boas Práticas

1. **Sempre use resetTestData()** antes de testes que modificam dados
2. **Use getTestContext()** para acessar dados de teste
3. **Não hardcode IDs** - use os do contexto de teste
4. **Limpe recursos** criados em testes individuais
5. **Use describe/it descritivos** para facilitar debug
6. **Teste casos de sucesso E erro**
7. **Verifique RLS** para garantir isolamento

## 🔄 CI/CD Integration

Para integrar em pipeline CI/CD:

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      redis:
        image: redis:latest
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd backend
          npm ci

      - name: Run tests
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
        run: |
          cd backend
          npm run test:coverage
```

## 📚 Recursos Adicionais

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supabase Testing Guide](https://supabase.com/docs/guides/testing)
- [BullMQ Testing](https://docs.bullmq.io/guide/testing)

## 🆘 Suporte

Problemas? Abra uma issue no repositório ou contate o time de desenvolvimento.

---

**Última atualização:** 2025-10-02
**Versão:** 1.0.0
**Autor:** AuZap Team
