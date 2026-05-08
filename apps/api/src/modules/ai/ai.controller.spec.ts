import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '../../prisma/prisma.service'
import { AiController } from './ai.controller'
import { AiFacadeService } from './ai-facade.service'

const facadeMock = {
  getMood: jest.fn(),
  suggestReply: jest.fn(),
  summarize: jest.fn(),
  detectIntent: jest.fn(),
}

const prismaMock = {
  subscription: {
    findUnique: jest.fn().mockResolvedValue({ plan: 'growth', status: 'active' }),
  },
}

const user = {
  sub: 'user-1',
  tenantId: 'tenant-1',
  tenantSlug: 'acme',
  email: 'agent@test.com',
  role: 'agent' as const,
}

describe('AiController', () => {
  let controller: AiController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiController],
      providers: [
        { provide: AiFacadeService, useValue: facadeMock },
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile()

    controller = module.get(AiController)
  })

  afterEach(() => jest.clearAllMocks())

  it('consulta mood pelo tenant do usuário', () => {
    facadeMock.getMood.mockResolvedValue([])
    controller.mood('conv-1', user)
    expect(facadeMock.getMood).toHaveBeenCalledWith('conv-1', 'tenant-1')
  })

  it('solicita sugestão de resposta', () => {
    facadeMock.suggestReply.mockResolvedValue({ suggestion: 'Oi' })
    controller.suggest('conv-1', user, { instruction: 'curta' })
    expect(facadeMock.suggestReply).toHaveBeenCalledWith('conv-1', 'tenant-1', { instruction: 'curta' })
  })

  it('solicita resumo', () => {
    facadeMock.summarize.mockResolvedValue({ bullets: [] })
    controller.summarize('conv-1', user)
    expect(facadeMock.summarize).toHaveBeenCalledWith('conv-1', 'tenant-1')
  })

  it('solicita intenção', () => {
    facadeMock.detectIntent.mockResolvedValue({ intent: 'suporte' })
    controller.intent('conv-1', user)
    expect(facadeMock.detectIntent).toHaveBeenCalledWith('conv-1', 'tenant-1')
  })
})
