import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common'

export type Sentiment = 'positive' | 'neutral' | 'negative' | 'urgent'
export type ConversationIntent = 'suporte' | 'compra' | 'cancelamento' | 'reclamação' | 'dúvida'

export interface AiMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface BotConfig {
  systemPrompt?: string | null
  welcomeMessage?: string | null
}

export interface BotResponse {
  text: string
  handoffRequested: boolean
}

export interface SentimentResult {
  sentiment: Sentiment
  score: number
}

interface AnthropicTextBlock {
  type: 'text'
  text: string
}

interface AnthropicResponse {
  content?: AnthropicTextBlock[]
}

const AI_MODEL = 'claude-haiku-4-5-20251001'
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_VERSION = '2023-06-01'

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name)

  async generateBotResponse(
    tenantId: string,
    message: string,
    history: AiMessage[],
    botConfig: BotConfig,
  ): Promise<BotResponse> {
    const system = [
      botConfig.systemPrompt ?? 'Você é um atendente do WhatsApp. Responda em português do Brasil, com clareza e objetividade.',
      'Quando a conversa precisar de humano, inclua exatamente o marcador HANDOFF_REQUESTED.',
    ].join('\n')

    const text = await this.createMessage({
      tenantId,
      system,
      messages: [
        ...history.slice(-10),
        { role: 'user', content: message },
      ],
      maxTokens: 500,
    })

    const handoffRequested = text.includes('HANDOFF_REQUESTED')
    return {
      text: text.replace(/HANDOFF_REQUESTED/g, '').trim(),
      handoffRequested,
    }
  }

  async analyzeSentiment(text: string): Promise<SentimentResult> {
    const response = await this.createMessage({
      system: 'Classifique o sentimento do texto como positive, neutral, negative ou urgent. Responda apenas JSON válido no formato {"sentiment":"neutral","score":0.5}. Score vai de 0 a 1.',
      messages: [{ role: 'user', content: text }],
      maxTokens: 120,
    })

    return this.parseSentiment(response)
  }

  async summarizeConversation(messages: string[]): Promise<string[]> {
    const response = await this.createMessage({
      system: 'Resuma a conversa em exatamente 3 bullets curtos, em português. Responda como JSON válido no formato {"bullets":["...","...","..."]}.',
      messages: [{ role: 'user', content: messages.join('\n') }],
      maxTokens: 300,
    })

    return this.parseBullets(response)
  }

  async detectIntent(messages: string[]): Promise<ConversationIntent> {
    const response = await this.createMessage({
      system: 'Detecte a intenção principal: suporte, compra, cancelamento, reclamação ou dúvida. Responda apenas JSON válido no formato {"intent":"suporte"}.',
      messages: [{ role: 'user', content: messages.join('\n') }],
      maxTokens: 80,
    })

    return this.parseIntent(response)
  }

  async suggestReply(messages: string[], instruction?: string): Promise<string> {
    return this.createMessage({
      system: 'Você é um co-pilot para agentes de atendimento WhatsApp. Sugira uma única resposta pronta para enviar, em português do Brasil, educada e objetiva.',
      messages: [
        { role: 'user', content: messages.join('\n') },
        ...(instruction ? [{ role: 'user' as const, content: `Instrução adicional: ${instruction}` }] : []),
      ],
      maxTokens: 350,
    })
  }

  private async createMessage(params: {
    tenantId?: string
    system: string
    messages: AiMessage[]
    maxTokens: number
  }): Promise<string> {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new InternalServerErrorException('ANTHROPIC_API_KEY não configurada')
    }

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
      const details = await response.text()
      this.logger.error(`Anthropic API falhou${params.tenantId ? ` tenant=${params.tenantId}` : ''}: ${response.status}`)
      throw new InternalServerErrorException(`Falha ao chamar Anthropic API: ${details}`)
    }

    const data = (await response.json()) as AnthropicResponse
    return data.content?.find((block) => block.type === 'text')?.text?.trim() ?? ''
  }

  private parseSentiment(raw: string): SentimentResult {
    try {
      const parsed = JSON.parse(raw) as { sentiment?: Sentiment; score?: number }
      const sentiment: Sentiment = ['positive', 'neutral', 'negative', 'urgent'].includes(parsed.sentiment ?? '')
        ? parsed.sentiment as Sentiment
        : 'neutral'
      const score = typeof parsed.score === 'number' ? Math.min(Math.max(parsed.score, 0), 1) : 0.5
      return { sentiment, score }
    } catch {
      return { sentiment: 'neutral', score: 0.5 }
    }
  }

  private parseBullets(raw: string): string[] {
    try {
      const parsed = JSON.parse(raw) as { bullets?: string[] }
      const bullets = parsed.bullets?.filter(Boolean).slice(0, 3)
      if (bullets?.length) return bullets
    } catch {
      // fallback abaixo
    }
    return raw.split('\n').map((line) => line.replace(/^[-*]\s*/, '').trim()).filter(Boolean).slice(0, 3)
  }

  private parseIntent(raw: string): ConversationIntent {
    try {
      const parsed = JSON.parse(raw) as { intent?: ConversationIntent }
      if (parsed.intent && ['suporte', 'compra', 'cancelamento', 'reclamação', 'dúvida'].includes(parsed.intent)) {
        return parsed.intent
      }
    } catch {
      // fallback abaixo
    }
    return 'dúvida'
  }
}
