# ZapTend — Roteiro de Prompts para Claude Code

> Cole cada prompt diretamente no Claude Code dentro da pasta do projeto.
> O Claude Code detecta o `CLAUDE.md` automaticamente e carrega o contexto.
> Fases 1–3 são bloqueantes. Da Fase 4 em diante é possível paralelizar.

---

## Fase 1 — Fundação
> Monorepo, banco de dados e autenticação. Base de tudo.

---

### Prompt 01 — Estrutura do monorepo Turborepo

```
Leia o CLAUDE.md e crie a estrutura inicial do monorepo Turborepo com pnpm workspaces. Deve conter: apps/web (Next.js 15, App Router, Tailwind CSS, Shadcn/UI, Zustand, Lucide React), apps/api (NestJS com Prisma, Swagger, class-validator), apps/worker (NestJS básico para BullMQ), packages/database (Prisma), packages/types (tipos TypeScript compartilhados). Configure turbo.json, .env.example com todas as variáveis do CLAUDE.md, e docker-compose.yml com PostgreSQL e Redis para desenvolvimento local.
```

---

### Prompt 02 — Prisma e migration inicial

```
Leia o CLAUDE.md e o arquivo config/schema.prisma. Copie o schema para packages/database/prisma/schema.prisma e configure o PrismaService em apps/api. Crie a migration inicial com nome 'init' e gere o Prisma Client. Certifique-se de que o PrismaService está disponível como módulo global no NestJS.
```

---

### Prompt 03 — Módulo de autenticação

```
Leia o CLAUDE.md e o agents/backend.md. Implemente o módulo de autenticação em apps/api/src/modules/auth com: registro de tenant (POST /auth/register), login (POST /auth/login) retornando accessToken e refreshToken, refresh de token (POST /auth/refresh), logout (POST /auth/logout). Use JWT com expiração de 15min para access e 7 dias para refresh. Crie DTOs com class-validator e Swagger para todos os endpoints. Implemente JwtAuthGuard e JwtStrategy. Crie auth.service.spec.ts e auth.controller.spec.ts com cobertura >= 80%.
```

---

### Prompt 04 — Multi-tenancy: TenantContext e RolesGuard

```
Leia o CLAUDE.md e o agents/backend.md. Implemente o middleware TenantContextMiddleware em apps/api/src/common/tenant-context.ts usando AsyncLocalStorage. O middleware deve extrair o tenantId do JWT autenticado e disponibilizá-lo via função getTenantId(). Implemente também o RolesGuard com o decorator @Roles() e os papéis: agent, supervisor, admin, owner. Adicione o guard globalmente. Crie testes unitários para o middleware e o guard.
```

---

### Prompt 05 — Telas de login e registro + store de auth

```
Leia o CLAUDE.md e o agents/frontend.md. Implemente as páginas de autenticação em apps/web: /login (email + senha), /register (nome, empresa, email, senha, confirmação). Crie a store de auth em stores/auth.store.ts com Zustand contendo: user, tenant, accessToken, isLoading, login(), logout(), refreshToken(). Configure o interceptor de axios em lib/api/client.ts para injetar o token e fazer refresh automático quando receber 401. Use React Hook Form + Zod para validação dos formulários. Crie auth.store.spec.ts e os testes dos formulários.
```

---

## Fase 2 — Integração WhatsApp
> Webhook, processamento de mensagens e envio. Núcleo do produto.

---

### Prompt 06 — Configuração WhatsApp e KMS

```
Leia o CLAUDE.md, agents/backend.md e skills/domain-skills.md. Implemente o módulo de configuração WhatsApp em apps/api/src/modules/whatsapp-config: CRUD de WhatsAppConfig (phoneNumberId, wabaId, accessToken criptografado com KMS, webhookVerifyToken, mensagens de boas-vindas e ausência, horário de atendimento). Crie o KmsService para criptografar/descriptografar o accessToken. Nunca salvar o token em plain text. Crie DTOs, Swagger e testes spec.
```

---

### Prompt 07 — Webhook Meta: receber mensagens

```
Leia o CLAUDE.md, agents/backend.md e skills/domain-skills.md (seção WhatsApp Message Processing). Implemente o webhook do WhatsApp em apps/api/src/modules/webhook: GET /webhooks/whatsapp/:tenantId para verificação do webhook Meta, POST /webhooks/whatsapp/:tenantId para receber mensagens. Valide a assinatura HMAC-SHA256 em TODA request POST. Responda 200 imediatamente e enfileire no BullMQ (fila messages-inbound). Trate todos os tipos de mensagem: text, image, audio, video, document, location, contacts, sticker, reaction. Crie testes spec.
```

---

### Prompt 08 — Worker: processar mensagem recebida

```
Leia o CLAUDE.md e agents/backend.md. Implemente o worker de mensagens em apps/worker/src/processors/message-inbound.processor.ts. O worker deve: 1) Receber job da fila messages-inbound, 2) Fazer upsert do Contact pelo telefone + tenantId, 3) Buscar ou criar Conversation com o contato, 4) Criar a Message no banco com direction=inbound e todos os campos, 5) Para mídia (image, audio, video, document): baixar da Meta API e fazer upload para S3, salvar URL permanente, 6) Emitir evento Socket.io para agentes online, 7) Aplicar regra de roteamento automático se conversa não atribuída. Crie testes spec.
```

---

### Prompt 09 — WhatsAppService: enviar mensagens

```
Leia o CLAUDE.md e agents/backend.md. Implemente o WhatsAppService em apps/api/src/modules/whatsapp/whatsapp.service.ts com os métodos: sendTextMessage(tenantId, to, text), sendMediaMessage(tenantId, to, mediaType, mediaUrl, caption), sendTemplate(tenantId, to, templateName, variables), sendReaction(tenantId, to, messageId, emoji). Implemente a verificação da janela 24h antes de enviar mensagem livre. Salve toda mensagem enviada no banco com direction=outbound. Este service é o ÚNICO ponto de envio para a Meta API. Crie testes spec com mock da Meta API.
```

---

## Fase 3 — Inbox
> Conversas, mensagens e comunicação em tempo real. Coração da interface.

---

### Prompt 10 — API de conversas: CRUD e atribuição

```
Leia o CLAUDE.md e agents/backend.md. Implemente o módulo de conversas em apps/api/src/modules/conversations: GET /conversations (lista paginada com filtros: status, assignedUserId, departmentId, tags, search), GET /conversations/:id (com mensagens e contato), PATCH /conversations/:id (status, assignedUserId, tags, pipelineStage), POST /conversations/:id/assign (atribuir a agente), POST /conversations/:id/transfer (transferir com nota), POST /conversations/:id/resolve (fechar). Todos os endpoints filtram por tenantId. Siga agents/backend.md para DTOs, Swagger e testes spec.
```

---

### Prompt 11 — API de mensagens e Socket.io Gateway

```
Leia o CLAUDE.md e agents/backend.md. Implemente o módulo de mensagens em apps/api/src/modules/messages: GET /conversations/:id/messages (paginadas, cursor-based), POST /conversations/:id/messages (enviar mensagem: text, image, document, audio, template). Implemente o MessagesGateway com Socket.io em apps/api/src/gateways/messages.gateway.ts: autenticação via JWT no handshake, rooms por tenantId, emitir eventos conversation:new, message:new, conversation:updated, user:typing, message:status. Crie testes spec.
```

---

### Prompt 12 — Layout do tenant, SocketProvider e stores

```
Leia o CLAUDE.md e agents/frontend.md. Implemente o layout principal do tenant em apps/web/src/app/(tenant)/[slug]/layout.tsx com sidebar e header. Crie o SocketProvider em providers/socket-provider.tsx que conecta ao WebSocket e atualiza as stores Zustand em tempo real (conversation:new, message:new, conversation:updated). Crie as stores: conversations.store.ts e messages.store.ts seguindo o padrão do agents/frontend.md. Crie os spec de todas as stores e do provider.
```

---

### Prompt 13 — Página do inbox: lista, chat e detalhes

```
Leia o CLAUDE.md e agents/frontend.md. Implemente a página do inbox em apps/web/src/app/(tenant)/[slug]/inbox. Deve ter: painel esquerdo com lista de conversas (filtros por status/departamento/tag, busca, ordenado por lastMessageAt), painel central com o chat da conversa selecionada (histórico de mensagens, campo de envio com suporte a emoji, anexos e atalho / para respostas rápidas, indicadores de status de mensagem), painel direito com detalhes do contato. Use Zustand stores para estado. Ícones com lucide-react. Estilize com Tailwind seguindo o design system dark mode do agents/frontend.md. Crie spec para todos os componentes.
```

---------------------------------------------------

## Fase 4 — CRM e Equipe
> Contatos, usuários e departamentos. Pode rodar em paralelo com Fase 5.

---

### Prompt 14 — API de contatos: CRM e importação CSV

```
Leia o CLAUDE.md e agents/backend.md. Implemente o módulo de contatos em apps/api/src/modules/contacts: GET /contacts (paginado com filtros: search, tags, isBlocked), GET /contacts/:id (com histórico de conversas), POST /contacts, PATCH /contacts/:id, DELETE /contacts/:id (soft delete), POST /contacts/import (importação via CSV). Implemente campos customizados (customFields JSONB) e gestão de tags. Todos os endpoints filtram por tenantId. Crie DTOs, Swagger e testes spec.
```

---

### Prompt 15 — API de usuários e departamentos

```
Leia o CLAUDE.md e agents/backend.md. Implemente o módulo de usuários/equipe em apps/api/src/modules/users: GET /users (lista por tenant), POST /users/invite (enviar convite por email), PATCH /users/:id (nome, avatar, role), DELETE /users/:id (desativar), PATCH /users/:id/online-status (atualizar isOnline). Implemente o módulo de departamentos: CRUD completo de Department e endpoint para associar/remover agentes de departamentos. Crie DTOs, Swagger e testes spec.
```

---

### Prompt 16 — Página de contatos e timeline

```
Leia o CLAUDE.md e agents/frontend.md. Implemente a página de contatos em apps/web/src/app/(tenant)/[slug]/contacts com: lista de contatos (busca, filtro por tags, paginação), modal/drawer de detalhes do contato com edição inline de nome, email, empresa, campos customizados e tags, timeline de interações do contato (todas as conversas, notas, eventos). Crie contacts.store.ts com Zustand. Use lucide-react para ícones e Tailwind para estilos. Crie spec para todos os componentes e a store.
```

---

## Fase 5 — Billing
> Stripe, planos e controle de features. Pode rodar em paralelo com Fase 4.

---

### Prompt 17 — Integração Stripe: planos e webhooks

```
Leia o CLAUDE.md e agents/whatsapp-infra-billing-reviewer.md (seção Billing). Implemente o módulo de billing em apps/api/src/modules/billing: integração com Stripe, criação de checkout session para os planos Starter (R$ 97), Growth (R$ 297) e Pro (R$ 697), webhook Stripe processando: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted, invoice.payment_failed, invoice.payment_succeeded. Implemente ativação/suspensão automática do tenant baseada no status da assinatura. Trial de 14 dias. Crie testes spec com mock do Stripe.
```

---

### Prompt 18 — Feature flags por plano e controle de uso

```
Leia o CLAUDE.md e agents/whatsapp-infra-billing-reviewer.md (seção Billing). Implemente o sistema de feature flags por plano: crie a constante PLAN_FEATURES com as permissões de cada plano (starter, growth, pro), implemente o PlanGuard e o decorator @RequireFeature(), implemente o UsageService que registra conversas e broadcasts no UsageRecord mensal e verifica se o tenant está dentro dos limites. Aplique @RequireFeature() em todos os endpoints premium (broadcasts, flowBuilder, apiAccess). Crie testes spec cobrindo o guard e o UsageService.
```

---

### Prompt 19 — Página de billing e uso

```
Leia o CLAUDE.md e agents/frontend.md. Implemente a página de billing em apps/web/src/app/(tenant)/[slug]/settings/billing: exibição do plano atual, data de renovação, uso do mês (conversas, broadcasts) com barra de progresso, botão de upgrade com redirecionamento para checkout Stripe, histórico de faturas, botão de cancelamento. Crie billing.store.ts com Zustand. Use lucide-react e Tailwind. Crie spec para os componentes e a store.
```

---

## Fase 6 — Features Avançadas
> Kanban, broadcasts e automações.

---

### Prompt 20 — Respostas rápidas, notas internas e timeline

```
Leia o CLAUDE.md e agents/backend.md. Implemente o módulo de respostas rápidas em apps/api/src/modules/quick-replies: CRUD completo de QuickReply com busca por nome/conteúdo, variáveis dinâmicas ({{nome}}, {{empresa}}). Implemente o módulo de notas internas: POST /conversations/:id/notes, GET /conversations/:id/notes. Implemente a timeline de eventos da conversa (ConversationEvent): registrar automaticamente assigned, transferred, status_changed, tag_added. Crie DTOs, Swagger e testes spec.
```

---

### Prompt 21 — Pipeline kanban com drag-and-drop

```
Leia o CLAUDE.md e agents/frontend.md. Implemente o pipeline kanban em apps/web/src/app/(tenant)/[slug]/pipeline: board com colunas configuráveis, cards das conversas com drag-and-drop entre colunas (usando @dnd-kit/core), valor estimado por card, filtros por agente e departamento. Crie pipeline.store.ts com Zustand para gerenciar estágios e conversas. Use lucide-react e Tailwind. Crie spec para os componentes e a store.
```

---

### Prompt 22 — Broadcasts: API e worker de envio em massa

```
Leia o CLAUDE.md e agents/backend.md. Implemente o módulo de broadcasts em apps/api/src/modules/broadcasts: criação de broadcast com template Meta, segmentação por tags e campos customizados, agendamento, endpoint para iniciar envio. Implemente o worker de broadcast em apps/worker/src/processors/broadcast.processor.ts que processa a fila broadcast-send: busca contatos elegíveis (sem optedOut), envia via WhatsApp API com rate limiting (máx 80/s), atualiza contadores de entrega. Aplique @RequireFeature('broadcasts'). Crie DTOs, Swagger e testes spec.
```

---

### Prompt 23 — Automações: flow engine e workers

```
Leia o CLAUDE.md e agents/backend.md. Implemente o módulo de automações em apps/api/src/modules/automations: CRUD de AutomationFlow com nodes JSONB (mensagem, condição, delay, atribuir, tag, webhook, fim), gatilhos: new_conversation, keyword, schedule, field_changed. Implemente o AutomationEngine em apps/worker/src/services/automation-engine.service.ts que avalia e executa os nós do flow quando um gatilho é disparado. Aplique @RequireFeature('flowBuilder'). Crie DTOs, Swagger e testes spec.
```

---

## Fase 7 — Inteligência Artificial
> Bot automático, co-pilot e análise de sentimento.

---

### Prompt 24 — AI Service: bot, sentimento e resumo

```
Leia o CLAUDE.md, agents/backend.md e skills/domain-skills.md (seção AI Bot Response). Implemente o AiService em apps/api/src/modules/ai/ai.service.ts usando claude-haiku-4-5-20251001. Métodos: generateBotResponse(tenantId, message, history, botConfig) que gera resposta baseada no prompt do tenant, com detecção de HANDOFF_REQUESTED; analyzeSentiment(text) que retorna positive/neutral/negative/urgent e score; summarizeConversation(messages) que retorna 3 bullets do resumo. Integre o bot no worker de mensagens: se bot ativo e conversa não atribuída, chamar generateBotResponse e enviar resposta. Crie testes spec com mock da Anthropic API.
```

---

### Prompt 25 — Mood AI: análise de sentimento em tempo real

```
Leia o CLAUDE.md e agents/backend.md. Implemente o Mood AI: integre o analyzeSentiment no worker de mensagens para analisar toda mensagem inbound e salvar o campo sentiment na Message. Crie endpoint GET /conversations/:id/mood que retorna o histórico de sentimentos. Implemente o worker de alerta: se 3+ mensagens consecutivas com sentiment=negative ou urgent, emitir evento Socket.io supervisor:alert para todos os supervisores online do tenant com o id da conversa. Crie testes spec.
```

---

### Prompt 26 — AI Co-Pilot: sugestão, resumo e intenção

```
Leia o CLAUDE.md e agents/backend.md. Implemente o AI Co-Pilot: endpoint POST /conversations/:id/ai/suggest que retorna sugestão de resposta baseada no histórico da conversa, endpoint POST /conversations/:id/ai/summarize que retorna resumo em 3 bullets, endpoint POST /conversations/:id/ai/intent que retorna a intenção detectada (suporte, compra, cancelamento, reclamação, dúvida). Aplique @RequireFeature('aiCopilot'). Integre os três na UI do inbox: botão "Sugerir resposta" no campo de chat que preenche o textarea, botão "Resumir" no painel lateral. Crie testes spec.
```

---

## Fase 8 — Dashboard e Super Admin
> Métricas, relatórios e painel de gestão de tenants.

---

### Prompt 27 — API de relatórios e métricas

```
Leia o CLAUDE.md e agents/backend.md. Implemente o módulo de relatórios em apps/api/src/modules/reports: GET /reports/overview (conversas abertas, TMA, TMR, CSAT médio, agentes online), GET /reports/volume (por período: dia/semana/mês, por departamento, por agente), GET /reports/agents (performance: conversas, TMA, TMR, CSAT por agente), GET /reports/heatmap (volume por hora/dia da semana). Todos filtrados por tenantId e período. Crie DTOs, Swagger e testes spec.
```

---

### Prompt 28 — Dashboard de métricas e página de relatórios

```
Leia o CLAUDE.md e agents/frontend.md. Implemente o dashboard principal em apps/web/src/app/(tenant)/[slug]/inbox como painel de visão geral: cards de métricas em tempo real (conversas abertas, TMA, CSAT, agentes online), lista de conversas aguardando atribuição, gráfico de volume das últimas 24h (usando recharts). Implemente a página de relatórios em /reports com filtros de período, gráficos de volume, tabela de performance por agente e heatmap. Use lucide-react e Tailwind. Crie spec para todos os componentes.
```

---

### Prompt 29 — Super Admin: gestão de tenants e métricas globais

```
Leia o CLAUDE.md e agents/backend.md. Implemente o módulo de Super Admin em apps/api/src/modules/super-admin (role: system_admin, separado dos tenants): GET /admin/tenants (lista com filtros, paginação), GET /admin/tenants/:id (detalhes, uso, subscription), PATCH /admin/tenants/:id/status (ativar/suspender), GET /admin/metrics (MRR total, tenants ativos, crescimento), GET /admin/usage (uso por tenant no mês). Implemente autenticação separada para o super admin (email @zaptend.com.br). Crie DTOs, Swagger e testes spec.
```

---

## Fase 9 — Deploy e Segurança
> Docker, CI/CD e auditoria final antes de ir a produção.

---

### Prompt 30 — Dockerfiles de produção

```
Leia o CLAUDE.md e agents/whatsapp-infra-billing-reviewer.md (seção Infrastructure). Crie os Dockerfiles para apps/api, apps/worker e apps/web com multi-stage build (builder → runner), usuário não-root, NODE_ENV=production. Crie o deploy/docker-compose.prod.yml para testes locais de produção. Certifique-se de que as imagens são otimizadas (sem devDependencies, sem source maps). Adicione .dockerignore em cada app.
```

---

### Prompt 31 — Pipeline CI/CD completo

```
Leia o CLAUDE.md e o deploy/ci-cd.yml já existente. Revise e complete o pipeline de CI/CD em deploy/ci-cd.yml: quality gate (typecheck, lint, testes unitários), E2E apenas em PRs para main, build e push das imagens para ECR, deploy no ECS Fargate para staging (branch develop) e produção (branch main com aprovação manual), execução de migrations antes do deploy, smoke test pós-deploy. Crie os arquivos deploy/ecs/staging/api-task.json, worker-task.json e web-task.json com as definições de task do ECS.
```

---

### Prompt 32 — Auditoria de segurança final

```
Leia o CLAUDE.md e agents/whatsapp-infra-billing-reviewer.md (seção Reviewer). Faça uma revisão completa de segurança em todo o código existente verificando: 1) Toda query Prisma filtra por tenantId, 2) Nenhum accessToken em plain text, 3) Validação HMAC no webhook Meta, 4) Todos os endpoints premium protegidos com PlanGuard, 5) Nenhum console.log em produção, 6) Rate limiting configurado. Gere um relatório de tudo que encontrou e corrija os problemas críticos.
```

---

## Referência Rápida

| Fase | Prompts | Depende de |
|------|---------|-----------|
| 1 — Fundação | 01–05 | — |
| 2 — WhatsApp | 06–09 | Fase 1 |
| 3 — Inbox | 10–13 | Fases 1 e 2 |
| 4 — CRM e Equipe | 14–16 | Fase 1 |
| 5 — Billing | 17–19 | Fase 1 |
| 6 — Features Avançadas | 20–23 | Fases 3, 4 e 5 |
| 7 — IA | 24–26 | Fases 2 e 3 |
| 8 — Dashboard | 27–29 | Fases 3 e 5 |
| 9 — Deploy | 30–32 | Todas |

> Se o Claude Code perder contexto em algum ponto, adicione no início do prompt: **"Releia o CLAUDE.md antes de começar."**
