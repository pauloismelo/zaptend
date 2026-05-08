import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { AiFacadeService } from './ai-facade.service'
import { AiService } from './ai.service'

const prismaMock = {
  conversation: {
    findFirst: jest.fn(),
  },
  message: {
    findMany: jest.fn(),
  },
}

const aiMock = {
  suggestReply: jest.fn(),
  summarizeConversation: jest.fn(),
  detectIntent: jest.fn(),
}

describe('AiFacadeService', () => {
  let service: AiFacadeService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiFacadeService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AiService, useValue: aiMock },
      ],
    }).compile()

    service = module.get(AiFacadeService)
    prismaMock.conversation.findFirst.mockResolvedValue({ id: 'conv-1' })
    prismaMock.message.findMany.mockResolvedValue([
      { direction: 'inbound', content: 'Olá' },
      { direction: 'outbound', content: 'Como ajudo?' },
    ])
  })

  afterEach(() => jest.clearAllMocks())

  it('retorna mood apenas da conversa do tenant', async () => {
    prismaMock.message.findMany.mockResolvedValue([{ id: 'msg-1', sentiment: 'negative' }])

    const result = await service.getMood('conv-1', 'tenant-1')

    expect(prismaMock.conversation.findFirst).toHaveBeenCalledWith({
      where: { id: 'conv-1', tenantId: 'tenant-1', deletedAt: null },
      select: { id: true },
    })
    expect(prismaMock.message.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: 'tenant-1', conversationId: 'conv-1' }),
      }),
    )
    expect(result).toEqual([{ id: 'msg-1', sentiment: 'negative' }])
  })

  it('gera sugestão baseada no histórico', async () => {
    aiMock.suggestReply.mockResolvedValue('Resposta sugerida')

    await expect(service.suggestReply('conv-1', 'tenant-1', {})).resolves.toEqual({
      suggestion: 'Resposta sugerida',
    })
    expect(aiMock.suggestReply).toHaveBeenCalledWith(['Cliente: Olá', 'Atendente: Como ajudo?'], undefined)
  })

  it('gera resumo em bullets', async () => {
    aiMock.summarizeConversation.mockResolvedValue(['A', 'B', 'C'])

    await expect(service.summarize('conv-1', 'tenant-1')).resolves.toEqual({ bullets: ['A', 'B', 'C'] })
  })

  it('detecta intenção', async () => {
    aiMock.detectIntent.mockResolvedValue('compra')

    await expect(service.detectIntent('conv-1', 'tenant-1')).resolves.toEqual({ intent: 'compra' })
  })

  it('bloqueia conversa fora do tenant', async () => {
    prismaMock.conversation.findFirst.mockResolvedValue(null)

    await expect(service.summarize('conv-1', 'tenant-1')).rejects.toThrow(NotFoundException)
  })
})
