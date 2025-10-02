# 📱 WhatsApp Development Scripts

Scripts utilitários para facilitar o desenvolvimento e depuração do sistema WhatsApp do AuZap.

## 🎯 Scripts Disponíveis

### 1. **whatsapp:send** - Enviar Mensagem de Teste

Envia uma mensagem de teste para validar que uma instância está funcionando corretamente.

```bash
npm run whatsapp:send <orgId> <instanceId> <phone> "message"
```

**Exemplo:**
```bash
npm run whatsapp:send org-123 inst-456 5511999999999 "Olá, esta é uma mensagem de teste!"
```

**Parâmetros:**
- `orgId`: ID da organização
- `instanceId`: ID da instância WhatsApp
- `phone`: Número de telefone (com código do país, sem +)
- `message`: Texto da mensagem (entre aspas)

**Uso:**
- Testar conectividade de instância
- Validar envio de mensagens
- Debug de problemas de envio

---

### 2. **whatsapp:inspect** - Inspecionar Instância

Exibe informações detalhadas sobre uma instância WhatsApp específica.

```bash
npm run whatsapp:inspect <instanceId>
```

**Exemplo:**
```bash
npm run whatsapp:inspect inst-456
```

**Informações Exibidas:**
- Status da conexão
- Telefone configurado
- Estatísticas de mensagens
- Uptime da conexão
- QR Code e Pairing Code (se disponíveis)
- Timestamps de criação/atualização

**Uso:**
- Debug de problemas de conexão
- Verificar configuração de instância
- Analisar histórico de mensagens

---

### 3. **whatsapp:simulate** - Simular Mensagem Recebida

Simula uma mensagem recebida para testar o processamento sem precisar de WhatsApp real.

```bash
npm run whatsapp:simulate <orgId> <instanceId> <fromPhone> "message"
```

**Exemplo:**
```bash
npm run whatsapp:simulate org-123 inst-456 5511999999999 "Olá, quero saber sobre produtos"
```

**Parâmetros:**
- `orgId`: ID da organização
- `instanceId`: ID da instância WhatsApp
- `fromPhone`: Número do remetente simulado
- `message`: Conteúdo da mensagem

**Uso:**
- Testar processamento de mensagens
- Debug de workers e filas
- Validar fluxo de automação
- Testar sem WhatsApp conectado

**Observação:** A mensagem será adicionada na fila BullMQ e processada pelo worker normalmente.

---

### 4. **whatsapp:dashboard** - Dashboard CLI

Dashboard interativo com estatísticas de todas as instâncias.

```bash
npm run whatsapp:dashboard [orgId]
```

**Exemplos:**
```bash
# Ver todas as instâncias
npm run whatsapp:dashboard

# Filtrar por organização
npm run whatsapp:dashboard org-123
```

**Informações Exibidas:**
- Resumo geral (total de instâncias, status)
- Mensagens hoje e média por hora
- Tabela com todas as instâncias
- Detalhes individuais de cada instância
- Status de conexão em tempo real

**Uso:**
- Visão geral rápida do sistema
- Monitoramento de múltiplas instâncias
- Identificar problemas rapidamente

---

### 5. **whatsapp:health** - Health Check

Verifica status de todos os serviços críticos do sistema.

```bash
npm run whatsapp:health
```

**Serviços Verificados:**
- ✅ Supabase (conexão com banco de dados)
- ✅ Redis/BullMQ (filas de mensagens)
- ✅ WhatsApp Instances (conexões ativas)
- ✅ Message Processing (processamento recente)

**Códigos de Saída:**
- `0`: Sistema operacional
- `1`: Erros críticos detectados

**Uso:**
- Verificar saúde do sistema
- Debug de problemas de infraestrutura
- Validar deploy em produção
- Monitoramento automatizado (CI/CD)

---

### 6. **whatsapp:list** - Listar Instâncias

Lista todas as instâncias WhatsApp de forma simples.

```bash
npm run whatsapp:list [orgId]
```

**Exemplos:**
```bash
# Listar todas
npm run whatsapp:list

# Filtrar por organização
npm run whatsapp:list org-123
```

**Informações Exibidas:**
- Nome da instância
- Status atual (com emoji)
- Telefone configurado
- Tabela formatada e organizada

**Uso:**
- Descobrir IDs de instâncias
- Verificar status geral rapidamente
- Preparar comandos para outros scripts

---

## 🚀 Workflows Comuns

### Debug de Instância Problemática

```bash
# 1. Listar todas as instâncias
npm run whatsapp:list

# 2. Inspecionar instância específica
npm run whatsapp:inspect inst-456

# 3. Verificar health do sistema
npm run whatsapp:health

# 4. Testar envio de mensagem
npm run whatsapp:send org-123 inst-456 5511999999999 "Teste"
```

### Testar Processamento de Mensagens

```bash
# 1. Simular mensagem recebida
npm run whatsapp:simulate org-123 inst-456 5511999999999 "Olá"

# 2. Verificar logs do worker
# (em outro terminal)
npm run worker

# 3. Inspecionar contadores
npm run whatsapp:inspect inst-456
```

### Monitoramento Diário

```bash
# Dashboard geral
npm run whatsapp:dashboard

# Saúde do sistema
npm run whatsapp:health
```

---

## 📋 Pré-requisitos

Todos os scripts requerem:

1. **Variáveis de ambiente** configuradas (`.env`)
2. **Dependências instaladas** (`npm install`)
3. **TypeScript** configurado
4. **Supabase** acessível

---

## 🔧 Extensão dos Scripts

### Adicionar Novo Script

1. Criar arquivo em `/backend/scripts/meu-script.ts`
2. Adicionar shebang: `#!/usr/bin/env ts-node`
3. Implementar lógica
4. Adicionar em `package.json`:

```json
{
  "scripts": {
    "whatsapp:meu-script": "ts-node scripts/meu-script.ts"
  }
}
```

### Template de Script

```typescript
#!/usr/bin/env ts-node
/**
 * Script Name
 *
 * Description here
 *
 * Uso:
 * npm run whatsapp:script <args>
 */

import { supabase } from '../src/config/supabase';

async function main() {
  try {
    const args = process.argv.slice(2);

    // Validar argumentos
    if (!args[0]) {
      console.error('❌ Argumento necessário!');
      process.exit(1);
    }

    // Lógica principal
    console.log('✅ Script executado!');

  } catch (error: any) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

main();
```

---

## 💡 Dicas

- Use `whatsapp:dashboard` para visão geral rápida
- Use `whatsapp:inspect` para debug detalhado
- Use `whatsapp:simulate` para testar sem WhatsApp real
- Use `whatsapp:health` antes de deploy
- Combine com `grep` e `jq` para análises avançadas

---

## 📝 Notas Importantes

1. **Produção**: Tenha cuidado ao usar scripts de envio em produção
2. **Rate Limits**: WhatsApp tem limites de taxa, use com moderação
3. **Simulação**: Mensagens simuladas NÃO são enviadas para WhatsApp real
4. **Logs**: Todos os scripts logam suas operações para auditoria

---

## 🐛 Troubleshooting

### "Instance not found"
- Verifique se o `instanceId` está correto
- Use `whatsapp:list` para ver IDs disponíveis

### "Connection error"
- Verifique variáveis de ambiente (`.env`)
- Execute `whatsapp:health` para diagnosticar

### "Message not sent"
- Verifique se instância está `connected`
- Use `whatsapp:inspect` para ver status
- Valide formato do número de telefone

---

**Desenvolvido para facilitar o dia a dia do desenvolvedor AuZap! 🚀**
