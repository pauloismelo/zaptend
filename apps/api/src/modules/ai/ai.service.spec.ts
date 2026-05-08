import { InternalServerErrorException } from '@nestjs/common'
import { AiService } from './ai.service'

describe('AiService', () => {
  let service: AiService
  const originalEnv = process.env.ANTHROPIC_API_KEY

  beforeEach(() => {
    service = new AiService()
    process.env.ANTHROPIC_API_KEY = 'test-key'
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ content: [{ type: 'text', text: 'Resposta' }] }),
    } as never)
  })

  afterEach(() => {
    process.env.ANTHROPIC_API_KEY = originalEnv
    jest.restoreAllMocks()
  })

  it('gera resposta do bot com modelo Claude Haiku e detecta handoff', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'Vou chamar um humano. HANDOFF_REQUESTED' }],
      }),
    })

    const result = await service.generateBotResponse(
      'tenant-1',
      'preciso cancelar',
      [{ role: 'user', content: 'oi' }],
      { systemPrompt: 'Prompt do tenant' },
    )

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.anthropic.com/v1/messages',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('claude-haiku-4-5-20251001'),
      }),
    )
    expect(result).toEqual({ text: 'Vou chamar um humano.', handoffRequested: true })
  })

  it('analisa sentimento e normaliza score', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({
        content: [{ type: 'text', text: '{"sentiment":"urgent","score":0.93}' }],
      }),
    })

    await expect(service.analyzeSentiment('Estou muito irritado')).resolves.toEqual({
      sentiment: 'urgent',
      score: 0.93,
    })
  })

  it('resume conversa em três bullets', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({
        content: [{ type: 'text', text: '{"bullets":["A","B","C","D"]}' }],
      }),
    })

    await expect(service.summarizeConversation(['Cliente pediu preço'])).resolves.toEqual(['A', 'B', 'C'])
  })

  it('falha quando ANTHROPIC_API_KEY não está configurada', async () => {
    delete process.env.ANTHROPIC_API_KEY

    await expect(service.analyzeSentiment('oi')).rejects.toThrow(InternalServerErrorException)
  })
})
