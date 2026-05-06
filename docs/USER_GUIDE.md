# ZapTend — Guia do Usuário

**Versão:** 1.0 | **Idioma:** Português (BR)

---

## Para Quem é Este Guia

Este guia é destinado a três tipos de usuários:
- **Administradores do Tenant** — quem configura a plataforma
- **Agentes de Atendimento** — quem responde clientes no dia a dia
- **Supervisores** — quem monitora e analisa a equipe

---

## Início Rápido (5 minutos)

### 1. Crie sua conta
Acesse `app.zaptend.com.br`, clique em **"Começar grátis"** e preencha seus dados. Você terá **14 dias de trial** no plano Growth sem precisar de cartão de crédito.

### 2. Configure seu número WhatsApp
Após o cadastro, você verá o wizard de configuração:
1. Clique em **"Conectar WhatsApp"**
2. Faça login no Facebook/Meta (conta que gerencia sua WABA)
3. Selecione ou crie seu **WhatsApp Business Account**
4. Selecione o número a conectar
5. Pronto! Seu número estará ativo em < 2 minutos

> **Importante:** Você precisa de um número no **WhatsApp Business API** (não o app WhatsApp Business comum). Se precisar de ajuda para migrar, nosso suporte pode auxiliar.

### 3. Convide sua equipe
Vá em **Configurações → Equipe → Convidar usuário**. Cada membro receberá um email com o link de acesso.

### 4. Teste o primeiro atendimento
Envie uma mensagem para o número conectado de um outro celular. Em segundos, ela aparecerá na sua **Inbox** na plataforma.

---

## Inbox — Central de Atendimento

### Visão Geral

A Inbox é onde toda a magia acontece. Ela se divide em:

**Painel esquerdo — Lista de conversas**
- Mostra todas as conversas com filtros rápidos
- Atualiza em tempo real à medida que chegam novas mensagens
- Indicadores de status coloridos: 🟢 aberta, 🔵 em atendimento, 🟡 aguardando, ✅ resolvida

**Painel central — Chat**
- Todas as mensagens da conversa selecionada
- Campo de resposta com suporte a emoji, anexos e templates
- Informações do status de entrega (enviado ✓, entregue ✓✓, lido ✓✓ azul)

**Painel direito — Detalhes do contato**
- Nome, telefone, empresa, tags
- Histórico de conversas anteriores
- Notas internas da equipe
- Campos customizados

### Filtros de Conversas

| Filtro | Descrição |
|--------|-----------|
| Todas | Todas as conversas do tenant |
| Minhas | Conversas atribuídas a mim |
| Não atribuídas | Aguardando atribuição |
| Por departamento | Filtra por um departamento específico |
| Por tag | Todas com determinada tag |
| Resolvidas | Arquivo de conversas finalizadas |

### Como Responder um Cliente

1. Clique na conversa na lista
2. Digite no campo de mensagem
3. Pressione **Enter** ou clique em **Enviar**

**Atalhos úteis:**
- `/` — Abre busca de respostas rápidas
- `Ctrl+Enter` — Envia mensagem
- `Ctrl+I` — Abre modal de nota interna

### Tipos de Mensagem que Você Pode Enviar

- **Texto** — Até 4.096 caracteres
- **Imagem** — JPG, PNG, WEBP (máx 5MB)
- **Documento** — PDF, Word, Excel (máx 100MB)
- **Áudio** — MP3, OGG (máx 16MB)
- **Vídeo** — MP4 (máx 16MB)
- **Template** — Mensagens pré-aprovadas pela Meta

> **Regra importante:** Se o cliente não enviou nenhuma mensagem nas últimas **24 horas**, você só pode enviar **templates aprovados** pela Meta. A plataforma avisa automaticamente quando isso ocorre.

### Respostas Rápidas

Respostas rápidas são templates de mensagens que sua equipe usa frequentemente.

**Como usar:**
1. No campo de mensagem, digite `/` e comece a digitar o nome do template
2. Selecione da lista que aparece
3. Revise e personalize se necessário
4. Envie

**Como criar:**
Vá em **Configurações → Respostas Rápidas → Nova resposta**

Use variáveis como `{{nome}}`, `{{empresa}}` que serão substituídas automaticamente.

### Notas Internas

Notas internas são comentários visíveis apenas para a equipe, nunca para o cliente.

**Quando usar:** Para deixar contexto para outro agente, registrar um status interno, ou alertar um supervisor.

Clique no ícone de nota (📝) ou pressione `Ctrl+I`.

### Atribuição de Conversa

**Atribuição manual:**
1. Abra a conversa
2. No painel direito, clique em **"Atribuir"**
3. Selecione o agente ou departamento

**Transferência:**
Clique em **"Transferir"** e selecione para quem. A conversa vai para a caixa do novo agente e ele recebe uma notificação.

### Resolver uma Conversa

Quando o atendimento estiver concluído:
1. Clique em **"Resolver"** (botão verde)
2. Opcionalmente, adicione uma tag de encerramento
3. O cliente pode receber uma pesquisa de satisfação automática

---

## Contatos (Mini-CRM)

### O que é um Contato

Cada pessoa que envia mensagem para você é automaticamente criada como um contato. Você pode enriquecer o perfil com informações adicionais.

### Editar um Contato

1. Acesse **Contatos** no menu lateral
2. Clique no contato
3. Edite nome, email, empresa, etc.

### Campos Customizados

Você pode criar campos específicos do seu negócio, como "CPF", "Plano contratado", "Data de nascimento".

**Como criar:**
Vá em **Configurações → Campos de Contato → Novo campo**

Tipos disponíveis: Texto, Número, Data, Sim/Não, Seleção única, Seleção múltipla.

### Tags de Contato

Tags servem para segmentar seus contatos (ex: "lead", "cliente", "vip", "inadimplente").

**Aplicar tag:** Abra o contato → clique em **"+ Tag"**

**Segmentar por tag:** Use o filtro de contatos ou no momento de criar broadcasts.

### Importar Contatos

Vá em **Contatos → Importar → Baixar modelo CSV**. Preencha e faça upload.

---

## Pipeline Kanban

### O que é o Pipeline

O Pipeline é uma visão kanban das suas conversas organizadas por estágios de negócio. Ideal para equipes comerciais.

### Configurar Estágios

Vá em **Configurações → Pipeline → Gerenciar estágios**

Exemplos de estágios:
- Novo Lead → Qualificado → Proposta Enviada → Em Negociação → Ganho / Perdido

### Usar o Pipeline

1. Acesse **Pipeline** no menu lateral
2. Cada coluna = um estágio
3. Arraste cards entre colunas para avançar negociações
4. Clique em um card para abrir a conversa

Adicione um **valor estimado** ao card para calcular o valor total em cada estágio.

---

## Broadcasts (Campanhas)

> Disponível nos planos Growth e Pro.

### O que São Broadcasts

São mensagens enviadas em massa para uma lista de contatos. Usam obrigatoriamente **templates aprovados** pela Meta.

### Criar um Broadcast

1. Vá em **Broadcasts → Novo broadcast**
2. Dê um nome interno
3. Selecione o **template** (precisa estar aprovado no Meta)
4. Defina o **público**: todos os contatos, por tag, por campo customizado
5. Agende ou envie imediatamente
6. Confirme — não há como cancelar após iniciado

### Regras Importantes

- Só envie para contatos que **autorizaram** receber comunicações
- Use **opt-out** (`PARAR` / `SAIR`) e respeite sempre — a plataforma desativa automaticamente quem pede
- Exceder limites de qualidade no Meta pode suspender seu número

### Relatório de Broadcast

Após o envio, veja em tempo real:
- Enviados, Entregues, Lidos, Responderam, Falhas

---

## Automações (Flow Builder)

> Disponível nos planos Growth e Pro.

### O que São Automações

Fluxos automáticos que rodam sem intervenção humana. Exemplos:
- Enviar mensagem de boas-vindas ao primeiro contato
- Rotear automaticamente para departamento certo baseado em palavra-chave
- Enviar lembrete após 1h sem resposta do cliente

### Criar um Fluxo

1. Vá em **Automações → Novo fluxo**
2. Escolha o **gatilho**:
   - Nova conversa
   - Palavra-chave recebida
   - Horário programado
   - Campo do contato alterado
3. Adicione **nós de ação**:
   - Enviar mensagem
   - Aguardar X minutos/horas
   - Condição (if/else)
   - Atribuir a agente/departamento
   - Definir tag
   - Chamar webhook externo
4. Ative o fluxo

### Exemplo: Bot de Boas-Vindas

```
[Gatilho: Nova conversa]
    ↓
[Enviar mensagem: "Olá {{contact.name}}! 👋 Bem-vindo à Empresa X. Como posso ajudar?
1️⃣ Suporte | 2️⃣ Vendas | 3️⃣ Financeiro"]
    ↓
[Aguardar resposta: 30 minutos]
    ↓
[Condição: resposta contém "1"]
    ├── Sim → [Atribuir ao departamento: Suporte]
    ├── "2"  → [Atribuir ao departamento: Vendas]
    └── "3"  → [Atribuir ao departamento: Financeiro]
```

---

## Relatórios e Dashboards

### Dashboard Principal

O dashboard mostra uma visão geral em tempo real:
- **Conversas abertas** — total e por departamento
- **Tempo médio de primeira resposta** — meta: < 2 min
- **Tempo médio de resolução**
- **Agentes online** e sua carga de trabalho
- **Satisfação (CSAT)** — média das pesquisas

### Relatórios por Período

Vá em **Relatórios** e selecione o período:

**Volume:** Conversas abertas, resolvidas, por canal, por departamento

**Performance da equipe:**
- Conversas por agente
- Tempo médio de resposta por agente
- Avaliações CSAT por agente

**Broadcasts:**
- Taxa de entrega e leitura por campanha

### Exportar Dados

Todos os relatórios podem ser exportados em CSV ou Excel.

---

## Configurações

### Configurações do Número WhatsApp

**Configurações → WhatsApp → Seu número**

- **Mensagem de boas-vindas:** Enviada ao primeiro contato
- **Mensagem de ausência:** Enviada fora do horário configurado
- **Horário de atendimento:** Defina dias e horários
- **Bot de IA:** Ative/desative e configure o comportamento

### Configurações de Equipe

**Configurações → Equipe**

- Convidar novos usuários (por email)
- Definir papel: Agente, Supervisor, Admin
- Desativar usuários que saíram da empresa

### Departamentos

**Configurações → Departamentos**

- Criar departamentos (Vendas, Suporte, etc.)
- Associar agentes a departamentos
- Configurar horário por departamento

### Faturamento

**Configurações → Faturamento**

- Ver plano atual e data de renovação
- Fazer upgrade/downgrade
- Ver histórico de faturas
- Adicionar/trocar cartão de crédito
- Cancelar assinatura

---

## Perguntas Frequentes

**P: Posso conectar mais de um número WhatsApp?**
R: Sim! A partir do plano Pro. Cada número adicional é cobrado separadamente.

**P: O que acontece se eu exceder o limite de conversas do meu plano?**
R: Você receberá um alerta ao chegar em 80%. Ao exceder, será cobrado automaticamente pelo excedente (R$ 0,15/conversa no Growth). Você nunca ficará sem atender seus clientes.

**P: O bot responde 24h?**
R: Sim, o bot de IA funciona o tempo todo. Você pode configurá-lo para funcionar apenas fora do horário de atendimento, se preferir.

**P: Posso exportar todas as conversas?**
R: Sim. Vá em Configurações → Dados → Exportar. O arquivo estará disponível em até 24h.

**P: O que é a janela de 24 horas do WhatsApp?**
R: O WhatsApp permite mensagens livres apenas nas 24h após o último contato do cliente. Após isso, só é possível enviar templates aprovados. A plataforma avisa automaticamente quando essa regra se aplica.

**P: Meus dados ficam no Brasil?**
R: Sim. Todos os dados são armazenados em servidores AWS em São Paulo (sa-east-1), em conformidade com a LGPD.

---

## Suporte

- **Chat ao vivo:** Botão de suporte no canto inferior direito da plataforma
- **Email:** suporte@zaptend.com.br
- **Central de Ajuda:** ajuda.zaptend.com.br
- **Status da plataforma:** status.zaptend.com.br
- **Horário de suporte:** Segunda a Sexta, 9h às 18h (GMT-3)

---

## Glossário

| Termo | Definição |
|-------|-----------|
| WABA | WhatsApp Business Account — conta empresarial Meta |
| Template | Mensagem pré-aprovada pela Meta para envio fora da janela 24h |
| Broadcast | Envio em massa para uma lista de contatos |
| CSAT | Customer Satisfaction Score — pesquisa de satisfação |
| TMA | Tempo Médio de Atendimento / primeira resposta |
| TMR | Tempo Médio de Resolução |
| SLA | Service Level Agreement — prazo máximo para responder |
| Opt-out | Contato que pediu para não receber mais mensagens |
| Flow | Fluxo de automação configurado no Flow Builder |
| Handoff | Transferência do bot para um atendente humano |
