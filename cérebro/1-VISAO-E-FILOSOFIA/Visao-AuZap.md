---
tags: [visao, filosofia, produto, estrategia]
created: 2025-10-03
layer: 1
status: active
connects_to:
  - "[[Principio-Impacto-Maior-Atividade]]"
  - "[[Dual-AI-Philosophy]]"
  - "[[../2-ARQUITETURA-SISTEMICA/Sistema-Completo]]"
  - "[[../6-FEATURES-E-VERTICAIS/Training-Plans]]"
---

# 🎯 Visão AuZap

> **"Transformar cada petshop em um negócio inteligente onde tecnologia gera impacto real, não apenas atividade."**

## 🌍 O Problema Que Resolvemos

### Dor Real dos Petshops
- ❌ **Tempo perdido com WhatsApp**: 4-6 horas/dia respondendo mensagens repetitivas
- ❌ **Agendamentos manuais**: Conflitos, esquecimentos, retrabalho
- ❌ **Clientes esquecidos**: 30-40% dos clientes param de vir sem follow-up
- ❌ **Falta de visibilidade**: Donos não sabem o que está acontecendo no negócio
- ❌ **Conhecimento disperso**: Informações de pets, vacinas, preferências em WhatsApp caótico

### Custo de Oportunidade
- 💸 **R$ 3.000-5.000/mês** em receita perdida por clientes esquecidos
- ⏰ **25-30 horas/mês** de trabalho manual que poderia ser automatizado
- 😤 **Estresse operacional**: Equipe sobrecarregada, erro humano

---

## 💡 Nossa Solução: Dual AI System

### O Que É o AuZap?

**SaaS multi-tenant** que conecta petshops ao WhatsApp com **dois agentes de IA**:

#### 1. **Agente Cliente** (Customer-Facing AI)
🤖 Atende clientes automaticamente via WhatsApp

**Capacidades**:
- Cadastrar pets e tutores
- Agendar serviços
- Responder FAQs (horários, preços, disponibilidade)
- Criar planos de adestramento
- Reservar daycare/hotel
- Registrar protocolos BIPE (saúde comportamental)
- Consultar base de conhecimento

**Tom**: Profissional, empático, focado em resolver

#### 2. **Aurora** (Owner AI Partner)
✨ Parceira estratégica do dono, com contexto completo do negócio

**Capacidades**:
- **Análise financeira**: Receita, ticket médio, crescimento
- **Identificação de oportunidades**: Clientes esquecidos, agenda vazia
- **Respostas específicas**: "Quantos banhos em Yorkshires esta semana?"
- **Alertas proativos**: No-shows aumentando, meta batida
- **Sugestões estratégicas**: Campanhas, otimizações de preço
- **Handoff inteligente**: Pode transferir para Agente Cliente quando necessário

**Tom**: Customer Success Manager, data-driven, parceira de negócio

---

## 🎯 Diferencial Estratégico

### 1. Native WhatsApp (Baileys)
❌ Não é chatbot em site  
❌ Não é integração oficial cara  
✅ **Protocolo nativo** - Funciona como WhatsApp real, sem custos por mensagem

### 2. Dual AI Context-Aware
❌ Não é chatbot burro único  
✅ **Dois cérebros especializados**: Um para cliente, um para dono  
✅ **Context switching inteligente**: Detecta automaticamente quem está falando

### 3. Multi-Tenant com RLS
❌ Não é sistema genérico  
✅ **Petshop como tenant**: Isolamento total de dados  
✅ **Security first**: RLS no banco, JWT, rate limiting

### 4. Vertical-Specific Features
❌ Não é CRM genérico  
✅ **Features específicas de pet**: Training, Daycare, BIPE Protocol  
✅ **Knowledge Base**: Respostas específicas da clínica

---

## 🚀 Impacto Mensurável

### Para o Petshop (Dono)
- 💰 **+R$ 3.000-5.000/mês**: Recuperação de clientes esquecidos
- ⏰ **-25 horas/mês**: Automação de agendamentos e FAQs
- 📈 **+15-20% receita**: Otimização de agenda e campanhas proativas
- 😌 **-80% estresse**: Aurora cuida da operação, alerta problemas
- 🎯 **Decisões data-driven**: Métricas em tempo real

### Para o Cliente (Tutor)
- ⚡ **Resposta instantânea**: 24/7, sem esperar humano
- 📅 **Agendamento fácil**: 3 mensagens, sem ligação
- 🐕 **Histórico completo**: Vacinas, consultas, preferências
- 📚 **Informação útil**: Dicas de adestramento, cuidados
- 💬 **Conversa natural**: IA que entende contexto

---

## 🎨 Princípios de Produto

### "Impacto > Atividade"
Veja: [[Principio-Impacto-Maior-Atividade]]

Não medimos "5.000 mensagens processadas"  
Medimos "Economizou 12 horas e gerou R$ 3.200 em bookings"

### "Context is King"
Aurora conhece TUDO sobre o negócio:
- 6+ data sources (bookings, pets, revenue, services)
- Histórico completo de interações
- Padrões de comportamento

### "Automate the Boring, Augment the Important"
- Automação: FAQs, agendamentos, lembretes
- Augmentation: Aurora sugere, dono decide; IA atende, humano intervém quando necessário

---

## 🌱 Evolução do Produto

### Fase 1: MVP (Concluída - Ago 2025)
- ✅ Agente Cliente básico (cadastro, booking, FAQ)
- ✅ Aurora com contexto limitado
- ✅ WhatsApp integration (Baileys)
- ✅ Dashboard básico

### Fase 2: Enhanced (Concluída - Out 2025)
- ✅ Aurora com 6+ data sources (contexto completo)
- ✅ 4 novas verticais (Training, Daycare, BIPE, KB)
- ✅ AI Handoff (Aurora → Cliente)
- ✅ Dashboard com dados reais
- ✅ 12+ AI functions

### Fase 3: Proativo (Nov 2025)
- 🚧 Mensagens proativas Aurora (18h daily summary)
- 🚧 Detecção automática de oportunidades
- 🚧 Campanhas automáticas
- ⏳ Workers para vasculhada proativa

### Fase 4: Scale (Dez 2025+)
- 📋 Beta petshop onboarding
- 📋 Mobile app para donos
- 📋 Analytics avançado
- 📋 Integrações (PagBank, RD Station)

---

## 🎯 Visão de Longo Prazo

**2025**: 10 petshops beta, validação de fit  
**2026**: 100 petshops pagantes, ARR R$ 240k  
**2027**: 1.000 petshops, ARR R$ 2.4M, Series A

### Expansão Vertical
1. **Petshops** (atual)
2. **Clínicas veterinárias** (2026)
3. **Pet grooming/daycare** (2026)
4. **Pet stores** (2027)

### Expansão Horizontal
1. **WhatsApp automation** (atual)
2. **Multi-channel** (Instagram, Telegram - 2026)
3. **Voice AI** (atendimento telefônico - 2027)

---

## 🔗 Conexões no Cérebro

- [[Principio-Impacto-Maior-Atividade]] - UX core principle
- [[Dual-AI-Philosophy]] - Por que dois agentes?
- [[../2-ARQUITETURA-SISTEMICA/Sistema-Completo]] - Como funciona tecnicamente
- [[../4-AI-SERVICES/Aurora-Service]] - Aurora implementation
- [[../4-AI-SERVICES/Client-AI-Service]] - Agente Cliente implementation

---

**💡 "AuZap não é um chatbot. É um segundo cérebro para o petshop."**
