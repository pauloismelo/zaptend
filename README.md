# ZapTend 🟢

> Plataforma SaaS multi-tenant de atendimento via WhatsApp

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 15 (App Router) + Tailwind CSS + Shadcn/UI |
| Estado (Frontend) | Zustand (server + UI state) + useEffect para fetch |
| Ícones | Lucide React |
| Formulários | React Hook Form + Zod |
| Testes Frontend | Jest + Testing Library |
| Backend | NestJS + Prisma + PostgreSQL |
| Validação | class-validator + class-transformer (DTOs) |
| Documentação API | Swagger (SwaggerModule) |
| Testes Backend | Jest (cobertura ≥ 80% por service) |
| Real-time | Socket.io + BullMQ |
| Cache/Queue | Redis (ElastiCache) |
| Storage | AWS S3 |
| Auth | JWT + Refresh Tokens |
| Billing | Stripe |
| AI | Anthropic Claude Haiku |
| Infra | AWS ECS Fargate + Aurora PostgreSQL |
| CI/CD | GitHub Actions |
| IaC | Terraform |

## Estrutura do Monorepo

```
zaptend/
├── apps/
│   ├── web/         # Next.js frontend
│   ├── api/         # NestJS API
│   └── worker/      # BullMQ workers
├── packages/
│   ├── database/    # Prisma schema
│   ├── types/       # TypeScript compartilhado
│   └── ui/          # Componentes base
├── agents/          # Agentes Claude Code
├── skills/          # Skills de domínio
├── docs/            # PRD, User Guide, ADRs
├── deploy/          # CI/CD, Docker, Terraform
└── CLAUDE.md        # Contexto para Claude Code
```

## Documentação

| Documento | Descrição |
|-----------|-----------|
| [CLAUDE.md](./CLAUDE.md) | Contexto principal para Claude Code |
| [docs/PRD.md](./docs/PRD.md) | Product Requirements Document |
| [docs/USER_GUIDE.md](./docs/USER_GUIDE.md) | Guia do usuário |
| [config/schema.prisma](./config/schema.prisma) | Schema do banco de dados |
| [deploy/ci-cd.yml](./deploy/ci-cd.yml) | Pipeline GitHub Actions |

## Agentes Claude Code

| Agente | Arquivo | Uso |
|--------|---------|-----|
| Coordinator | [agents/coordinator.md](./agents/coordinator.md) | Orquestração de tarefas complexas |
| Backend | [agents/backend.md](./agents/backend.md) | NestJS, Prisma, APIs |
| Frontend | [agents/frontend.md](./agents/frontend.md) | Next.js, componentes |
| WhatsApp/Infra/Billing/Reviewer | [agents/whatsapp-infra-billing-reviewer.md](./agents/whatsapp-infra-billing-reviewer.md) | Especializados |

## Skills de Domínio

| Skill | Quando Usar |
|-------|------------|
| WhatsApp Message Processing | Processar/enviar mensagens |
| Tenant Context | Isolamento multi-tenant |
| Feature Flag Check | Verificar plano do tenant |
| Conversation Assignment | Atribuição e transferência |
| CSAT Survey | Pesquisa de satisfação |
| AI Bot Response | Geração de respostas pelo bot |

Detalhes em [skills/domain-skills.md](./skills/domain-skills.md)

## Quick Start (Desenvolvimento)

```bash
# Pré-requisitos: Node 20+, pnpm, Docker

# 1. Clone e instale dependências
git clone https://github.com/sua-org/zaptend
cd zaptend
pnpm install

# 2. Suba infraestrutura local
docker compose up -d  # PostgreSQL + Redis

# 3. Configure variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais

# 4. Rode migrations
pnpm --filter=database migrate:dev

# 5. Inicie todos os apps
pnpm dev
```

**URLs locais:**
- Frontend: http://localhost:3000
- API: http://localhost:3001
- Prisma Studio: http://localhost:5555

## Branches

| Branch | Ambiente | Deploy |
|--------|----------|--------|
| `develop` | Staging | Automático ao fazer push |
| `main` | Produção | Automático + aprovação manual |

## Convenções

- **Commits:** Conventional Commits (`feat:`, `fix:`, `chore:`)
- **PRs:** Obrigatório passar CI antes de merge
- **TypeScript:** Strict mode, sem `any`
- **Idioma do código:** Inglês (variáveis, funções, comentários)
- **Idioma das mensagens ao usuário:** Português BR

## Contato

- **Email técnico:** dev@zaptend.com.br
- **Suporte:** suporte@zaptend.com.br
- **Status:** status.zaptend.com.br
