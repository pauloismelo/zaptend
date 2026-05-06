# PRD — ZapTend: Plataforma SaaS de Atendimento via WhatsApp

**Versão:** 1.0  
**Data:** Abril 2026  
**Status:** Aprovado para desenvolvimento

---

## 1. Visão do Produto

### 1.1 Problema

Pequenas e médias empresas brasileiras gerenciam atendimento via WhatsApp de forma caótica: múltiplos celulares, sem histórico centralizado, sem métricas, sem transferência de atendimento estruturada, e totalmente dependentes de humanos 24h. Isso resulta em perda de clientes, esgotamento de equipes e impossibilidade de escalar.

### 1.2 Solução

ZapTend é uma plataforma SaaS multi-tenant que transforma o WhatsApp Business em um verdadeiro canal de atendimento profissional — com inbox colaborativo, automações com IA, kanban de pipeline, dashboards em tempo real e controle total de equipe, tudo em português, com cobrança em BRL.

### 1.3 Proposta de Valor

> "Sua equipe inteira no mesmo WhatsApp. Sua empresa atendendo como empresa."

---

## 2. Público-Alvo

### 2.1 Clientes Primários (Tenants)
- PMEs brasileiras com 5–200 funcionários
- Setores: varejo, saúde, educação, imóveis, serviços, e-commerce
- Perfil decisor: dono, gerente de operações ou gestor de atendimento
- Critério de qualificação: usa WhatsApp como canal principal de atendimento

### 2.2 Usuários Finais (Agents)
- Atendentes e operadores que respondem clientes
- Supervisores que monitoram equipes
- Gerentes que analisam dashboards

### 2.3 Personas
**Ana — Gerente de Atendimento (30 anos)**
- 12 atendentes, 800 conversas/dia
- Dor: não sabe quem está atendendo quem, histórico perdido
- Desejo: visão única de tudo, métricas de performance

**Carlos — Dono de Clínica (45 anos)**
- 3 recepcionistas, agendamentos via WhatsApp
- Dor: clientes sem resposta fora do horário, cancelamentos sem aviso
- Desejo: bot que agenda automaticamente, lembretes de consulta

---

## 3. Funcionalidades

### 3.1 Core — MVP (v1.0)

#### 3.1.1 Onboarding de Tenant
- Cadastro de empresa com plano selecionado
- Wizard de configuração do número WhatsApp (Meta Embedded Signup)
- Configuração inicial: nome do agente bot, horário de atendimento, mensagem de boas-vindas
- Convite de usuários por email
- Trial de 14 dias sem cartão

#### 3.1.2 Inbox Colaborativo
- Lista de conversas em tempo real (WebSocket)
- Filtros: todas, minhas, não atribuídas, por departamento, por tag, por status
- Status de conversa: aberta, em atendimento, aguardando cliente, resolvida, spam
- Atribuição manual ou automática (round-robin ou por disponibilidade)
- Transferência entre agentes ou departamentos com contexto
- Notas internas (visíveis apenas à equipe, não ao cliente)
- Visualização de quem está vendo a conversa (evitar colisão)
- Indicador de "digitando..." em tempo real
- Suporte a todos os tipos de mídia: texto, imagem, vídeo, áudio, documento, localização, contato, sticker
- Marcação de mensagens importantes (star/pin)
- Busca full-text em conversas e mensagens

#### 3.1.3 Gerenciamento de Contatos (Mini-CRM)
- Perfil do contato: nome, telefone, email, empresa, foto
- Campos customizados por tenant (texto, número, data, seleção, booleano)
- Histórico completo de conversas do contato
- Tags em contatos
- Importação via CSV
- Timeline de interações (mensagens, notas, atribuições, automações disparadas)
- Merge de contatos duplicados

#### 3.1.4 Respostas Rápidas (Templates)
- Criação de templates com variáveis dinâmicas (`{{nome}}`, `{{empresa}}`)
- Categorias de templates
- Busca e uso direto no chat com `/` shortcut
- Templates de mídia (imagem + texto)
- Aprovação de templates Meta para mensagens de broadcast

#### 3.1.5 Departamentos e Times
- Criação de departamentos (ex: Vendas, Suporte, Financeiro)
- Associação de agentes a departamentos
- Horários de atendimento por departamento
- Mensagem automática fora do horário

#### 3.1.6 Bot com IA (Claude Haiku)
- Respostas automáticas baseadas em base de conhecimento configurada pelo tenant
- Handoff automático para humano quando bot não sabe responder
- Configuração de prompt do bot por tenant
- Modo: sempre ativo / apenas fora do horário / desativado
- Histórico de interações do bot visível no chat

#### 3.1.7 Dashboard e Métricas
- Volume de conversas (total, abertas, resolvidas)
- Tempo médio de primeira resposta (TMA)
- Tempo médio de resolução (TMR)
- CSAT (pesquisa automática ao fechar conversa)
- Performance por agente e departamento
- Horários de pico de atendimento
- Taxa de resolução pelo bot
- Filtros por período

#### 3.1.8 Pipeline Kanban
- Visão kanban das conversas em estágios customizáveis
- Colunas configuráveis (ex: Novo Lead, Proposta Enviada, Negociando, Fechado)
- Drag-and-drop entre colunas
- Valor estimado por oportunidade
- Filtros por agente, departamento, tag

#### 3.1.9 Broadcasts (Campanhas)
- Envio em massa para lista de contatos
- Segmentação por tags e campos customizados
- Agendamento de envio
- Templates obrigatórios (conformidade Meta)
- Relatório de entrega, leitura e respostas
- Limites por plano

---

### 3.2 Avançado (v1.5)

#### 3.2.1 Flow Builder Visual
- Editor drag-and-drop de fluxos de automação
- Nós disponíveis: mensagem, condição (if/else), delay, atribuir agente, definir tag, webhook, variável, fim
- Gatilhos: nova conversa, palavra-chave, horário, campo do contato
- Variáveis: `{{contact.name}}`, `{{contact.custom.cpf}}`, `{{message.text}}`
- Pré-visualização do fluxo antes de ativar
- Versionamento de fluxos

#### 3.2.2 Integrações
- Webhook saída (para qualquer sistema)
- API REST pública (documentada com Swagger)
- Zapier / Make (n8n) connector
- CRM: HubSpot, Pipedrive (nativo)
- E-commerce: Shopify, WooCommerce (plugins)
- Calendário: Google Calendar (agendamento)
- Pagamentos: link de pagamento Stripe/Mercado Pago no chat

#### 3.2.3 WhatsApp Multi-Número
- Tenant pode conectar múltiplos números
- Roteamento por número (cada número para um departamento)
- Unificação de contatos entre números

---

### 3.3 Inovação — Features Exclusivas (v2.0)

> Nenhum concorrente tem essas funcionalidades atualmente.

#### 3.3.1 🧠 Mood AI — Análise de Sentimento em Tempo Real
- Análise de sentimento de cada mensagem recebida (positivo, neutro, negativo, urgente)
- Indicador visual no inbox (cor + emoji)
- Alerta automático para supervisor quando conversa deteriora
- Dashboard de "temperatura" do atendimento em tempo real
- Score de humor acumulado por contato

#### 3.3.2 📋 AI Co-Pilot para Agentes
- Sugestão automática de resposta baseada no histórico e contexto
- Agente clica em "usar" ou edita antes de enviar
- Resumo automático de conversas longas em 3 bullets
- Detecção de intenção: o que o cliente quer? (suporte, compra, cancelamento, reclamação)
- Sugestão de "próximo passo" (ex: "enviar proposta", "agendar ligação")

#### 3.3.3 🔮 Timeline 360° do Contato
- Visão cronológica completa do contato: todas as conversas, notas, negociações, broadcasts recebidos
- Linha do tempo visual com filtros
- Métricas do contato: LTV estimado, frequência de contato, tempo médio de resposta do cliente

#### 3.3.4 🎯 Smart Routing — Roteamento Inteligente
- IA analisa o contexto da mensagem e roteia automaticamente para o agente/departamento mais adequado
- Considera: histórico do contato, especialidade do agente, carga atual de trabalho
- Aprende com as correções manuais dos supervisores

#### 3.3.5 📊 Heatmap de Conversas
- Mapa de calor visual mostrando horários e dias de maior volume
- Por departamento, agente ou tenant
- Recomendação automática de escala de horários

#### 3.3.6 🔔 SLA Inteligente
- Definição de SLAs por tipo de conversa/prioridade
- Contagem regressiva visível no inbox
- Escalação automática ao aproximar do prazo
- Pausa automática de SLA fora do horário de atendimento

#### 3.3.7 🌐 Tradução Automática
- Detecção automática de idioma do cliente
- Tradução em tempo real para o agente (vê na língua dele)
- Resposta traduzida automaticamente para a língua do cliente
- Ideal para empresas com clientes internacionais

#### 3.3.8 🎙️ Transcrição de Áudio
- Transcrição automática de mensagens de voz (Whisper API)
- Texto da transcrição visível no chat para o agente
- Pesquisável no histórico

---

## 4. Requisitos Não-Funcionais

### 4.1 Performance
- Webhook Meta: processar mensagem em < 500ms (resposta ao Meta em < 5s obrigatório)
- Inbox: latência Socket.io < 200ms para entrega de mensagem ao agente
- Dashboard: carregamento inicial < 2s
- API: P95 < 300ms para endpoints de leitura

### 4.2 Disponibilidade
- SLA: 99.9% uptime (máximo 8.7h downtime/ano)
- Arquitetura: ECS Fargate multi-AZ, RDS Aurora com failover automático
- Health checks e auto-scaling configurados

### 4.3 Segurança
- HTTPS obrigatório em todas as rotas
- Dados em repouso: criptografados (AWS RDS encryption + S3 SSE)
- Dados em trânsito: TLS 1.2+
- Access tokens WhatsApp: AWS KMS
- OWASP Top 10 como baseline de segurança
- Logs de auditoria de todas as ações de admin

### 4.4 Conformidade
- LGPD: direito de exclusão, portabilidade, minimização de dados
- Meta Business Policy: uso correto da API, opt-out respeitado
- Dados armazenados em AWS sa-east-1 (São Paulo)

### 4.5 Escalabilidade
- Multi-tenant sem degradação até 10.000 tenants
- Workers horizontalmente escaláveis (BullMQ + SQS)
- Read replicas para queries pesadas de dashboard

---

## 5. Modelo de Negócio (SaaS)

### 5.1 Planos

| Plano | Preço | Agentes | Conversas/mês | Broadcasts | IA |
|-------|-------|---------|----------------|------------|-----|
| Starter | R$ 97/mês | 3 | 500 | Não | Não |
| Growth | R$ 297/mês | 10 | 2.000 | Sim (10k/mês) | Básico |
| Pro | R$ 697/mês | Ilimitado | 10.000 | Sim (50k/mês) | Completo |
| Enterprise | Sob consulta | Ilimitado | Ilimitado | Ilimitado | Completo + dedicado |

### 5.2 Overage
- Conversas excedentes: R$ 0,15/conversa (Growth) / R$ 0,10/conversa (Pro)
- Mensagens broadcast excedentes: R$ 0,05/mensagem

### 5.3 Add-ons
- Número adicional WhatsApp: R$ 49/mês
- Agente adicional (Starter): R$ 29/mês por agente
- AI Co-Pilot (Starter/Growth): R$ 97/mês

### 5.4 Trial
- 14 dias grátis, plano Growth
- Sem cartão de crédito obrigatório no início
- Limite de 50 conversas durante trial

---

## 6. Arquitetura Técnica

### 6.1 Diagrama de Alto Nível

```
[Meta WhatsApp Cloud API]
        |
        v (webhook)
[API Gateway / ALB]
        |
        v
[NestJS API — ECS Fargate]
    |           |
    v           v
[Redis/BullMQ] [PostgreSQL Aurora]
    |
    v
[Workers — ECS Fargate]
    |
    v
[Socket.io — notifica frontend]
    |
    v
[Next.js Frontend — CloudFront + S3]
```

### 6.2 Modelo de Dados Simplificado

```sql
-- Tenant (cliente da plataforma)
tenants: id, slug, name, plan, status, createdAt

-- Usuários do tenant
users: id, tenantId, email, name, role, isOnline, lastSeenAt

-- Configuração WhatsApp
whatsapp_configs: id, tenantId, phoneNumberId, wabaId, accessTokenEncrypted, isActive

-- Contatos (clientes do tenant)
contacts: id, tenantId, phone, name, email, avatarUrl, tags[]

-- Conversas
conversations: id, tenantId, contactId, assignedUserId, departmentId, status, 
               channel, lastMessageAt, slaDeadline

-- Mensagens  
messages: id, conversationId, tenantId, direction, type, content, mediaUrl,
          status, sentAt, deliveredAt, readAt, sentiment

-- Departamentos
departments: id, tenantId, name, description

-- Templates
templates: id, tenantId, name, content, category, variables[]

-- Flows de automação
automation_flows: id, tenantId, name, trigger, nodes (JSONB), isActive

-- Planos e assinaturas
subscriptions: id, tenantId, stripeSubscriptionId, plan, status, currentPeriodEnd

-- Uso mensal (metered billing)
usage_records: id, tenantId, month, conversations, broadcasts, aiRequests
```

---

## 7. Roadmap

### v1.0 — MVP (0–3 meses)
- [ ] Onboarding + Meta Embedded Signup
- [ ] Inbox colaborativo com WebSocket
- [ ] Atribuição e transferência de conversas
- [ ] Contatos básicos
- [ ] Respostas rápidas
- [ ] Dashboard básico
- [ ] Billing Stripe (planos)
- [ ] Super Admin

### v1.5 — Crescimento (3–6 meses)
- [ ] Flow Builder visual
- [ ] Kanban pipeline
- [ ] Broadcasts/campanhas
- [ ] Integrações (webhook, API pública)
- [ ] Bot IA configurável
- [ ] CSAT automático
- [ ] Relatórios avançados
- [ ] App mobile (PWA)

### v2.0 — Inovação (6–12 meses)
- [ ] Mood AI
- [ ] AI Co-Pilot
- [ ] Smart Routing
- [ ] Timeline 360°
- [ ] Transcrição de áudio
- [ ] Tradução automática
- [ ] Multi-número por tenant
- [ ] Integrações CRM nativas

---

## 8. Critérios de Sucesso

| Métrica | Meta 6 meses | Meta 12 meses |
|---------|-------------|---------------|
| Tenants ativos | 200 | 1.000 |
| MRR | R$ 30.000 | R$ 200.000 |
| Churn mensal | < 5% | < 3% |
| NPS | > 40 | > 55 |
| Uptime | > 99.5% | > 99.9% |
| Conversas processadas/dia | 50.000 | 500.000 |

---

## 9. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Mudança de policy da Meta | Alta | Alto | Monitorar changelog Meta, manter abstração da API |
| Churn alto no início | Média | Alto | Onboarding assistido, CS proativo |
| Escalabilidade do webhook | Média | Alto | Fila BullMQ + workers auto-scaling |
| Concorrentes com features similares | Alta | Médio | Focar em UX superior e features exclusivas |
| Vazamento de dados de tenant | Baixa | Crítico | Auditoria de código, testes de isolamento, LGPD |
