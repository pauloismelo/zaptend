# Skills de Domínio — ZapTend

## Skill: WhatsApp Message Processing

### Quando Usar
Sempre que precisar processar, enviar ou validar mensagens WhatsApp.

### Fluxo Padrão de Recebimento

```typescript
// 1. Webhook recebe payload do Meta
// 2. Validar assinatura IMEDIATAMENTE (antes de qualquer processamento)
// 3. Responder 200 ao Meta (< 5s obrigatório)
// 4. Enfileirar no BullMQ para processamento assíncrono
// 5. Worker processa: upsert contact → upsert conversation → create message
// 6. Emitir evento Socket.io para agentes
// 7. Aplicar automações/bot se configurado

async processInboundMessage(payload: MetaWebhookPayload) {
  const { entry } = payload;
  
  for (const e of entry) {
    const tenantId = await this.getTenantIdByPhoneNumberId(e.changes[0].value.metadata.phone_number_id);
    if (!tenantId) continue; // número não cadastrado na plataforma
    
    await this.messageQueue.add('process-inbound', {
      tenantId,
      message: e.changes[0].value.messages[0],
      contact: e.changes[0].value.contacts[0],
    });
  }
}
```

### Status de Mensagem
```
sent → delivered → read  (enviadas pela empresa)
received                  (recebidas do cliente)
failed                    (erro no envio)
```

### Atualizar Status via Webhook
```typescript
// Meta envia status updates junto com mensagens
if (value.statuses) {
  for (const status of value.statuses) {
    await this.messageService.updateStatus(
      tenantId, 
      status.id,      // whatsapp message id
      status.status,  // sent | delivered | read | failed
      status.timestamp
    );
  }
}
```

---

## Skill: Tenant Context

### Quando Usar
Em qualquer service que precise acessar o tenant atual.

### Implementação
```typescript
// apps/api/src/common/tenant-context.ts
import { AsyncLocalStorage } from 'async_hooks';

export const tenantStorage = new AsyncLocalStorage<{ tenantId: string }>();

// Middleware — executado em todas as requests autenticadas
export class TenantContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new UnauthorizedException();
    
    tenantStorage.run({ tenantId }, next);
  }
}

// Usar nos services
export function getTenantId(): string {
  return tenantStorage.getStore()?.tenantId ?? 
    (() => { throw new Error('TenantContext não disponível'); })();
}
```

---

## Skill: Feature Flag Check

### Quando Usar
Antes de executar qualquer funcionalidade premium.

```typescript
async checkFeature(tenantId: string, feature: keyof PlanFeatures): Promise<void> {
  const subscription = await this.billingService.getActivePlan(tenantId);
  const features = PLAN_FEATURES[subscription.plan];
  
  if (!features[feature]) {
    throw new ForbiddenException(
      `Funcionalidade "${feature}" não disponível no plano ${subscription.plan}. ` +
      `Faça upgrade para acessar.`
    );
  }
}

// Uso
await this.checkFeature(tenantId, 'broadcasts');
await this.checkFeature(tenantId, 'flowBuilder');
await this.checkFeature(tenantId, 'apiAccess');
```

---

## Skill: Conversation Assignment

### Quando Usar
Ao atribuir, transferir ou rotear conversas.

```typescript
// Atribuição manual
async assignToAgent(conversationId: string, agentId: string, tenantId: string) {
  const conversation = await this.findOne(conversationId, tenantId);
  const previousAgent = conversation.assignedUserId;
  
  const updated = await this.prisma.conversation.update({
    where: { id: conversationId, tenantId },
    data: { 
      assignedUserId: agentId,
      status: 'attending',
      lastAssignedAt: new Date(),
    }
  });
  
  // Notificar via Socket.io
  this.socketGateway.emit(`tenant:${tenantId}`, 'conversation:assigned', {
    conversationId,
    agentId,
    previousAgentId: previousAgent,
  });
  
  // Criar evento na timeline
  await this.createTimelineEvent(conversationId, 'assigned', { agentId, previousAgent });
  
  return updated;
}

// Round-robin (distribuição automática)
async assignRoundRobin(conversationId: string, departmentId: string, tenantId: string) {
  const agents = await this.getOnlineAgentsInDepartment(departmentId, tenantId);
  if (!agents.length) return; // Ninguém online — fica sem atribuição
  
  // Pegar agente com menos conversas abertas
  const agentWithLeastLoad = agents.reduce((min, agent) => 
    agent.openConversationsCount < min.openConversationsCount ? agent : min
  );
  
  return this.assignToAgent(conversationId, agentWithLeastLoad.id, tenantId);
}
```

---

## Skill: CSAT Survey

### Quando Usar
Ao resolver/fechar uma conversa (automaticamente ou manualmente).

```typescript
async sendCsatSurvey(conversationId: string, tenantId: string) {
  const config = await this.getTenantConfig(tenantId);
  if (!config.csatEnabled) return;
  
  // Enviar template com botões de avaliação
  await this.whatsappService.sendTemplate(tenantId, contact.phone, 'csat_survey', {
    components: [{
      type: 'button',
      sub_type: 'quick_reply',
      index: 0,
      parameters: [{ type: 'payload', payload: `csat:${conversationId}:5` }]
    }]
  });
}

// Processar resposta do CSAT
async processCsatResponse(conversationId: string, score: number) {
  await this.prisma.conversation.update({
    where: { id: conversationId },
    data: { csatScore: score, csatRespondedAt: new Date() }
  });
}
```

---

## Skill: AI Bot Response

### Quando Usar
Quando o bot está ativo e uma nova mensagem chega sem atendente humano.

```typescript
async generateBotResponse(
  message: string, 
  conversationHistory: Message[],
  tenantConfig: TenantBotConfig
): Promise<string | null> {
  
  const response = await this.anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001', // modelo mais rápido/barato
    max_tokens: 500,
    system: `Você é um assistente de atendimento da empresa ${tenantConfig.companyName}.
    
${tenantConfig.botSystemPrompt}

REGRAS IMPORTANTES:
- Responda APENAS em português do Brasil
- Se não souber a resposta, diga: "Deixa eu verificar isso com um especialista. Um momento!"
- Se o cliente pedir para falar com humano, responda: "HANDOFF_REQUESTED"
- Nunca invente informações
- Seja objetivo e cordial`,
    messages: [
      ...conversationHistory.slice(-10).map(m => ({
        role: m.direction === 'inbound' ? 'user' : 'assistant',
        content: m.content
      })),
      { role: 'user', content: message }
    ]
  });
  
  const text = response.content[0].text;
  
  // Se bot indica que precisa de humano
  if (text.includes('HANDOFF_REQUESTED') || text.includes('Deixa eu verificar')) {
    await this.triggerHumanHandoff(conversationId);
    return text.replace('HANDOFF_REQUESTED', 'Um momento! Vou chamar um de nossos especialistas.');
  }
  
  return text;
}
```
