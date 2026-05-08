# ZapTend — Guia Completo do Usuário

**Versão:** 1.0  
**Idioma:** Português do Brasil  
**Produto:** Plataforma SaaS de atendimento via WhatsApp

---

## 1. Boas-vindas

O ZapTend é uma plataforma para empresas atenderem clientes pelo WhatsApp com uma equipe inteira trabalhando no mesmo número, sem perder histórico, contexto, métricas ou controle.

Com ele você pode:

- Receber e responder mensagens do WhatsApp em uma inbox compartilhada.
- Distribuir conversas entre agentes e departamentos.
- Registrar notas internas sem mostrar ao cliente.
- Criar contatos, tags e campos customizados.
- Usar respostas rápidas.
- Organizar oportunidades em um pipeline kanban.
- Enviar campanhas de broadcast com templates aprovados.
- Criar automações.
- Usar recursos de IA para bot, sugestão de resposta, resumo, intenção e sentimento.
- Acompanhar métricas em dashboards e relatórios.
- Gerenciar plano, faturas e uso.

Este guia foi escrito para usuários que nunca mexeram no sistema. Se você estiver perdido, comece pela seção **Primeiros Passos**.

---

## 2. Conceitos Básicos

### Tenant

Tenant é a conta da sua empresa dentro do ZapTend. Cada empresa tem seus próprios usuários, contatos, conversas, configurações, plano e dados.

Exemplo: se sua empresa se chama ACME, ela pode acessar o sistema por um endereço como:

```text
acme.zaptend.com.br
```

ou, em ambiente local/desenvolvimento:

```text
http://localhost:3000/acme
```

### Usuário

Usuário é uma pessoa da sua equipe que acessa o sistema.

Exemplos:

- Dono da empresa.
- Gerente de atendimento.
- Supervisor.
- Atendente.
- Pessoa do financeiro.

### Conversa

Uma conversa é um atendimento com um contato pelo WhatsApp. Ela tem status, responsável, mensagens, notas, eventos e histórico.

### Contato

Contato é a pessoa ou empresa que fala com você pelo WhatsApp. Cada contato pode ter nome, telefone, email, empresa, tags e campos customizados.

### Agente

Agente é o usuário que atende clientes no dia a dia.

### Departamento

Departamento é um grupo de atendimento, como:

- Vendas.
- Suporte.
- Financeiro.
- Agendamento.
- Pós-venda.

### Plano

O plano define quais recursos e limites sua empresa pode usar.

Planos principais:

- Starter.
- Growth.
- Pro.
- Enterprise.

---

## 3. Perfis de Usuário

### Agente

Normalmente faz atendimento no dia a dia.

Pode:

- Ver conversas.
- Responder clientes.
- Usar respostas rápidas.
- Criar notas internas.
- Atualizar status de conversas.
- Ver detalhes de contatos.

### Supervisor

Monitora a operação e ajuda agentes.

Pode:

- Fazer tudo que o agente faz.
- Transferir conversas.
- Acompanhar filas.
- Ver relatórios.
- Receber alertas de sentimento negativo.
- Gerenciar respostas rápidas, dependendo da configuração.

### Admin

Configura a operação da empresa.

Pode:

- Gerenciar equipe.
- Gerenciar departamentos.
- Configurar WhatsApp.
- Criar automações.
- Gerenciar broadcasts.
- Acessar billing.
- Ver relatórios.

### Owner

É o dono da conta.

Pode:

- Fazer tudo que o admin faz.
- Alterar plano.
- Cancelar assinatura.
- Gerenciar dados sensíveis da conta.

### Super Admin

Perfil interno da ZapTend, separado dos tenants.

Pode:

- Ver todos os tenants.
- Ativar ou suspender tenants.
- Ver métricas globais.
- Ver uso por tenant.

---

## 4. Primeiros Passos

### 4.1 Entrar no Sistema

1. Acesse o endereço da sua empresa.
2. Informe email e senha.
3. Clique em **Entrar**.

Se você ainda não tem senha:

1. Verifique se recebeu um convite por email.
2. Clique no link do convite.
3. Crie sua senha.
4. Volte para a tela de login.

### 4.2 Criar Conta da Empresa

Se você é o primeiro usuário:

1. Acesse a tela de cadastro.
2. Informe os dados da empresa.
3. Crie seu usuário administrador.
4. Escolha ou confirme o plano.
5. Finalize o cadastro.

Por padrão, novas empresas podem ter um período de trial de 14 dias, conforme a configuração comercial vigente.

### 4.3 Entender a Tela Principal

A área do tenant é organizada assim:

- Menu lateral: acesso rápido a Inbox, Contatos, Pipeline, Broadcasts, Fluxos, Relatórios e Configurações.
- Topo: informações gerais e ações globais.
- Conteúdo principal: muda conforme a página aberta.

Principais áreas:

- **Inbox:** atendimento diário.
- **Contatos:** cadastro e CRM.
- **Pipeline:** oportunidades em kanban.
- **Broadcasts:** campanhas.
- **Fluxos/Automações:** automações.
- **Relatórios:** métricas e performance.
- **Configurações:** equipe, WhatsApp, billing e preferências.

---

## 5. Configuração Inicial Recomendada

Antes de começar a atender clientes, recomendamos seguir esta ordem.

### Passo 1: Configurar WhatsApp

Você precisa conectar um número WhatsApp Business/API.

Fluxo esperado:

1. Acesse **Configurações > WhatsApp**.
2. Clique em conectar ou configurar número.
3. Informe os dados solicitados da Meta/WhatsApp.
4. Ative o número.
5. Envie uma mensagem de teste para validar recebimento.

Observações importantes:

- O número deve estar habilitado para uso na API oficial da Meta.
- Tokens de acesso devem ser tratados como credenciais sensíveis.
- Em produção, tokens são armazenados criptografados.

### Passo 2: Criar Departamentos

Departamentos ajudam a distribuir conversas.

Exemplos:

- Vendas.
- Suporte.
- Financeiro.
- Agendamento.

Para criar:

1. Acesse **Configurações > Departamentos**.
2. Clique em **Novo departamento**.
3. Informe nome, descrição e cor.
4. Salve.

### Passo 3: Convidar Equipe

1. Acesse **Configurações > Equipe**.
2. Clique em **Convidar usuário**.
3. Informe nome, email e função.
4. Selecione departamentos, se necessário.
5. Envie o convite.

### Passo 4: Criar Respostas Rápidas

Respostas rápidas economizam tempo.

Exemplos:

- Saudação inicial.
- Informação de horário.
- Solicitação de dados.
- Link de pagamento.
- Encerramento.

### Passo 5: Revisar Plano e Billing

1. Acesse **Configurações > Billing**.
2. Confira plano atual.
3. Veja limites de uso.
4. Verifique faturas.
5. Confirme se o plano atende à operação.

---

## 6. Inbox

A Inbox é a tela mais importante para agentes.

Ela normalmente tem:

- Lista de conversas à esquerda.
- Chat no centro.
- Detalhes do contato à direita.
- Dashboard de métricas no topo.

### 6.1 Dashboard da Inbox

No topo da Inbox você verá métricas como:

- Conversas abertas.
- TMA: tempo médio até atribuição ou primeira resposta, conforme configuração.
- CSAT médio.
- Agentes online.
- Volume das últimas 24 horas.
- Conversas aguardando atribuição.

Use esse painel para entender rapidamente se a operação está saudável.

### 6.2 Lista de Conversas

Na lista aparecem conversas recentes.

Cada conversa pode mostrar:

- Nome ou telefone do contato.
- Última mensagem.
- Status.
- Responsável.
- Departamento.
- Indicador de não lidas.

### 6.3 Status de Conversa

Status comuns:

- **Aberta:** conversa nova ou ainda sem tratamento.
- **Em atendimento:** alguém assumiu a conversa.
- **Aguardando cliente:** a equipe respondeu e está esperando retorno.
- **Resolvida:** atendimento encerrado.
- **Spam:** conversa marcada como irrelevante ou abusiva.

Boas práticas:

- Não deixe conversas abertas sem responsável por muito tempo.
- Use **Aguardando cliente** quando você já respondeu.
- Use **Resolvida** apenas quando o caso terminou.

### 6.4 Abrir uma Conversa

1. Acesse **Inbox**.
2. Clique em uma conversa na lista.
3. Leia o histórico.
4. Confira o painel direito antes de responder.

### 6.5 Responder uma Mensagem

1. Clique no campo de mensagem.
2. Digite sua resposta.
3. Clique em enviar ou use o atalho configurado.

Boas práticas:

- Leia as últimas mensagens antes de responder.
- Confira se há notas internas.
- Use respostas rápidas, mas personalize quando necessário.
- Evite enviar dados sensíveis em texto aberto.

### 6.6 Anexos

O campo de mensagem pode permitir anexos, conforme o tipo suportado.

Tipos comuns:

- Imagem.
- Documento.
- Áudio.
- Vídeo.

Se um anexo falhar:

- Verifique o tamanho do arquivo.
- Verifique o formato.
- Tente reenviar.
- Se persistir, fale com o admin.

### 6.7 Respostas Rápidas no Chat

Para usar:

1. Digite `/`.
2. Comece a buscar a resposta.
3. Selecione a opção.
4. Revise.
5. Envie.

Exemplo:

```text
/oi
```

pode preencher:

```text
Olá! Como posso ajudar?
```

### 6.8 Notas Internas

Notas internas ajudam a equipe a manter contexto.

Exemplos:

- "Cliente pediu retorno amanhã às 10h."
- "Já enviei proposta por email."
- "Caso sensível, falar com supervisor antes de responder."

Notas internas não são enviadas ao cliente.

### 6.9 Timeline de Eventos

A timeline registra eventos como:

- Conversa atribuída.
- Conversa transferida.
- Status alterado.
- Tag adicionada.
- Handoff do bot.

Use a timeline para entender o que aconteceu antes de você assumir.

### 6.10 Atribuir Conversa

Se uma conversa está sem responsável:

1. Abra a conversa.
2. Escolha o responsável ou departamento.
3. Confirme.

Quando atribuir:

- Quando você vai atender.
- Quando precisa direcionar ao time correto.
- Quando um supervisor distribui a fila.

### 6.11 Transferir Conversa

Transfira quando outro agente ou departamento deve continuar.

Sempre deixe uma nota explicando o motivo.

Exemplo:

```text
Cliente quer negociar contrato anual. Transferindo para vendas enterprise.
```

### 6.12 Resolver Conversa

Resolva somente quando:

- O cliente teve a dúvida respondida.
- A compra foi concluída.
- O caso foi encerrado.
- Não há próxima ação pendente.

---

## 7. Contatos e Mini-CRM

### 7.1 O que é um Contato

Todo número que conversa com sua empresa vira um contato.

Um contato pode ter:

- Nome.
- Telefone.
- Email.
- Empresa.
- Tags.
- Campos customizados.
- Histórico de conversas.

### 7.2 Buscar Contatos

1. Acesse **Contatos**.
2. Use busca por nome, telefone ou empresa.
3. Aplique filtros, se disponíveis.

### 7.3 Editar Contato

1. Abra o contato.
2. Clique em editar.
3. Atualize dados.
4. Salve.

### 7.4 Tags

Tags ajudam na organização e segmentação.

Exemplos:

- lead.
- cliente.
- vip.
- inadimplente.
- interesse-pro.
- suporte-urgente.

Boas práticas:

- Use nomes curtos.
- Evite tags duplicadas com variações.
- Combine padrões com a equipe.

### 7.5 Campos Customizados

Campos customizados guardam dados específicos.

Exemplos:

- CPF.
- Plano contratado.
- Cidade.
- Data de renovação.
- Tipo de interesse.

Esses campos podem ser usados em segmentações e automações.

### 7.6 Opt-out

Opt-out indica que o contato não quer receber comunicações em massa.

Se um cliente pedir para parar de receber mensagens:

- Marque como opt-out.
- Não inclua em broadcasts.
- Respeite sempre a solicitação.

---

## 8. Pipeline

O Pipeline organiza conversas como oportunidades em um kanban.

### 8.1 Para que Serve

Use o Pipeline para:

- Acompanhar leads.
- Gerenciar vendas.
- Monitorar propostas.
- Ver oportunidades por estágio.
- Estimar valor em negociação.

### 8.2 Colunas

Exemplo de colunas:

- Novo.
- Qualificado.
- Proposta.
- Ganho.
- Perdido.

### 8.3 Mover Cards

1. Acesse **Pipeline**.
2. Encontre o card.
3. Arraste para outra coluna.
4. A etapa da conversa será atualizada.

### 8.4 Valor Estimado

Cada card pode ter valor estimado.

Use para prever:

- Receita em negociação.
- Valor por etapa.
- Potencial de fechamento.

### 8.5 Filtros

Você pode filtrar por:

- Agente.
- Departamento.

Use filtros para reuniões individuais ou análise de equipe.

---

## 9. Broadcasts

Broadcasts são campanhas enviadas para vários contatos.

### 9.1 Disponibilidade por Plano

Broadcasts estão disponíveis conforme o plano contratado. Normalmente:

- Starter: indisponível.
- Growth: disponível com limite mensal.
- Pro: disponível com limite maior.

### 9.2 Regras Importantes

Broadcasts no WhatsApp precisam seguir regras da Meta:

- Use templates aprovados.
- Envie apenas para contatos com consentimento.
- Respeite opt-out.
- Evite spam.
- Não compre listas.

### 9.3 Criar Broadcast

1. Acesse **Broadcasts**.
2. Clique em novo broadcast.
3. Informe nome interno.
4. Selecione template Meta.
5. Configure variáveis do template.
6. Defina público.
7. Agende ou inicie.

### 9.4 Segmentação

Você pode segmentar por:

- Tags.
- Campos customizados.
- Opt-out falso.

Exemplo:

Enviar apenas para contatos com tag `lead` e campo `plano = pro`.

### 9.5 Acompanhar Resultados

Métricas comuns:

- Total de destinatários.
- Enviados.
- Entregues.
- Lidos.
- Falhas.

---

## 10. Automações e Flow Builder

Automações executam ações automaticamente.

### 10.1 Gatilhos

Gatilhos disponíveis:

- Nova conversa.
- Palavra-chave.
- Agendamento.
- Campo alterado.

### 10.2 Nós de Automação

Tipos comuns:

- Mensagem.
- Condição.
- Delay.
- Atribuir.
- Tag.
- Webhook.
- Fim.

### 10.3 Exemplo de Fluxo

```text
Nova conversa
→ Enviar mensagem de boas-vindas
→ Condição: mensagem contém "preço"
→ Adicionar tag "interesse-preço"
→ Atribuir para Vendas
→ Fim
```

### 10.4 Boas Práticas

- Teste fluxos antes de ativar.
- Use mensagens curtas.
- Evite loops.
- Adicione fim explícito.
- Use tags para registrar decisões do fluxo.

---

## 11. IA no ZapTend

### 11.1 Bot Automático

O bot responde automaticamente quando configurado e ativo.

Ele pode:

- Responder dúvidas comuns.
- Coletar informações iniciais.
- Encaminhar para humano quando necessário.

Quando o bot identifica que precisa de humano, ocorre handoff.

### 11.2 Handoff para Humano

Handoff acontece quando:

- O cliente pede atendimento humano.
- A IA entende que não deve continuar.
- A mensagem exige cuidado.

Depois disso, a conversa deve ser assumida por agente.

### 11.3 Mood AI

Mood AI analisa sentimento das mensagens recebidas.

Classificações:

- positive.
- neutral.
- negative.
- urgent.

Se houver várias mensagens negativas ou urgentes seguidas, supervisores podem receber alerta.

### 11.4 AI Co-Pilot

O Co-Pilot ajuda agentes.

Recursos:

- Sugerir resposta.
- Resumir conversa.
- Detectar intenção.

### 11.5 Sugerir Resposta

No campo de mensagem:

1. Clique em **Sugerir resposta**.
2. A IA preenche o texto.
3. Revise antes de enviar.

Importante: nunca envie sugestão da IA sem ler.

### 11.6 Resumir Conversa

No painel lateral:

1. Clique em **Resumir**.
2. Leia os 3 bullets.
3. Use para entender rapidamente o contexto.

### 11.7 Detectar Intenção

A IA pode classificar intenção como:

- suporte.
- compra.
- cancelamento.
- reclamação.
- dúvida.

Use isso para decidir o próximo passo.

---

## 12. Relatórios e Dashboard

### 12.1 Dashboard da Inbox

Mostra operação em tempo real.

Métricas principais:

- Conversas abertas.
- TMA.
- CSAT.
- Agentes online.
- Volume das últimas 24h.
- Conversas não atribuídas.

### 12.2 Página de Relatórios

Acesse **Relatórios** no menu lateral.

Você encontrará:

- Filtros por período.
- Volume por dia, semana ou mês.
- Performance por agente.
- Heatmap por dia da semana e horário.

### 12.3 Como Interpretar Métricas

**Conversas abertas:** indica carga atual da equipe.

**TMA:** quanto tempo demora para uma conversa ser assumida/respondida.

**TMR:** quanto tempo demora para resolver.

**CSAT:** satisfação do cliente, quando disponível.

**Agentes online:** equipe disponível agora.

**Heatmap:** mostra horários de pico.

### 12.4 Como Usar Relatórios em Reuniões

Sugestão de rotina semanal:

1. Veja volume total.
2. Veja horários de pico.
3. Compare performance por agente.
4. Identifique gargalos.
5. Ajuste escala e automações.

---

## 13. Billing, Planos e Uso

### 13.1 Acessar Billing

1. Vá em **Configurações > Billing**.
2. Veja plano atual.
3. Confira renovação.
4. Veja uso mensal.
5. Consulte faturas.

### 13.2 Planos

Resumo geral:

| Plano | Indicado para | Recursos |
|---|---|---|
| Starter | Times pequenos | Atendimento básico |
| Growth | Operações em crescimento | Broadcasts, automações e IA básica |
| Pro | Operações avançadas | Limites maiores, API e IA completa |
| Enterprise | Grandes operações | Condições personalizadas |

### 13.3 Uso Mensal

O sistema pode acompanhar:

- Conversas.
- Broadcasts.
- Requisições de IA.

Se você chegar perto do limite, considere upgrade.

### 13.4 Upgrade

1. Acesse Billing.
2. Clique no plano desejado.
3. Você será redirecionado para checkout.
4. Após pagamento, o plano é atualizado.

### 13.5 Cancelamento

1. Acesse Billing.
2. Clique em cancelar assinatura.
3. Confirme.

Normalmente o acesso permanece até o fim do período já pago, conforme regra comercial.

---

## 14. Super Admin

Esta seção é para equipe interna ZapTend.

### 14.1 Acesso

O Super Admin é separado dos tenants e restrito a emails `@zaptend.com.br`.

### 14.2 Gestão de Tenants

Permite:

- Listar tenants.
- Filtrar por nome, slug, email e status.
- Ver detalhes.
- Ver uso.
- Ver subscription.
- Ativar ou suspender tenant.

### 14.3 Métricas Globais

Indicadores:

- MRR total.
- Tenants ativos.
- Total de tenants.
- Crescimento dos últimos 30 dias.

### 14.4 Suspender Tenant

Use suspensão quando:

- Falha de pagamento.
- Abuso.
- Solicitação comercial.
- Risco de segurança.

Sempre registre o motivo no sistema interno de suporte.

---

## 15. Permissões e Acesso

### 15.1 Não Consigo Ver uma Página

Possíveis motivos:

- Seu perfil não tem permissão.
- Seu plano não inclui o recurso.
- Sua sessão expirou.
- O tenant está suspenso.

O que fazer:

1. Tente sair e entrar novamente.
2. Verifique com admin da empresa.
3. Confirme o plano em Billing.
4. Acione suporte.

### 15.2 Recursos Premium

Alguns recursos dependem do plano:

- Broadcasts.
- Flow Builder.
- AI Co-Pilot.
- API Access.

Se aparecer erro de permissão, pode ser limitação do plano.

---

## 16. Boas Práticas de Atendimento

### 16.1 Antes de Responder

- Leia o histórico.
- Veja notas internas.
- Confira tags.
- Confira se já existe responsável.
- Veja se a conversa está em alerta de sentimento.

### 16.2 Durante o Atendimento

- Seja claro e objetivo.
- Use nome do cliente quando possível.
- Evite mensagens longas demais.
- Use respostas rápidas como base, não como texto automático cego.
- Registre contexto em notas internas.

### 16.3 Ao Transferir

Sempre diga internamente:

- Por que está transferindo.
- O que o cliente quer.
- Qual foi a última ação feita.
- O que falta resolver.

### 16.4 Ao Encerrar

Antes de resolver:

- Confirme se não há pergunta pendente.
- Confira se promessa foi registrada.
- Use tag de encerramento, se sua operação usa tags.

---

## 17. Segurança e Privacidade

### 17.1 Cuidados com Dados

Não compartilhe:

- Senhas.
- Tokens.
- Dados bancários.
- Documentos sensíveis sem necessidade.
- Prints com dados de clientes em canais não autorizados.

### 17.2 LGPD

Trate dados pessoais com cuidado.

Boas práticas:

- Colete apenas o necessário.
- Não mantenha dados desatualizados.
- Respeite pedidos de exclusão.
- Respeite opt-out.

### 17.3 Login

Cuidados:

- Use senha forte.
- Não compartilhe usuário.
- Saia do sistema em computadores compartilhados.
- Avise admin se suspeitar de acesso indevido.

---

## 18. Dúvidas Frequentes

### O ZapTend substitui o WhatsApp?

Não. Ele usa a API oficial do WhatsApp para sua equipe atender de forma profissional.

### Posso usar o mesmo número no celular e na plataforma?

Depende da configuração com a Meta. Em geral, números conectados à API oficial têm regras próprias. Consulte o admin ou suporte antes de migrar.

### Por que não consigo enviar mensagem para um cliente?

Possíveis motivos:

- Janela de 24h expirada.
- Número sem opt-in.
- Template obrigatório.
- Falha na configuração WhatsApp.
- Conversa resolvida ou marcada como spam.

### O que é janela de 24h?

É uma regra do WhatsApp: após o cliente enviar mensagem, você pode responder livremente dentro de 24 horas. Depois disso, normalmente precisa usar template aprovado.

### O cliente vê minhas notas internas?

Não. Notas internas são visíveis apenas para a equipe.

### O cliente sabe que estou usando IA?

Depende da política da sua empresa. Recomendamos transparência quando o bot estiver atendendo automaticamente.

### Posso editar uma resposta sugerida pela IA?

Sim. A sugestão preenche o campo de texto; o agente deve revisar e pode editar antes de enviar.

### O que acontece quando o bot pede handoff?

A conversa é encaminhada para atendimento humano ou marcada para ser assumida pela equipe.

### Por que um supervisor recebeu alerta?

Porque a conversa teve sequência de mensagens com sentimento negativo ou urgente.

### O que significa CSAT?

CSAT é uma métrica de satisfação do cliente. Normalmente vem de uma avaliação enviada ao final do atendimento.

### O que significa TMA?

TMA é tempo médio de atendimento/atribuição, conforme a métrica configurada.

### O que significa TMR?

TMR é tempo médio de resolução.

### Posso enviar broadcast para qualquer pessoa?

Não. Envie apenas para contatos que autorizaram receber comunicação e respeite opt-out.

### Por que broadcast exige template?

Porque o WhatsApp exige templates aprovados para mensagens iniciadas pela empresa fora da janela de atendimento.

### Como sei meu limite mensal?

Acesse **Configurações > Billing**.

### Meu plano bloqueou um recurso. O que fazer?

Fale com o owner/admin para fazer upgrade ou revisar o plano.

### Apaguei ou resolvi algo por engano. Consigo recuperar?

Depende do tipo de ação. Fale com o admin ou suporte o quanto antes.

---

## 19. Solução de Problemas

### Mensagens não chegam na Inbox

Verifique:

1. Número WhatsApp está ativo?
2. Webhook está configurado?
3. Tenant está ativo?
4. Há instabilidade na Meta?
5. A API/worker estão online?

### Mensagens não enviam

Verifique:

1. Janela de 24h.
2. Template aprovado.
3. Token WhatsApp.
4. Status da conversa.
5. Permissão do usuário.

### Usuário não consegue entrar

Possíveis causas:

- Senha incorreta.
- Convite expirado.
- Usuário desativado.
- Tenant suspenso.
- Token expirado.

### Dashboard não carrega

Tente:

1. Recarregar página.
2. Conferir conexão.
3. Sair e entrar.
4. Verificar se a API está online.

### IA não responde

Verifique:

- Bot está ativo no número WhatsApp?
- Chave Anthropic está configurada?
- Conversa já está atribuída a humano?
- Plano inclui IA?
- Houve handoff?

### Broadcast não inicia

Verifique:

- Plano permite broadcasts?
- Template existe e está aprovado?
- Há contatos elegíveis?
- Contatos estão com opt-out falso?
- A fila/worker está rodando?

---

## 20. Rotinas Recomendadas

### Rotina do Agente

Todo dia:

1. Entrar no sistema.
2. Ver conversas atribuídas.
3. Responder pendências.
4. Atualizar status.
5. Registrar notas quando necessário.
6. Resolver conversas concluídas.

### Rotina do Supervisor

Todo dia:

1. Ver dashboard da Inbox.
2. Distribuir não atribuídas.
3. Monitorar alertas de sentimento.
4. Conferir agentes online.
5. Revisar conversas críticas.

Toda semana:

1. Ver relatórios.
2. Analisar performance por agente.
3. Ajustar escala por heatmap.
4. Revisar tags e automações.

### Rotina do Admin

Toda semana:

1. Conferir billing e uso.
2. Revisar equipe ativa.
3. Atualizar respostas rápidas.
4. Revisar automações.
5. Verificar saúde do WhatsApp.

---

## 21. Glossário

**Agente:** pessoa que atende clientes.  
**Broadcast:** envio em massa com template.  
**CSAT:** satisfação do cliente.  
**Flow Builder:** construtor de automações.  
**Handoff:** passagem do bot para humano.  
**Heatmap:** mapa de calor por horário/dia.  
**Inbox:** central de atendimento.  
**Opt-out:** cliente que não quer receber campanhas.  
**Pipeline:** kanban de oportunidades/conversas.  
**Tenant:** conta da empresa.  
**TMA:** tempo médio de atendimento/atribuição.  
**TMR:** tempo médio de resolução.  
**WABA:** WhatsApp Business Account.  

---

## 22. Checklist de Implantação

Use esta lista para garantir que sua operação está pronta.

- [ ] Empresa cadastrada.
- [ ] Owner criado.
- [ ] WhatsApp conectado.
- [ ] Mensagem de teste recebida.
- [ ] Departamentos criados.
- [ ] Usuários convidados.
- [ ] Responsáveis definidos.
- [ ] Respostas rápidas criadas.
- [ ] Tags padronizadas.
- [ ] Campos customizados definidos.
- [ ] Billing revisado.
- [ ] Bot configurado, se aplicável.
- [ ] Broadcast testado, se aplicável.
- [ ] Automações revisadas, se aplicável.
- [ ] Supervisores orientados sobre alertas.
- [ ] Relatórios validados.

---

## 23. Suporte

Se precisar de ajuda, tenha em mãos:

- Nome da empresa/tenant.
- Email do usuário.
- Print da tela, se possível.
- Horário aproximado do problema.
- ID da conversa, contato ou broadcast, se disponível.
- Descrição do que você tentou fazer.

Canais sugeridos:

- Suporte: `suporte@zaptend.com.br`
- Técnico: `dev@zaptend.com.br`
- Status: `status.zaptend.com.br`

---

## 24. Resumo para Treinamento Rápido

Se você tem apenas 10 minutos para treinar alguém:

1. Mostre como entrar.
2. Mostre a Inbox.
3. Mostre como abrir conversa.
4. Mostre como responder.
5. Mostre respostas rápidas com `/`.
6. Mostre notas internas.
7. Mostre como transferir.
8. Mostre como resolver.
9. Explique que IA sugere, mas o humano revisa.
10. Explique que broadcast exige cuidado e consentimento.

Pronto. Com isso, um usuário novo já consegue começar com segurança.
