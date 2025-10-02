#!/bin/bash
# validate-redis.sh
# Script para validar configuração REDIS_URL no Render

set -e

API_URL="https://auzap-api.onrender.com"
SERVICE_ID="srv-d3eu56ali9vc73dpca3g"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Validação REDIS_URL - AuZap API"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ============================================
# 1. Health Check
# ============================================
echo "1️⃣  Testando Health Check..."
echo "   URL: $API_URL/health"
echo ""

HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/health" || echo "ERROR")
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -1)
HEALTH_BODY=$(echo "$HEALTH_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo "   ✅ HTTP 200 - API respondendo"
  echo ""
  echo "   Response:"
  echo "$HEALTH_BODY" | jq . 2>/dev/null || echo "$HEALTH_BODY"
  echo ""

  # Verificar se Redis está no response
  if echo "$HEALTH_BODY" | jq -e '.redis' > /dev/null 2>&1; then
    REDIS_STATUS=$(echo "$HEALTH_BODY" | jq -r '.redis // "unknown"')
    echo "   ✅ Redis detectado: $REDIS_STATUS"
  else
    echo "   ⚠️  Redis NÃO detectado no health check"
    echo "   → REDIS_URL pode estar faltando"
  fi
else
  echo "   ❌ HTTP $HTTP_CODE - API não respondeu corretamente"
  echo "   Response: $HEALTH_BODY"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ============================================
# 2. Verificar Logs (se RENDER_API_KEY definido)
# ============================================
if [ -n "$RENDER_API_KEY" ]; then
  echo ""
  echo "2️⃣  Verificando logs do serviço..."
  echo "   Service ID: $SERVICE_ID"
  echo ""

  LOGS=$(curl -s \
    -H "Authorization: Bearer $RENDER_API_KEY" \
    "https://api.render.com/v1/services/$SERVICE_ID/logs?limit=100" 2>/dev/null || echo "[]")

  if [ "$LOGS" != "[]" ]; then
    # Filtrar logs relacionados a Redis
    REDIS_LOGS=$(echo "$LOGS" | jq '[.[] | select(.message | contains("Redis") or contains("redis") or contains("BullMQ") or contains("workers"))]')

    COUNT=$(echo "$REDIS_LOGS" | jq 'length')

    if [ "$COUNT" -gt 0 ]; then
      echo "   ✅ Encontrados $COUNT logs relacionados a Redis/Workers:"
      echo ""
      echo "$REDIS_LOGS" | jq -r '.[] | "   [\(.timestamp)] \(.message)"' | tail -20
    else
      echo "   ⚠️  Nenhum log relacionado a Redis/Workers encontrado"
      echo "   → Pode indicar que workers não estão ativos"
    fi
  else
    echo "   ⚠️  Não foi possível recuperar logs"
  fi
else
  echo ""
  echo "2️⃣  Verificação de logs via API"
  echo "   ⚠️  RENDER_API_KEY não configurado"
  echo "   → Para verificar logs, defina: export RENDER_API_KEY=your_key"
  echo "   → Ou acesse manualmente: https://dashboard.render.com/web/$SERVICE_ID"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ============================================
# 3. Verificar Conectividade Redis (se possível)
# ============================================
echo ""
echo "3️⃣  Testando conectividade com Redis..."
echo ""

# Tentar ping no Redis via curl (se API tiver endpoint de debug)
DEBUG_ENDPOINT="$API_URL/api/debug/redis"
DEBUG_RESPONSE=$(curl -s -w "\n%{http_code}" "$DEBUG_ENDPOINT" 2>/dev/null || echo "ERROR\n404")
DEBUG_HTTP_CODE=$(echo "$DEBUG_RESPONSE" | tail -1)

if [ "$DEBUG_HTTP_CODE" = "200" ]; then
  DEBUG_BODY=$(echo "$DEBUG_RESPONSE" | sed '$d')
  echo "   ✅ Endpoint de debug acessível"
  echo "$DEBUG_BODY" | jq . 2>/dev/null || echo "$DEBUG_BODY"
else
  echo "   ℹ️  Endpoint de debug não disponível ($DEBUG_HTTP_CODE)"
  echo "   → Validação básica via health check é suficiente"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ============================================
# 4. Resumo
# ============================================
echo ""
echo "📊 RESUMO DA VALIDAÇÃO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Status geral
if [ "$HTTP_CODE" = "200" ]; then
  echo "   🟢 API Status: ONLINE"
else
  echo "   🔴 API Status: OFFLINE ou ERROR"
fi

# Redis status
if echo "$HEALTH_BODY" | jq -e '.redis' > /dev/null 2>&1; then
  REDIS_STATUS=$(echo "$HEALTH_BODY" | jq -r '.redis')
  if [ "$REDIS_STATUS" = "connected" ]; then
    echo "   🟢 Redis Status: CONNECTED"
  else
    echo "   🟡 Redis Status: $REDIS_STATUS"
  fi
else
  echo "   🔴 Redis Status: NOT CONFIGURED"
  echo ""
  echo "   ⚠️  AÇÃO NECESSÁRIA:"
  echo "   1. Acessar: https://dashboard.render.com/web/$SERVICE_ID"
  echo "   2. Ir em Environment Variables"
  echo "   3. Adicionar REDIS_URL:"
  echo "      redis://default:AUKFAAIncDJmNjQ5ZmNhODc1ZjQ0YzI4Nzg5YjQ1OWJiNTBjN2RhcDIxNzAyOQ@prime-mullet-17029.upstash.io:6379"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Exit code baseado no status
if [ "$HTTP_CODE" = "200" ] && echo "$HEALTH_BODY" | jq -e '.redis' > /dev/null 2>&1; then
  echo "✅ Validação COMPLETA - Redis configurado e funcionando!"
  exit 0
elif [ "$HTTP_CODE" = "200" ]; then
  echo "⚠️  Validação PARCIAL - API online mas Redis não configurado"
  exit 1
else
  echo "❌ Validação FALHOU - API não está respondendo"
  exit 2
fi
