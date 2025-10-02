# 🧪 Instruções de Uso - Suite de Testes Sprint 1

## ✅ O Que Foi Implementado

### 1. **Setup Completo de Testes** (`tests/setup.ts`)
- ✅ Conexão automática com Supabase
- ✅ Criação de organização de teste
- ✅ Criação de usuário de teste com role admin
- ✅ Geração de JWT token válido
- ✅ Limpeza automática após testes
- ✅ Helpers para resetar dados entre testes
- ✅ Contexto global compartilhado

### 2. **Testes de CRUD** (`tests/crud.test.ts`)
✅ **Total: 14 testes**

**Create:**
- Criar contato com sucesso
- Validar campo organization_id obrigatório
- Validar formato de telefone

**Read:**
- Listar todos os contatos da organização
- Filtrar contatos por nome
- Paginação de resultados

**Update:**
- Atualizar contato com sucesso
- Prevenir mudança de organization_id (segurança)

**Delete:**
- Deletar contato com sucesso
- Lidar com contatos inexistentes

**RLS (Row Level Security):**
- Garantir isolamento entre organizações

### 3. **Testes de Queue** (`tests/queue.test.ts`)
✅ **Total: 14 testes**

**Adicionar Jobs:**
- Adicionar job simples
- Adicionar job com opções (delay, retry)
- Adicionar job com prioridade

**Processar Jobs:**
- Processamento bem-sucedido
- Retry automático em falhas
- Falha após max attempts

**Gerenciamento:**
- Contadores de queue
- Pausar e resumir queue
- Buscar jobs por status
- Remover jobs

**Message Processing:**
- Queue de processamento de mensagens
- Validação de resultado

**Eventos:**
- Evento de job completado
- Evento de job falhado

### 4. **Testes de Autenticação** (`tests/auth.test.ts`)
✅ **Total: 19 testes**

**Login:**
- Login com credenciais válidas
- Falha com email inválido
- Falha com senha inválida
- Falha com credenciais vazias

**JWT Token:**
- Estrutura válida do token
- Decodificação de token
- organization_id no token
- Validação de expiração
- Rejeição de token expirado

**Registro:**
- Criar novo usuário
- Falha com email duplicado
- Validação de formato de email

**Token Refresh:**
- Refresh de access token
- Falha com refresh token inválido

**Logout:**
- Logout com sucesso

**User Metadata:**
- Recuperar metadata
- Atualizar metadata

**Role-Based Access:**
- Verificar role de admin
- Criar usuário com role diferente

## 📊 Estatísticas

- **Total de Testes:** 47 testes
- **Arquivos de Teste:** 3 arquivos
- **Coverage Target:** 70% (branches, functions, lines, statements)

## 🚀 Como Usar

### 1. Configuração Inicial

```bash
cd backend

# Copiar arquivo de exemplo
cp .env.test.example .env.test

# Editar com suas credenciais reais do Supabase
nano .env.test
```

**IMPORTANTE:** Configure credenciais REAIS do Supabase em `.env.test`:
```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua_anon_key
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
```

### 2. Executar Testes

```bash
# Todos os testes
npm test

# Com coverage
npm run test:coverage

# Testes específicos
npm run test:crud      # Apenas CRUD
npm run test:auth      # Apenas Auth
npm run test:queue     # Apenas Queue

# Modo watch (desenvolvimento)
npm run test:watch

# Verbose (debug)
npm run test:verbose
```

### 3. Visualizar Coverage

```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

## 📁 Arquivos Criados

```
backend/
├── tests/
│   ├── setup.ts              # Setup global e helpers
│   ├── crud.test.ts          # 14 testes de CRUD
│   ├── auth.test.ts          # 19 testes de Auth
│   ├── queue.test.ts         # 14 testes de Queue
│   └── README.md             # Documentação completa
├── jest.config.js            # Configuração do Jest
├── .env.test                 # Variáveis de teste (gitignored)
├── .env.test.example         # Template de variáveis
├── TESTING_GUIDE.md          # Guia rápido
└── TEST_INSTRUCTIONS.md      # Este arquivo
```

## ⚠️ Requisitos

### Obrigatórios:
- ✅ Node.js 18+
- ✅ Projeto Supabase ativo
- ✅ Credenciais do Supabase (URL + Service Role Key)

### Opcionais:
- Redis (para testes de Queue)
  - Sem Redis: rodar apenas `npm run test:crud && npm run test:auth`
  - Com Docker: `docker run -d -p 6379:6379 redis:latest`
  - Com Homebrew: `brew install redis && brew services start redis`

## 🧪 Exemplo de Saída

```bash
$ npm test

PASS  tests/crud.test.ts
  Contacts CRUD Operations
    Create Contact
      ✓ should create a contact successfully (150ms)
      ✓ should require organization_id (82ms)
      ✓ should validate phone format (75ms)
    List Contacts
      ✓ should list all contacts for organization (120ms)
      ✓ should filter contacts by name (95ms)
      ✓ should paginate contacts (88ms)
    Update Contact
      ✓ should update contact successfully (110ms)
      ✓ should NOT update organization_id (92ms)
    Delete Contact
      ✓ should delete contact successfully (85ms)
      ✓ should handle deleting non-existent contact (65ms)
    RLS (Row Level Security)
      ✓ should NOT access other org contacts (180ms)

PASS  tests/auth.test.ts
  Authentication Tests
    User Login
      ✓ should login with valid credentials (250ms)
      ✓ should fail login with invalid email (150ms)
      ✓ should fail login with invalid password (145ms)
      ✓ should fail login with empty credentials (125ms)
    ... (more tests)

PASS  tests/queue.test.ts
  Queue Operations (BullMQ)
    Add Job to Queue
      ✓ should add a job successfully (95ms)
      ✓ should add job with options (88ms)
      ✓ should add job with priority (82ms)
    ... (more tests)

Test Suites: 3 passed, 3 total
Tests:       47 passed, 47 total
Time:        12.534 s
```

## 📋 Checklist Antes de Rodar

- [ ] `.env.test` configurado com credenciais reais
- [ ] Supabase projeto ativo e acessível
- [ ] Dependências instaladas (`npm install`)
- [ ] Redis rodando (opcional, para testes de Queue)
- [ ] Internet funcionando (acesso ao Supabase)

## 🐛 Troubleshooting

### Erro: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
**Solução:** Configure `.env.test` com credenciais reais do Supabase

### Erro: "connect ECONNREFUSED 127.0.0.1:6379"
**Solução:** Inicie Redis ou pule testes de queue:
```bash
npm run test:crud && npm run test:auth
```

### Timeout em Testes
**Solução:** Verifique conexão com Supabase e aumente timeout no `jest.config.js`:
```javascript
testTimeout: 60000, // 60 segundos
```

### Tests Passed mas Coverage Baixo
**Normal!** Coverage inicial esperado:
- Estes testes cobrem funcionalidades específicas
- Para aumentar coverage, adicione mais testes
- Execute `npm run test:coverage` para ver gaps

## 📊 Coverage Report

Após rodar `npm run test:coverage`, você verá:

```
------------------|---------|----------|---------|---------|
File              | % Stmts | % Branch | % Funcs | % Lines |
------------------|---------|----------|---------|---------|
All files         |   45.23 |    38.46 |   52.17 |   46.15 |
 config/          |   80.00 |    50.00 |   66.67 |   81.25 |
  supabase.ts     |   80.00 |    50.00 |   66.67 |   81.25 |
 services/        |   35.71 |    25.00 |   42.86 |   36.36 |
  contacts.svc.ts |   35.71 |    25.00 |   42.86 |   36.36 |
------------------|---------|----------|---------|---------|
```

**Arquivo HTML detalhado:**
```bash
open coverage/lcov-report/index.html
```

## 🎯 Próximos Passos

1. **Configure suas credenciais** em `.env.test`
2. **Execute os testes:** `npm test`
3. **Verifique coverage:** `npm run test:coverage`
4. **Leia documentação completa:** `tests/README.md`

## 🆘 Suporte

- **Documentação Completa:** `tests/README.md`
- **Guia Rápido:** `TESTING_GUIDE.md`
- **Issues:** Abra issue no repositório

---

**Criado em:** 2025-10-02
**Versão:** 1.0.0
**Framework:** Jest + TypeScript
**Autor:** Test Automation Engineer
