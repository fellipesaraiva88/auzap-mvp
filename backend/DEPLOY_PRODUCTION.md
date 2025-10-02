# Deploy em Produção - Render.com

## IMPORTANTE: Habilitar Redis Workers

Atualmente os workers estão DESABILITADOS em produção porque `REDIS_URL` não está configurado.

---

## Passo a Passo

### 1. Adicionar REDIS_URL no Render

1. Acessar: https://dashboard.render.com/
2. Selecionar serviço: `auzap-mvp-backend`
3. Clicar em **Environment** no menu lateral
4. Clicar em **Add Environment Variable**
5. Adicionar:
   - **Key:** `REDIS_URL`
   - **Value:** `redis://default:AUKFAAIncDJmNjQ5ZmNhODc3NWY0NGMyODc4OWI0NTliYjUwYzdkYXAyMTcwMjk@prime-mullet-17029.upstash.io:6379`
6. Clicar em **Save Changes**

**Nota:** O Render irá rebuildar automaticamente após salvar.

---

### 2. Aguardar Deploy

O deploy leva aproximadamente 3-5 minutos.

Acompanhar em: https://dashboard.render.com/web/[service-id]/deploys

---

### 3. Validar Workers

Após deploy completo, verificar logs:

**Logs esperados:**
```
✅ Message processor worker ready
✅ Follow-up scheduler worker ready
✅ Aurora proactive worker ready
✅ Proactive cron jobs configured
   - Daily summary: 18:00
   - Birthdays: 09:00
   - Inactive clients: Monday 10:00
   - Opportunities: Tuesday/Thursday 15:00
```

**Se aparecer warning:**
```
⚠️ Redis not configured - workers disabled in production
💡 Messages will be processed synchronously
```
→ Significa que REDIS_URL não foi configurado corretamente.

---

### 4. Testar Funcionalidade

**4.1 Enviar mensagem de teste via WhatsApp**

Enviar para instância conectada:
```
Olá! Teste de mensagem
```

**4.2 Verificar logs no Render**

Buscar por:
```
Processing message
✅ Job completed
```

**4.3 Verificar no Supabase**

- Tabela `messages`: Nova mensagem salva
- Tabela `conversations`: Conversa atualizada
- Tabela `contacts`: Contato criado/atualizado

---

## Troubleshooting

### Problema: Workers não iniciam

**Sintoma:**
```
⚠️ Redis not configured
```

**Solução:**
1. Verificar que REDIS_URL existe em Environment Variables
2. Verificar formato: `redis://default:TOKEN@HOST:6379`
3. Rebuild manual se necessário

---

### Problema: Connection timeout

**Sintoma:**
```
Error: ECONNRESET
Error: ETIMEDOUT
```

**Solução:**
1. Verificar que TLS está habilitado no código:
```typescript
tls: { rejectUnauthorized: false }
```
2. Verificar Upstash dashboard: https://console.upstash.com/

---

### Problema: Rate limit exceeded

**Sintoma:**
```
Error: Too many requests
```

**Solução:**
1. Upstash free tier: 10k commands/day
2. Ver usage no dashboard
3. Upgrade para paid tier se necessário

---

## Rollback

Se algo der errado:

### Opção 1: Remover REDIS_URL

1. Environment → Delete `REDIS_URL`
2. Save → Rebuild
3. Sistema volta a processamento síncrono (sem queues)

### Opção 2: Reverter commit

```bash
git revert c966d70
git push origin main
```

---

## Verificação Final

Checklist pós-deploy:

- [ ] REDIS_URL adicionado no Render
- [ ] Deploy completo sem erros
- [ ] Workers iniciados (ver logs)
- [ ] Mensagem de teste processada
- [ ] Queue funcionando (verificar Upstash dashboard)
- [ ] Sem erros nos logs

---

## Monitoramento Contínuo

### Render Logs
```
# Ver últimos logs
https://dashboard.render.com/web/[service-id]/logs

# Filtrar por erro
Search: "error" or "failed"
```

### Upstash Dashboard
```
https://console.upstash.com/

- Ver commands/day usage
- Ver latência
- Ver erros
```

### Supabase Dashboard
```
https://supabase.com/dashboard/project/cdndnwglcieylfgzbwts

- Table Editor → messages
- Table Editor → conversations
- SQL Editor → queries customizadas
```

---

## Próximos Passos

Após validar produção:

1. Monitorar por 24h
2. Verificar performance (latência, throughput)
3. Ajustar concurrency se necessário
4. Implementar alertas
5. Documentar métricas

---

**Última atualização:** 2025-10-02
**Responsável:** Backend Architect
