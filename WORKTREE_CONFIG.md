# 🌟 Aurora Service Worktree

## Branch
`feature/aurora-service`

## Objetivo
Implementar Aurora Service com OpenAI GPT-4 function calling e mensagens proativas.

## Stack
- Node.js + TypeScript + Express
- OpenAI GPT-4o-mini (mais barato e rápido)
- Socket.io para real-time

## Arquivos Principais
- `backend/src/services/aurora.service.ts` - Serviço principal
- `backend/src/middleware/aurora-auth.middleware.ts` - Autenticação
- `backend/src/controllers/aurora.controller.ts` - Endpoints

## Prompt Inicial
```
Implementa o Aurora Service completo: backend/src/services/aurora.service.ts com OpenAI GPT-4o-mini (model: gpt-4o-mini) function calling, middleware aurora-auth.middleware.ts para detectar números autorizados, e mensagens proativas. Stack: Node.js + TypeScript + Express.
```

## Comandos Úteis
```bash
# Sincronizar com main
git pull --rebase origin main

# Testar localmente
npm run dev

# Verificar tipos
npm run type-check
```
