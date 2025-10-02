# 🤝 Guia de Contribuição - AuZap

Obrigado por contribuir com o AuZap! Este guia ajudará você a configurar seu ambiente de desenvolvimento e seguir nossas práticas.

---

## 🚀 Quick Start (< 5 minutos)

### 1. Pré-requisitos

- **Node.js** 20+ ([download](https://nodejs.org/))
- **Docker Desktop** ([download](https://www.docker.com/products/docker-desktop))
- **Git** ([download](https://git-scm.com/))
- **VSCode** (recomendado) ([download](https://code.visualstudio.com/))

### 2. Clone e Configure

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/auzap.git
cd auzap

# Instale todas as dependências (monorepo)
npm install

# Copie os arquivos .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edite os .env com suas credenciais
```

### 3. Inicie Docker Services

```bash
# Sobe Redis + PostgreSQL (opcional) + UIs admin
npm run docker:up

# Verifique os serviços
docker ps
```

Acesse:
- **RedisInsight**: http://localhost:8001
- **Adminer (PostgreSQL)**: http://localhost:8080

### 4. Rode a Aplicação

```bash
# Inicia Backend API + Worker + Frontend simultaneamente
npm run dev
```

Acesse:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Worker**: rodando em background

---

## 📁 Estrutura do Projeto

```
auzap/
├── backend/              # Node.js + Express + Baileys
│   ├── src/
│   │   ├── config/       # Configurações (Supabase, Redis, OpenAI)
│   │   ├── services/     # Lógica de negócio (WhatsApp, AI)
│   │   ├── workers/      # BullMQ workers
│   │   ├── routes/       # Endpoints HTTP
│   │   └── types/        # TypeScript types
│   └── package.json
│
├── frontend/             # React + Vite + Tailwind
│   ├── src/
│   │   ├── components/   # Componentes React
│   │   ├── pages/        # Páginas
│   │   ├── lib/          # Utils (Supabase, Socket.io)
│   │   └── store/        # Zustand stores
│   └── package.json
│
├── .vscode/              # Configurações VSCode
├── docker-compose.yml    # Serviços Docker
└── package.json          # Scripts root (monorepo)
```

---

## 🛠️ Scripts Disponíveis

### Desenvolvimento

```bash
npm run dev                 # Roda tudo (API + Worker + Frontend)
npm run dev:backend         # Apenas backend API
npm run dev:worker          # Apenas worker
npm run dev:frontend        # Apenas frontend
```

### Build & Produção

```bash
npm run build               # Build completo
npm run build:backend       # Build apenas backend
npm run build:frontend      # Build apenas frontend
```

### Testes

```bash
npm test                    # Roda todos os testes
npm run test:backend        # Testa backend
npm run test:frontend       # Testa frontend
```

### Linting & Formatação

```bash
npm run lint                # Verifica linting
npm run lint:fix            # Corrige erros de linting
npm run format              # Formata código com Prettier
npm run format:check        # Verifica formatação
```

### Docker

```bash
npm run docker:up           # Sobe serviços Docker
npm run docker:down         # Para serviços Docker
npm run docker:logs         # Mostra logs
```

### Utilitários

```bash
npm run typecheck           # Verifica tipos TypeScript
npm run clean               # Remove node_modules e build
npm run reset               # Clean + install
```

---

## 🎨 Padrões de Código

### TypeScript

- **Strict mode** habilitado
- Use **interfaces** para objetos, **types** para unions
- Sempre exporte tipos reutilizáveis

```typescript
// ✅ Bom
export interface User {
  id: string;
  name: string;
}

// ❌ Evite any
const data: any = {};
```

### React

- Use **functional components** + hooks
- Prefira **named exports** para componentes
- Use **Zustand** para estado global

```tsx
// ✅ Bom
export function UserCard({ user }: { user: User }) {
  const [isOpen, setIsOpen] = useState(false);
  return <div>...</div>;
}
```

### Naming Conventions

- **Componentes**: `PascalCase` (ex: `WhatsAppCard.tsx`)
- **Funções**: `camelCase` (ex: `sendMessage()`)
- **Constantes**: `UPPER_SNAKE_CASE` (ex: `MAX_RETRIES`)
- **Arquivos**: `kebab-case` (ex: `user-service.ts`)

---

## 🔄 Workflow Git

### Branches

```bash
main            # Produção estável
develop         # Desenvolvimento ativo
feature/xxx     # Novas features
fix/xxx         # Bug fixes
```

### Commits

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

```bash
feat: adicionar suporte a áudio
fix: corrigir erro de conexão WhatsApp
docs: atualizar README
refactor: reorganizar serviços
test: adicionar testes de integração
```

### Pull Requests

1. Crie uma branch: `git checkout -b feature/minha-feature`
2. Commite suas mudanças: `git commit -m "feat: ..."`
3. Push: `git push origin feature/minha-feature`
4. Abra PR no GitHub
5. Aguarde code review

**Pre-commit hooks** rodam automaticamente:
- ESLint
- Prettier
- Type check

---

## 🧪 Testes

### Estrutura de Testes

```
backend/
└── src/
    └── services/
        ├── whatsapp.service.ts
        └── whatsapp.service.test.ts  # ← Testes ao lado do código
```

### Exemplo de Teste

```typescript
import { describe, it, expect } from '@jest/globals';
import { sendMessage } from './whatsapp.service';

describe('WhatsApp Service', () => {
  it('should send a text message', async () => {
    const result = await sendMessage({
      to: '5511999999999',
      text: 'Hello'
    });

    expect(result.status).toBe('success');
  });
});
```

### Rodando Testes

```bash
npm test                    # Todos os testes
npm test -- --watch         # Watch mode
npm test -- user.test.ts    # Teste específico
```

---

## 🐛 Troubleshooting

### Redis Connection Failed

```bash
# Verificar se Docker está rodando
docker ps

# Se não aparecer redis-auzap:
npm run docker:up
```

### TypeScript Errors

```bash
# Limpar cache e rebuild
npm run clean
npm install
npm run typecheck
```

### Port Already in Use

```bash
# Encontrar processo usando porta 3000
lsof -i :3000

# Matar processo
kill -9 <PID>
```

### WhatsApp Pairing Code Não Aparece

1. Verificar logs: `docker-compose logs -f`
2. Checar se `OPENAI_API_KEY` está configurado
3. Limpar sessão: deletar pasta `backend/auth_info_baileys`

---

## 📚 Recursos Úteis

### Documentação

- [Baileys (WhatsApp)](https://github.com/WhiskeySockets/Baileys)
- [Supabase](https://supabase.com/docs)
- [BullMQ](https://docs.bullmq.io/)
- [OpenAI API](https://platform.openai.com/docs)
- [React Query](https://tanstack.com/query/latest)

### VSCode Extensions Recomendadas

Ao abrir o projeto, o VSCode sugerirá instalar:

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- GitLens
- Error Lens

---

## 🤔 Dúvidas?

- Abra uma [Issue](https://github.com/seu-usuario/auzap/issues)
- Entre no nosso [Discord](https://discord.gg/auzap)
- Envie email: suporte@auzap.com

---

**Happy Coding! 🚀**
