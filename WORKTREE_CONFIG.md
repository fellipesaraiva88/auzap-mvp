# ⚡ Performance Optimization Worktree

## Branch
`refactor/performance-optimization`

## Objetivo
Otimizar performance do sistema para <200ms p95 response time.

## Targets
- ✅ p95 response time < 200ms
- ✅ Database queries < 50ms
- ✅ Rate limiting implementado
- ✅ Índices otimizados

## Áreas de Foco
1. **Database**
   - Índices compostos otimizados
   - Queries RLS simplificadas
   - Particionamento de tabelas grandes

2. **API**
   - Rate limiting por endpoint
   - Response caching
   - Connection pooling

3. **Frontend**
   - Code splitting
   - Lazy loading
   - Image optimization

## Prompt Inicial
```
Adiciona índices otimizados no SQL, rate limiting no Express, otimiza queries RLS. Target: <200ms p95 response time, <50ms queries.
```

## Comandos Úteis
```bash
# Sincronizar com main
git pull --rebase origin main

# Benchmark
npm run benchmark

# Analyze bundle
npm run analyze
```
