# 🔧 Configuração REDIS_URL no Render

> **Status Atual**: ⚠️ REDIS_URL faltando - Workers desabilitados
> **Serviço**: auzap-api (srv-d3eu56ali9vc73dpca3g)
> **Última atualização**: 2025-10-02

---

## 🚨 PROBLEMA

Workers do backend estão desabilitados porque a variável de ambiente `REDIS_URL` não está configurada no Render.

**Impacto:**
- Sem mensagens proativas Aurora
- Sem processamento assíncrono de mensagens
- Sem follow-ups automáticos
- Sem retry de mensagens falhadas

---

## 📋 CREDENCIAIS REDIS (Upstash)

```bash
REDIS_URL=redis://default:[REDACTED_UPSTASH_TOKEN]@prime-mullet-17029.upstash.io:6379
```

**Detalhes:**
- Host: `prime-mullet-17029.upstash.io`
- Port: `6379`
- User: `default`
- Password: `[REDACTED_UPSTASH_TOKEN]`

---

## 🚀 CONFIGURAÇÃO MANUAL (Passo a Passo)

### 1. Acessar Dashboard do Render

Abrir no navegador:
```
https://dashboard.render.com/web/srv-d3eu56ali9vc73dpca3g
```

### 2. Navegar para Environment Variables

1. No menu lateral esquerdo, clicar em **"Environment"**
2. Você verá a lista de variáveis existentes

### 3. Adicionar REDIS_URL

1. Clicar no botão **"+ Add Environment Variable"**
2. Preencher o formulário:

**Key:**
```
REDIS_URL
```

**Value:**
```
redis://default:[REDACTED_UPSTASH_TOKEN]@prime-mullet-17029.upstash.io:6379
```

3. Clicar em **"Add"** ou **"Save"**

### 4. Aguardar Redeploy Automático

O Render detecta mudanças em env vars e faz redeploy automaticamente.

**Monitorar:**
1. Clicar em **"Events"** no menu lateral
2. Aguardar deploy completar (~2-3 minutos)
3. Verificar status: "Live"

---

## ✅ VALIDAÇÃO

### Opção 1: Via Script Automatizado

```bash
cd /Users/saraiva/final_auzap
chmod +x scripts/validate-redis.sh
./scripts/validate-redis.sh
```

### Opção 2: Via Curl Manual

```bash
curl https://auzap-api.onrender.com/health
```

**Response esperada (COM Redis):**
```json
{
  "status": "ok",
  "timestamp": "2025-10-02T...",
  "redis": "connected"
}
```

**Response atual (SEM Redis):**
```json
{
  "status": "ok",
  "timestamp": "2025-10-02T..."
}
```

### Opção 3: Verificar Logs

1. Acessar: https://dashboard.render.com/web/srv-d3eu56ali9vc73dpca3g
2. Clicar em **"Logs"**
3. Procurar por:

**SE configurado corretamente:**
```
✅ Redis connected successfully
✅ BullMQ workers initialized
✅ Aurora Proactive worker started
```

**SE ainda sem REDIS_URL:**
```
⚠️  Workers desabilitados (sem REDIS_URL)
✅ Server running in sync mode
```

---

## 🎯 CHECKLIST PÓS-CONFIGURAÇÃO

- [ ] REDIS_URL adicionado no Render
- [ ] Deploy automático completado
- [ ] Health check retorna `"redis": "connected"`
- [ ] Logs mostram "Redis connected successfully"
- [ ] Workers aparecem como ativos nos logs
- [ ] Mensagens proativas funcionando

---

## 🔧 TROUBLESHOOTING

### REDIS_URL não aparece após adicionar

**Soluções:**
1. Fazer hard refresh no navegador (Cmd+Shift+R)
2. Sair e entrar novamente no dashboard
3. Verificar se não há espaços extras no nome da variável

### Deploy falhou após adicionar REDIS_URL

**Verificar:**
1. Ir para "Events" → último deploy
2. Clicar em "View logs"
3. Procurar por erros relacionados a Redis

**Erros comuns:**

```bash
# Erro de conexão
ERROR: Redis connection failed - ECONNREFUSED
```
→ Verificar se URL está correta

```bash
# Erro de autenticação
ERROR: WRONGPASS invalid username-password pair
```
→ Verificar senha no Upstash dashboard

### Workers não ativam mesmo com REDIS_URL

**Causa provável:**
Código tem workaround que desabilita workers

**Verificar em `/backend/src/config/redis.ts`:**
```typescript
// Procurar por lógica de desabilitação
if (!process.env.REDIS_URL) {
  console.warn('⚠️  Workers desabilitados');
}
```

**Solução:**
1. Remover/comentar lógica de desabilitação
2. Fazer commit e push
3. Aguardar redeploy

---

## 📊 IMPACTO ESPERADO

### ANTES (sem REDIS_URL)
```
⚠️  Workers: DESABILITADOS
📨 Processamento: SÍNCRONO
⏱️  Response Time: 500-1000ms
🔄 Retry: NÃO DISPONÍVEL
❌ Mensagens Proativas: INATIVAS
```

### DEPOIS (com REDIS_URL)
```
✅ Workers: HABILITADOS
📨 Processamento: ASSÍNCRONO (BullMQ)
⏱️  Response Time: 100-200ms
🔄 Retry: AUTOMÁTICO (3x)
✅ Mensagens Proativas: ATIVAS
✅ Follow-ups: AUTOMÁTICOS
```

---

## 📚 RECURSOS

### Dashboards
- **Render Service**: https://dashboard.render.com/web/srv-d3eu56ali9vc73dpca3g
- **Upstash Console**: https://console.upstash.com/

### Documentação
- **Render Environment Variables**: https://render.com/docs/configure-environment-variables
- **Upstash Redis**: https://docs.upstash.com/redis

---

## 🎉 PRÓXIMOS PASSOS

Após configurar REDIS_URL com sucesso:

1. **Testar mensagens proativas** Aurora
2. **Validar agendamentos** automáticos
3. **Verificar follow-ups** funcionando
4. **Monitorar performance** no Render dashboard
5. **Configurar alertas** para falhas de workers

---

**Criado por**: Claude Code (Deployment Engineer)
**Data**: 2025-10-02
