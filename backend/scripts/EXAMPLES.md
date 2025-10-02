# 🎯 Exemplos Práticos de Uso dos Scripts

Exemplos reais de como usar os scripts WhatsApp no dia a dia.

---

## 📋 Cenário 1: Configurando Nova Instância

**Situação:** Você criou uma nova instância WhatsApp e quer validar se está funcionando.

```bash
# 1. Ver todas as instâncias disponíveis
npm run whatsapp:list

# Resultado:
# ┌────────────────────────────────┬───────────────┬─────────────────────┐
# │ Nome                           │ Status        │ Telefone            │
# ├────────────────────────────────┼───────────────┼─────────────────────┤
# │ Minha Nova Instância           │ ⚠️  qr_pending│ Não configurado     │
# └────────────────────────────────┴───────────────┴─────────────────────┘

# 2. Inspecionar instância específica para pegar o pairing code
npm run whatsapp:inspect inst-abc-123

# Resultado mostrará pairing code se disponível

# 3. Após conectar, validar conexão
npm run whatsapp:inspect inst-abc-123

# Status deve mostrar: ✅ CONNECTED

# 4. Enviar mensagem de teste
npm run whatsapp:send org-xyz inst-abc-123 5511999999999 "Olá! Testando nova instância"

# 5. Verificar health geral
npm run whatsapp:health
```

---

## 🐛 Cenário 2: Debug de Instância Desconectada

**Situação:** Uma instância parou de responder.

```bash
# 1. Ver dashboard geral para identificar problemas
npm run whatsapp:dashboard

# Resultado mostra:
# │ Instância Vendas    │ ❌ disconnected │ 345    │ 0      │

# 2. Inspecionar detalhes da instância problemática
npm run whatsapp:inspect inst-vendas-456

# Analisar:
# - Última Conexão: quando foi a última vez conectada?
# - Session Data: está configurado?
# - Uptime: quanto tempo ficou online?

# 3. Verificar saúde geral do sistema
npm run whatsapp:health

# Se Redis estiver offline:
# ⚠️  Redis/BullMQ: Operando sem Redis (modo in-memory)

# 4. Tentar enviar mensagem para forçar reconexão
npm run whatsapp:send org-xyz inst-vendas-456 5511999999999 "Teste de reconexão"

# Se falhar, verificar logs do servidor e reiniciar instância
```

---

## 🧪 Cenário 3: Testar Processamento de Mensagens

**Situação:** Você implementou um novo worker/automação e quer testar sem WhatsApp real.

```bash
# 1. Simular mensagem de cliente perguntando sobre produtos
npm run whatsapp:simulate org-xyz inst-abc-123 5511988887777 "Olá, gostaria de saber sobre produtos disponíveis"

# Resultado:
# ✅ Mensagem simulada com sucesso!
# Job ID: 42
# Queue: process-message

# 2. Em outro terminal, rodar worker para processar
npm run worker

# Logs do worker mostrarão processamento em tempo real

# 3. Simular sequência de mensagens para testar conversa
npm run whatsapp:simulate org-xyz inst-abc-123 5511988887777 "Quanto custa?"
npm run whatsapp:simulate org-xyz inst-abc-123 5511988887777 "Pode enviar catálogo?"

# 4. Verificar se mensagens foram processadas
npm run whatsapp:inspect inst-abc-123

# Ver contador de mensagens aumentar:
# Mensagens:
#   Total:    15
#   Hoje:     3
```

---

## 📊 Cenário 4: Monitoramento Diário

**Situação:** Você quer verificar como está o sistema no início do dia.

```bash
# 1. Dashboard completo
npm run whatsapp:dashboard

# Resultado mostra overview:
# ╔═══════════════════════════════════════════════════════════════════╗
# ║                          📊 Resumo Geral                          ║
# ╠═══════════════════════════════════════════════════════════════════╣
# ║  Total de Instâncias:        5                                    ║
# ║  ✅ Conectadas:              4                                    ║
# ║  ❌ Desconectadas:           1                                    ║
# ║  💬 Mensagens Hoje:          247                                  ║
# ║  📈 Mensagens/Hora:          10.3                                 ║
# ╚═══════════════════════════════════════════════════════════════════╝

# 2. Health check dos serviços
npm run whatsapp:health

# Deve mostrar:
# ✅ Supabase: Online
# ✅ Redis/BullMQ: Fila funcional
# ✅ WhatsApp Instances: 4 instâncias conectadas

# 3. Se tudo OK, sistema está saudável!
```

---

## 🚀 Cenário 5: Deploy de Nova Feature

**Situação:** Você fez deploy de uma nova feature e quer validar produção.

```bash
# 1. Antes do deploy, verificar estado atual
npm run whatsapp:dashboard > pre-deploy.txt

# 2. Fazer deploy...

# 3. Após deploy, health check imediato
npm run whatsapp:health

# Se algum serviço falhar:
# ❌ Sistema com Erros Críticos
# Reverter deploy!

# 4. Se saúde OK, testar instâncias específicas
npm run whatsapp:list

# 5. Testar envio em instância crítica (vendas)
npm run whatsapp:send org-xyz inst-vendas 5511999999999 "Teste pós-deploy"

# 6. Simular mensagem para testar novo worker
npm run whatsapp:simulate org-xyz inst-vendas 5511988887777 "Teste de automação nova"

# 7. Dashboard final para comparar
npm run whatsapp:dashboard > post-deploy.txt
diff pre-deploy.txt post-deploy.txt

# Se tudo OK, deploy validado! ✅
```

---

## 🔧 Cenário 6: Investigar Performance

**Situação:** Usuários reportam lentidão nas mensagens.

```bash
# 1. Dashboard para ver volume geral
npm run whatsapp:dashboard

# Verificar:
# - Mensagens/Hora está muito alto? (> 100)
# - Alguma instância com volume anormal?

# 2. Inspecionar instância com mais mensagens
npm run whatsapp:inspect inst-com-mais-msgs

# Verificar:
# - Total de mensagens
# - Mensagens hoje
# - Uptime (conexão estável?)

# 3. Health check para ver gargalos
npm run whatsapp:health

# Se Redis mostrar aviso:
# ⚠️  Redis/BullMQ: Operando sem Redis (modo in-memory)
# ^ Possível gargalo!

# 4. Simular mensagem para medir tempo
time npm run whatsapp:simulate org-xyz inst-abc 5511999999999 "Teste de performance"

# Tempo deve ser < 1 segundo

# 5. Se lento, investigar:
# - Logs do worker
# - Conexão com Supabase
# - Tamanho da fila (Redis)
```

---

## 🎭 Cenário 7: Testar Múltiplas Instâncias

**Situação:** Você tem várias instâncias e quer testar broadcast.

```bash
# 1. Listar todas as instâncias
npm run whatsapp:list

# 2. Para cada instância, enviar mensagem de teste
npm run whatsapp:send org-xyz inst-1 5511999999999 "Teste broadcast - Instância 1"
npm run whatsapp:send org-xyz inst-2 5511999999999 "Teste broadcast - Instância 2"
npm run whatsapp:send org-xyz inst-3 5511999999999 "Teste broadcast - Instância 3"

# 3. Ou usar loop bash para automação
for instance in inst-1 inst-2 inst-3; do
  npm run whatsapp:send org-xyz $instance 5511999999999 "Teste automático de $instance"
done

# 4. Verificar dashboard após envios
npm run whatsapp:dashboard

# Todas as instâncias devem mostrar +1 mensagem
```

---

## 📈 Cenário 8: Análise de Dados

**Situação:** Você quer extrair estatísticas para relatório.

```bash
# 1. Dashboard completo com redirecionamento
npm run whatsapp:dashboard org-xyz > dashboard-report.txt

# 2. Health check para incluir no relatório
npm run whatsapp:health >> dashboard-report.txt

# 3. Detalhes de cada instância
npm run whatsapp:list >> dashboard-report.txt

# 4. Para cada instância importante, inspecionar
npm run whatsapp:inspect inst-vendas >> dashboard-report.txt
npm run whatsapp:inspect inst-suporte >> dashboard-report.txt

# 5. Arquivo dashboard-report.txt agora contém:
# - Overview geral
# - Status de cada serviço
# - Lista de instâncias
# - Detalhes individuais
# - Estatísticas de mensagens

# 6. Enviar relatório para stakeholders
cat dashboard-report.txt | mail -s "Relatório WhatsApp" stakeholder@empresa.com
```

---

## 🆘 Cenário 9: Troubleshooting Urgente

**Situação:** Sistema parou de funcionar em produção!

```bash
# CHECKLIST RÁPIDO:

# 1. Health check (30 segundos)
npm run whatsapp:health

# Se falhar, identificar serviço:
# ❌ Supabase → Verificar conexão/credenciais
# ❌ Redis → Verificar Upstash
# ❌ WhatsApp → Verificar instâncias

# 2. Dashboard rápido (10 segundos)
npm run whatsapp:dashboard

# Identificar quantas instâncias estão offline

# 3. Para cada instância offline (20 segundos cada)
npm run whatsapp:inspect inst-offline-1

# Verificar:
# - Última conexão
# - Session data
# - Erros recentes

# 4. Tentar reconexão forçada (30 segundos)
npm run whatsapp:send org-xyz inst-offline-1 5511999999999 "Teste de reconexão"

# 5. Se persistir, reiniciar servidor
# Após reinício, validar:
npm run whatsapp:health
npm run whatsapp:dashboard

# TEMPO TOTAL: ~3-5 minutos para diagnóstico completo
```

---

## 💡 Dicas Avançadas

### Combinar com outras ferramentas

```bash
# Filtrar apenas instâncias conectadas
npm run whatsapp:list | grep "✅"

# Contar mensagens processadas hoje
npm run whatsapp:dashboard | grep "Mensagens Hoje" | awk '{print $3}'

# Alertar se < 3 instâncias conectadas
CONNECTED=$(npm run whatsapp:dashboard | grep "Conectadas" | awk '{print $2}')
if [ $CONNECTED -lt 3 ]; then
  echo "ALERTA: Poucas instâncias conectadas!"
fi

# Cron job para health check diário
0 8 * * * cd /app/backend && npm run whatsapp:health >> /var/log/whatsapp-health.log
```

### Scripting automatizado

```bash
# Script de monitoramento contínuo
#!/bin/bash
while true; do
  clear
  npm run whatsapp:dashboard
  sleep 60  # Atualizar a cada 60 segundos
done

# Salvar como: monitor.sh
# Executar: chmod +x monitor.sh && ./monitor.sh
```

### Integração com CI/CD

```yaml
# GitHub Actions
- name: Validate WhatsApp System
  run: |
    cd backend
    npm run whatsapp:health
    if [ $? -ne 0 ]; then
      echo "WhatsApp system unhealthy, aborting deploy"
      exit 1
    fi
```

---

**Estes exemplos cobrem os casos de uso mais comuns. Adapte conforme sua necessidade!**
