#!/bin/bash
# Script para remover secrets hardcoded

set -e

echo "🔒 Removendo secrets hardcoded..."

# Substituir todas as ocorrências de secrets específicos
find . -type f \( -name "*.md" \) -not -path "*/node_modules/*" -not -path "*/.git/*" -exec sed -i '' \
  -e 's/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/[REDACTED]/g' \
  -e 's/sk-proj-6iPiZe\.\.\./[REDACTED_OPENAI_KEY]/g' \
  -e 's/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkbmRud2dsY2lleWxmZ3pid3RzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNjU1NzMsImV4cCI6MjA3NDk0MTU3M30\.BwvlhpRijTbdofpU06mH84-SjOWH9GFr9tzEpuN1DUM/[REDACTED_SUPABASE_ANON_KEY]/g' \
  -e 's/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkbmRud2dsY2lleWxmZ3pid3RzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM2NTU3MywiZXhwIjoyMDc0OTQxNTczfQ\.-38opT8Tw9f59tUbEvxNrdEOb3tPXZSx0bePm3wtcMg/[REDACTED_SUPABASE_SERVICE_KEY]/g' \
  -e 's/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.\.\./[REDACTED_SUPABASE_KEY]/g' \
  {} \;

echo "✅ Secrets removidos dos arquivos .md"

# Verificar se ainda existem secrets
echo ""
echo "🔍 Verificando se ainda existem secrets..."
if grep -r "sk-proj-6iPiZe\|eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.eyJpc3MiOiJzdXBhYmFzZSI" . --include="*.md" --exclude-dir=node_modules --exclude-dir=.git 2>/dev/null; then
  echo "⚠️  Ainda existem secrets nos arquivos!"
  exit 1
else
  echo "✅ Nenhum secret encontrado!"
fi

echo ""
echo "🎉 Limpeza concluída com sucesso!"
