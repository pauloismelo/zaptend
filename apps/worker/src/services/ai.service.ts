import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common'

export type Sentiment = 'positive' | 'neutral' | 'negative' | 'urgent'

export interface AiMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface BotConfig {
  systemPrompt?: string | null
  welcomeMessage?: string | null
}

const AI_MODEL = 'claude-haiku-4-5-20251001'
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_VERSION = '2023-06-01'

@Injectable()
export class WorkerAiService {
  private readonly logger = new Logger(WorkerAiService.name)

  async generateBotResponse(
    tenantId: string,
    message: string,
    history: AiMessage[],
    botConfig: BotConfig,
  ) {
    const text = await this.createMessage({
      tenantId,
      system: [
        botConfig.systemPrompt ?? 'Você é um atendente do WhatsApp. Responda em português do Brasil, com clareza e objetividade.',
        'Quando a conversa precisar de humano, inclua exatamente o marcador HANDOFF_REQUESTED.',
      ].join('\n'),
      messages: [...history.slice(-10), { role: 'user', content: message }],
      maxTokens: 500,
    })

    return {
      text: text.replace(/HANDOFF_REQUESTED/g, '').trim(),
      handoffRequested: text.includes('HANDOFF_REQUESTED'),
    }
  }

  async analyzeSentiment(text: string) {
    const raw = await this.createMessage({
      system: 'Classifique o sentimento como positive, neutral, negative ou urgent. Responda apenas JSON válido no formato {"sentiment":"neutral","score":0.5}.',
      messages: [{ role: 'user', content: text }],
      maxTokens: 120,
    })

    try {
      const parsed = JSON.parse(raw) as { sentiment?: Sentiment; score?: number }
      const sentiment: Sentiment = ['positive', 'neutral', 'negative', 'urgent'].includes(parsed.sentiment ?? '')
        ? parsed.sentiment as Sentiment
        : 'neutral'
      const score = typeof parsed.score === 'number' ? Math.min(Math.max(parsed.score, 0), 1) : 0.5
      return { sentiment, score }
    } catch {
      return { sentiment: 'neutral' as const, score: 0.5 }
    }
  }

  private async createMessage(params: {
    tenantId?: string
    system: string
    messages: AiMessage[]
    maxTokens: number
  }) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) throw new InternalServerErrorException('ANTHROPIC_API_KEY não configurada')

    const response = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        max_tokens: params.maxTokens,
        system: params.system,
        messages: params.messages,
      }),
    })

    if (!response.ok) {
      this.logger.error(`Anthropic API falhou${params.tenantId ? ` tenant=${params.tenantId}` : ''}: ${response.status}`)
      throw new InternalServerErrorException('Falha ao chamar Anthropic API')
    }

    const data = (await response.json()) as { content?: Array<{ type: 'text'; text: string }> }
    return data.content?.find((block) => block.type === 'text')?.text?.trim() ?? ''
  }
}
