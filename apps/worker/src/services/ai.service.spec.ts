import { InternalServerErrorException } from '@nestjs/common'
import { WorkerAiService } from './ai.service'

describe('WorkerAiService', () => {
  let service: WorkerAiService
  const originalApiKey = process.env.ANTHROPIC_API_KEY

  beforeEach(() => {
    service = new WorkerAiService()
    process.env.ANTHROPIC_API_KEY = 'test-key'
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ content: [{ type: 'text', text: '{"sentiment":"negative","score":0.8}' }] }),
    } as never)
  })

  afterEach(() => {
    process.env.ANTHROPIC_API_KEY = originalApiKey
    jest.restoreAllMocks()
  })

  it('analisa sentimento com mock da Anthropic API', async () => {
    await expect(service.analyzeSentiment('ruim')).resolves.toEqual({
      sentiment: 'negative',
      score: 0.8,
    })
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.anthropic.com/v1/messages',
      expect.objectContaining({ body: expect.stringContaining('claude-haiku-4-5-20251001') }),
    )
  })

  it('detecta handoff na resposta do bot', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'Vou transferir. HANDOFF_REQUESTED' }],
      }),
    })

    await expect(
      service.generateBotResponse('tenant-1', 'quero humano', [], { systemPrompt: 'Prompt' }),
    ).resolves.toEqual({ text: 'Vou transferir.', handoffRequested: true })
  })

  it('falha quando ANTHROPIC_API_KEY não está configurada', async () => {
    delete process.env.ANTHROPIC_API_KEY

    await expect(service.analyzeSentiment('oi')).rejects.toThrow(InternalServerErrorException)
  })
})
