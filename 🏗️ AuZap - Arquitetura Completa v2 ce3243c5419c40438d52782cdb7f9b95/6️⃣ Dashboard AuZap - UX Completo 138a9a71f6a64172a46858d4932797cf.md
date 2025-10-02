# 6️⃣ Dashboard AuZap - UX Completo

# Dashboard AuZap - UX para Donos com Aurora

**Sistema:** AuZap

**Assistente IA:** Aurora (conversa com os donos)

---

## 🏆 Princípio: Parceria, Não Ferramenta

**Shift de mindset:**

- ❌ "Dashboard de métricas"
- ✅ "Sua parceira Aurora sempre disponível"
- ❌ "Quantos banhos essa semana?"
- ✅ "Oi Aurora, como está o negócio?"
- ❌ "Gerar relatório"
- ✅ "Aurora, me mostra os números"

---

## 📱 Interface Principal

### **Layout: Chat Aurora + Cards Inteligentes**

```jsx
┌──────────────────────────────────────────────────────────────┐
│  🐾 AuZap                                    👤 Fellipe ▼   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  🤝 Aurora - Sua Parceira de Negócios                       │
│                                                              │
│  "Oi Fellipe! 👋 Preparei algumas coisas pra você hoje"     │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  🎯 INSIGHTS DO DIA (Aurora preparou)                        │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                                                        │ │
│  │  💡 Oportunidade Identificada                          │ │
│  │                                                        │ │
│  │  18 clientes não aparecem há mais de 60 dias          │ │
│  │                                                        │ │
│  │  💰 Receita potencial: R$ 3.240                        │ │
│  │                                                        │ │
│  │  [Pedir para Aurora contatar] [Ver lista]             │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                                                        │ │
│  │  🏖️ Feriado se aproximando (15/11)                   │ │
│  │                                                        │ │
│  │  12 clientes costumam usar hotel em feriados          │ │
│  │                                                        │ │
│  │  💰 Receita potencial: R$ 4.800                        │ │
│  │                                                        │ │
│  │  [Aurora, envia campanha] [Ver clientes]              │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  📊 NÚMEROS DE HOJE                                          │
│                                                              │
│  ┌──────────────┬──────────────┬──────────────┬───────────┐ │
│  │ 💰 Receita   │ 📅 Agendados │ 🐾 Clientes  │ ⏰ Tempo  │ │
│  │              │              │              │           │ │
│  │ R$ 2.340     │ 12 serviços  │ 8 atendidos  │ 4h livre  │ │
│  │ +15% vs ontem│ para hoje    │ hoje         │ com Aurora│ │
│  │              │              │              │           │ │
│  └──────────────┴──────────────┴──────────────┴───────────┘ │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  💬 Conversar com Aurora                                     │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                                                        │ │
│  │  [Você] Quantos banhos fizemos essa semana?           │ │
│  │                                                        │ │
│  │  [Aurora] 🐕 Essa semana foram 42 banhos!              │ │
│  │           Comparado com a semana passada (35),        │ │
│  │           você teve um aumento de 20%! 📈             │ │
│  │                                                        │ │
│  │           Receita total em banhos: R$ 2.100           │ │
│  │                                                        │ │
│  │  [Você] Preenche a agenda da próxima semana           │ │
│  │                                                        │ │
│  │  [Aurora] Claro! Vou analisar e contatar clientes 🔍 │ │
│  │                                                        │ │
│  │           Encontrei 23 pets que precisam de banho:    │ │
│  │           • 15 com intervalo de 15+ dias              │ │
│  │           • 8 com intervalo de 20+ dias               │ │
│  │                                                        │ │
│  │           Posso começar? Digite SIM                   │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌──────────────────────────────────────────────┐           │
│  │ Digite sua mensagem para Aurora...           │ [Enviar]  │
│  └──────────────────────────────────────────────┘           │
│                                                              │
│  💡 Sugestões:                                               │
│  • "Quais clientes estão inativos?"                         │
│  • "Como foi a semana?"                                     │
│  • "Agenda a próxima semana"                                │
│  • "Clientes que usam hotel"                                │
└──────────────────────────────────────────────────────────────┘
```

---

## 🗺️ Navegação AuZap

### **Sidebar Principal**

```jsx
┌─────────────────────────────┐
│  🐾 AuZap                   │  ← Logo
│  Pet Love                   │  ← Nome da Empresa
├─────────────────────────────┤
│                             │
│  🏠 Início                  │  ← Dashboard + Aurora
│                             │
│  💬 Conversas               │  ← IA Cliente (atende clientes)
│                             │
│  📅 Agenda                  │  ← Agendamentos
│                             │
│  👥 Clientes & Pets         │  ← Cadastros
│                             │
│  💰 Vendas                  │  ← Pedidos + Produtos
│                             │
│  🤝 Aurora                  │  ← Conversar com Aurora
│                             │  ← Automações
│                             │  ← Analytics
│                             │
│  ⚙️ Configurações           │  ← Ajustes gerais
│                             │
└─────────────────────────────┘
```

---

## 🤝 Tela: Aurora

### **Tab 1: Conversar**

```jsx
┌──────────────────────────────────────────────────────────────┐
│  🤝 Aurora                                                   │
│                                                              │
│  [Conversar] [Automações] [Histórico]                       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  💬 Chat com Aurora                                          │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                                                        │ │
│  │  [Aurora] Bom dia, Fellipe! ☀️                        │ │
│  │           Como posso ajudar hoje?                      │ │
│  │                                                        │ │
│  │  [Você] Quantos banhos tivemos essa semana?           │ │
│  │                                                        │ │
│  │  [Aurora] 🐕 Essa semana foram 42 banhos!              │ │
│  │                                                        │ │
│  │  📊 Detalhes:                                          │ │
│  │  • Segunda: 5 banhos (R$ 250)                         │ │
│  │  • Terça: 8 banhos (R$ 400)                           │ │
│  │  • Quarta: 12 banhos (R$ 600) ⭐ Melhor dia          │ │
│  │  • Quinta: 10 banhos (R$ 500)                         │ │
│  │  • Sexta: 7 banhos (R$ 350)                           │ │
│  │                                                        │ │
│  │  📈 Comparado com semana passada (35 banhos):         │ │
│  │  Crescimento de 20%! Parabéns! 🎉                     │ │
│  │                                                        │ │
│  │  💰 Receita total: R$ 2.100                            │ │
│  │                                                        │ │
│  │  Quer ver mais detalhes?                              │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌──────────────────────────────────────────────┐           │
│  │ Pergunte qualquer coisa para Aurora...       │ [Enviar]  │
│  └──────────────────────────────────────────────┘           │
│                                                              │
│  💡 Comandos úteis:                                          │
│  • "Preenche a agenda da semana que vem"                    │
│  • "Quais clientes não aparecem há mais de 30 dias?"        │
│  • "Como está a ocupação do hotel?"                         │
│  • "Envia campanha de Black Friday"                         │
│  • "Relatório do mês"                                       │
└──────────────────────────────────────────────────────────────┘
```

### **Tab 2: Automações**

```jsx
┌──────────────────────────────────────────────────────────────┐
│  🤝 Aurora                                                   │
│                                                              │
│  [Conversar] [Automações] [Histórico]                       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  🤖 Automações Ativas                                        │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                                                        │ │
│  │  🏖️ Campanha de Feriado                              │ │
│  │                                                        │ │
│  │  Status: ✅ Ativa                                      │ │
│  │  Próxima execução: 10 dias antes do feriado           │ │
│  │                                                        │ │
│  │  O que faz:                                            │ │
│  │  • Identifica clientes que usam hotel em feriados     │ │
│  │  • Envia oferta personalizada via WhatsApp            │ │
│  │  • Acompanha respostas automaticamente                │ │
│  │                                                        │ │
│  │  Histórico:                                            │ │
│  │  • Último feriado: 15 contatos, 8 reservas (R$ 3.200) │ │
│  │                                                        │ │
│  │  [Editar] [Desativar] [Ver resultados]                │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                                                        │ │
│  │  🔄 Reativação de Clientes Inativos                   │ │
│  │                                                        │ │
│  │  Status: ✅ Ativa                                      │ │
│  │  Frequência: A cada 30 dias                           │ │
│  │                                                        │ │
│  │  O que faz:                                            │ │
│  │  • Detecta clientes sem serviço há 60+ dias           │ │
│  │  • Envia mensagem personalizada com oferta            │ │
│  │  • Oferece agendamento facilitado                     │ │
│  │                                                        │ │
│  │  Resultados este mês:                                  │ │
│  │  • 23 contatos reativados                             │ │
│  │  • 12 agendamentos (taxa 52%)                         │ │
│  │  • R$ 1.440 em receita recuperada                     │ │
│  │                                                        │ │
│  │  [Editar] [Desativar] [Ver contatos]                  │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  [+ Criar Nova Automação]                                    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### **Tab 3: Histórico**

```jsx
┌──────────────────────────────────────────────────────────────┐
│  🤝 Aurora                                                   │
│                                                              │
│  [Conversar] [Automações] [Histórico]                       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  📜 Histórico de Interações                                  │
│                                                              │
│  Filtros: [Hoje] [Esta semana] [Este mês] [Personalizar]   │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                                                        │ │
│  │  📅 Hoje, 15:32                                        │ │
│  │                                                        │ │
│  │  [Você] Preenche a agenda da próxima semana           │ │
│  │                                                        │ │
│  │  [Aurora] ✅ Ação executada                            │ │
│  │                                                        │ │
│  │  Resultados:                                           │ │
│  │  • 23 clientes contatados                             │ │
│  │  • 12 visualizaram                                     │ │
│  │  • 5 responderam positivamente                         │ │
│  │  • 2 agendamentos confirmados                          │ │
│  │                                                        │ │
│  │  [Ver detalhes]                                        │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                                                        │ │
│  │  📅 Hoje, 09:15                                        │ │
│  │                                                        │ │
│  │  [Você] Quantos banhos fizemos essa semana?           │ │
│  │                                                        │ │
│  │  [Aurora] 📊 Analytics fornecido                       │ │
│  │                                                        │ │
│  │  Resposta: 42 banhos, R$ 2.100 em receita             │ │
│  │                                                        │ │
│  │  [Ver conversa completa]                              │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                                                        │ │
│  │  📅 Ontem, 18:00                                       │ │
│  │                                                        │ │
│  │  [Aurora] 📊 Resumo diário enviado automaticamente    │ │
│  │                                                        │ │
│  │  • 12 atendimentos realizados                         │ │
│  │  • R$ 1.450 em receita                                │ │
│  │  • 8 agendamentos para hoje                           │ │
│  │                                                        │ │
│  │  [Ver resumo completo]                                │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

## 📊 Tela: Início (Dashboard Principal)

```jsx
┌──────────────────────────────────────────────────────────────┐
│  🏠 Início                                                   │
│                                                              │
│  Bom dia, Fellipe! 👋                                        │
│  A IA Cliente já atendeu 23 pessoas hoje                    │
│  Aurora tem 2 insights pra você                             │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  🤝 AURORA TEM NOVIDADES PARA VOCÊ                           │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                                                        │ │
│  │  💡 "Fellipe, identifiquei 18 clientes inativos"      │ │
│  │                                                        │ │
│  │  Receita potencial: R$ 3.240                          │ │
│  │                                                        │ │
│  │  [Conversar com Aurora] [Ver lista]                   │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  📊 NÚMEROS DE HOJE                                          │
│                                                              │
│  ┌──────────────┬──────────────┬──────────────┬───────────┐ │
│  │ 💰 R$ 2.340  │ 📅 12 agendas│ 🐾 8 clientes│ ⏰ 4h     │ │
│  │ Receita hoje │ para hoje    │ atendidos    │ economizadas│
│  │ +15% ontem   │              │              │ com Aurora│ │
│  └──────────────┴──────────────┴──────────────┴───────────┘ │
│                                                              │
│  💬 IA CLIENTE TRABALHANDO                                   │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                                                        │ │
│  │  • 23 conversas ativas                                 │ │
│  │  • 8 pets cadastrados automaticamente                  │ │
│  │  • 5 agendamentos criados pela IA                      │ │
│  │  • 2 vendas fechadas (R$ 340)                         │ │
│  │                                                        │ │
│  │  [Ver conversas]                                       │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

## 🎨 Design System

### **Cores**

```css
/* AuZap Brand */
--auzap-primary: #6B5CE7;        /* Roxo principal */
--auzap-primary-dark: #5245C2;
--auzap-primary-light: #9B8FF5;

/* Aurora (IA Parceira) */
--aurora-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
--aurora-text: #764ba2;
--aurora-bg: #F3F0FF;

/* IA Cliente */
--ai-client: #4CAF50;
--ai-client-bg: #E8F5E9;

/* Status */
--success: #4CAF50;
--warning: #FFC107;
--error: #F44336;
--info: #2196F3;
```

### **Componentes Aurora**

**Badge Aurora:**

```jsx
┌──────────────────┐
│ 🤝 Aurora        │
│ 2 novidades      │
└──────────────────┘
```

**Card de Insight:**

```jsx
┌────────────────────────────────┐
│  💡 Insight da Aurora          │
│                                │
│  [Conteúdo do insight]         │
│                                │
│  [Ação sugerida]               │
└────────────────────────────────┘
```

---

## 📱 Mobile

### **App Mobile: Chat Aurora Prioritário**

```jsx
┌──────────────────────┐
│  🐾 AuZap            │
│                      │
│  🤝 Aurora           │
│  "Como posso         │
│  ajudar?"            │
│                      │
│  [Digite sua msg...] │
│                      │
│  ──────────────────  │
│                      │
│  📊 Hoje             │
│  R$ 2.340            │
│  12 agendamentos     │
│                      │
│  [Ver mais]          │
└──────────────────────┘
```

---

## 🚀 Fluxo de Onboarding

### **Primeira vez que o dono acessa:**

```jsx
1. "Olá! Sou a Aurora, sua parceira de negócios ✨"
   
2. "Vou te ajudar a gerenciar tudo via WhatsApp"
   
3. "Cadastre seu número pessoal para conversarmos:"
   [+55 11 99999-9999]
   
4. "Pronto! Me manda uma mensagem e vamos começar 🚀"
```

---

**Dashboard AuZap com Aurora 100% integrada! 🤝✨**