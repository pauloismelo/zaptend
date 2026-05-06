import { Test, TestingModule } from '@nestjs/testing'
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'
import { WhatsAppService } from './whatsapp.service'
import { PrismaService } from '../../prisma/prisma.service'
import { KmsService } from '../../common/kms/kms.service'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const TENANT_A = 'tenant-a'
const TENANT_B = 'tenant-b'
const PHONE = '+5511999999999'
const ACCESS_TOKEN = 'decrypted-access-token'
const PHONE_NUMBER_ID = 'phone-id-123'
const WA_MSG_ID = 'wamid.abc123'
const CONTACT_ID = 'contact-1'
const CONV_ID = 'conv-1'

const mockConfig = {
  phoneNumberId: PHONE_NUMBER_ID,
  accessTokenEncrypted: 'encrypted-token',
}

const mockContact = { id: CONTACT_ID }
const mockConversation = { id: CONV_ID }

const mockMessage = {
  id: 'msg-1',
  tenantId: TENANT_A,
  conversationId: CONV_ID,
  waMessageId: WA_MSG_ID,
  direction: 'outbound',
  type: 'text',
  status: 'sent',
  content: null,
  mediaUrl: null,
  mediaType: null,
  templateName: null,
  reactionEmoji: null,
  sentAt: new Date(),
  createdAt: new Date(),
}

// ── Mocks ────────────────────────────────────────────────────────────────────

const prismaMock = {
  whatsAppConfig: { findFirst: jest.fn() },
  contact: { findFirst: jest.fn() },
  message: { findFirst: jest.fn(), create: jest.fn() },
  conversation: { findFirst: jest.fn(), update: jest.fn() },
  $transaction: jest.fn(),
}

const kmsMock = {
  decrypt: jest.fn().mockResolvedValue(ACCESS_TOKEN),
}

function mockFetch(ok: boolean, body: Record<string, unknown>): void {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 400,
    json: jest.fn().mockResolvedValue(body),
  }) as unknown as typeof fetch
}

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('WhatsAppService', () => {
  let service: WhatsAppService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WhatsAppService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: KmsService, useValue: kmsMock },
      ],
    }).compile()

    service = module.get<WhatsAppService>(WhatsAppService)

    // Happy-path defaults
    prismaMock.whatsAppConfig.findFirst.mockResolvedValue(mockConfig)
    prismaMock.contact.findFirst.mockResolvedValue(mockContact)
    prismaMock.message.findFirst.mockResolvedValue({ id: 'inbound-1' })
    prismaMock.conversation.findFirst.mockResolvedValue(mockConversation)
    prismaMock.message.create.mockResolvedValue(mockMessage)
    prismaMock.conversation.update.mockResolvedValue(mockConversation)
    prismaMock.$transaction.mockImplementation((ops: Promise<unknown>[]) => Promise.all(ops))

    mockFetch(true, { messages: [{ id: WA_MSG_ID }] })
  })

  afterEach(() => jest.clearAllMocks())

  // ── sendTextMessage ────────────────────────────────────────────────────────

  describe('sendTextMessage', () => {
    it('deve enviar texto e salvar mensagem com direction=outbound', async () => {
      const result = await service.sendTextMessage(TENANT_A, PHONE, 'Olá!')

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/${PHONE_NUMBER_ID}/messages`),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ Authorization: `Bearer ${ACCESS_TOKEN}` }),
        }),
      )
      expect(result.direction).toBe('outbound')
    })

    it('deve incluir o texto correto no payload da Meta API', async () => {
      await service.sendTextMessage(TENANT_A, PHONE, 'Olá mundo!')

      const [, init] = (global.fetch as jest.Mock).mock.calls[0] as [string, RequestInit]
      const body = JSON.parse(init.body as string) as Record<string, unknown>

      expect(body.type).toBe('text')
      expect((body.text as Record<string, unknown>).body).toBe('Olá mundo!')
    })

    it('deve verificar a janela de 24h antes de enviar', async () => {
      prismaMock.message.findFirst.mockResolvedValue(null)

      await expect(service.sendTextMessage(TENANT_A, PHONE, 'Olá')).rejects.toThrow(
        BadRequestException,
      )
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('deve bloquear quando contato não existe no tenant', async () => {
      prismaMock.contact.findFirst.mockResolvedValue(null)

      await expect(service.sendTextMessage(TENANT_A, PHONE, 'Olá')).rejects.toThrow(
        BadRequestException,
      )
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('deve lançar NotFoundException quando config WhatsApp inativa/ausente', async () => {
      prismaMock.whatsAppConfig.findFirst.mockResolvedValue(null)

      await expect(service.sendTextMessage(TENANT_A, PHONE, 'Olá')).rejects.toThrow(
        NotFoundException,
      )
    })

    it('deve filtrar config por tenantId correto', async () => {
      await service.sendTextMessage(TENANT_A, PHONE, 'Olá')

      expect(prismaMock.whatsAppConfig.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: TENANT_A, isActive: true }),
        }),
      )
    })

    it('deve lançar InternalServerErrorException quando Meta API retorna erro', async () => {
      mockFetch(false, { error: { message: 'Invalid token', code: 190 } })

      await expect(service.sendTextMessage(TENANT_A, PHONE, 'Olá')).rejects.toThrow(
        InternalServerErrorException,
      )
    })

    it('deve lançar InternalServerErrorException em falha de rede', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('ECONNREFUSED')) as unknown as typeof fetch

      await expect(service.sendTextMessage(TENANT_A, PHONE, 'Olá')).rejects.toThrow(
        InternalServerErrorException,
      )
    })

    it('deve lançar InternalServerErrorException quando Meta não retorna ID', async () => {
      mockFetch(true, { messages: [] })

      await expect(service.sendTextMessage(TENANT_A, PHONE, 'Olá')).rejects.toThrow(
        InternalServerErrorException,
      )
    })

    it('deve salvar mensagem com waMessageId retornado pela Meta API', async () => {
      await service.sendTextMessage(TENANT_A, PHONE, 'Olá')

      expect(prismaMock.message.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            waMessageId: WA_MSG_ID,
            direction: 'outbound',
            status: 'sent',
          }),
        }),
      )
    })

    it('deve atualizar lastMessageAt da conversa em transaction', async () => {
      await service.sendTextMessage(TENANT_A, PHONE, 'Olá')

      expect(prismaMock.conversation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: CONV_ID },
          data: expect.objectContaining({ lastMessageAt: expect.any(Date) }),
        }),
      )
    })

    it('deve lançar NotFoundException quando conversa não encontrada', async () => {
      // contact found in assert24h, but conversation not found → findConversationId throws
      prismaMock.conversation.findFirst.mockResolvedValue(null)

      await expect(service.sendTextMessage(TENANT_A, PHONE, 'Olá')).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  // ── sendMediaMessage ───────────────────────────────────────────────────────

  describe('sendMediaMessage', () => {
    it('deve enviar imagem com mediaType=image no payload', async () => {
      await service.sendMediaMessage(TENANT_A, PHONE, 'image', 'https://s3.example.com/img.jpg', 'Legenda')

      const [, init] = (global.fetch as jest.Mock).mock.calls[0] as [string, RequestInit]
      const body = JSON.parse(init.body as string) as Record<string, unknown>

      expect(body.type).toBe('image')
      expect((body.image as Record<string, unknown>).link).toBe('https://s3.example.com/img.jpg')
      expect((body.image as Record<string, unknown>).caption).toBe('Legenda')
    })

    it('deve verificar janela de 24h antes de enviar mídia', async () => {
      prismaMock.message.findFirst.mockResolvedValue(null)

      await expect(
        service.sendMediaMessage(TENANT_A, PHONE, 'image', 'https://s3.example.com/img.jpg'),
      ).rejects.toThrow(BadRequestException)

      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('deve salvar mensagem com type=image e mediaUrl corretos', async () => {
      const url = 'https://s3.example.com/img.jpg'
      await service.sendMediaMessage(TENANT_A, PHONE, 'image', url, 'Legenda')

      expect(prismaMock.message.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'image',
            mediaUrl: url,
            mediaType: 'image',
            direction: 'outbound',
          }),
        }),
      )
    })

    it('deve salvar audio sem caption', async () => {
      await service.sendMediaMessage(TENANT_A, PHONE, 'audio', 'https://s3.example.com/audio.ogg')

      expect(prismaMock.message.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ type: 'audio', content: null }),
        }),
      )
    })

    it('deve mapear mediaType desconhecido para type=unsupported', async () => {
      await service.sendMediaMessage(TENANT_A, PHONE, 'unknown_type', 'https://s3.example.com/file')

      expect(prismaMock.message.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ type: 'unsupported' }),
        }),
      )
    })
  })

  // ── sendTemplate ────────────────────────────────────────────────────────────

  describe('sendTemplate', () => {
    it('deve enviar template sem verificar janela de 24h', async () => {
      prismaMock.message.findFirst.mockResolvedValue(null) // nenhum inbound recente

      await service.sendTemplate(TENANT_A, PHONE, 'boas_vindas', ['João'])

      expect(global.fetch).toHaveBeenCalled()
    })

    it('deve enviar variáveis como parâmetros indexados no payload', async () => {
      await service.sendTemplate(TENANT_A, PHONE, 'confirmacao', ['João', 'Plano Pro'])

      const [, init] = (global.fetch as jest.Mock).mock.calls[0] as [string, RequestInit]
      const body = JSON.parse(init.body as string) as Record<string, unknown>
      const template = body.template as Record<string, unknown>
      const components = template.components as Array<Record<string, unknown>>
      const params = components[0].parameters as Array<Record<string, unknown>>

      expect(params).toHaveLength(2)
      expect(params[0]).toEqual({ type: 'text', text: 'João' })
      expect(params[1]).toEqual({ type: 'text', text: 'Plano Pro' })
    })

    it('deve enviar template sem variáveis com components vazio', async () => {
      await service.sendTemplate(TENANT_A, PHONE, 'alerta_simples', [])

      const [, init] = (global.fetch as jest.Mock).mock.calls[0] as [string, RequestInit]
      const body = JSON.parse(init.body as string) as Record<string, unknown>
      const template = body.template as Record<string, unknown>

      expect(template.components).toHaveLength(0)
    })

    it('deve usar language pt_BR no template', async () => {
      await service.sendTemplate(TENANT_A, PHONE, 'boas_vindas', [])

      const [, init] = (global.fetch as jest.Mock).mock.calls[0] as [string, RequestInit]
      const body = JSON.parse(init.body as string) as Record<string, unknown>
      const template = body.template as Record<string, unknown>
      const language = template.language as Record<string, unknown>

      expect(language.code).toBe('pt_BR')
    })

    it('deve salvar mensagem com type=template e templateName', async () => {
      await service.sendTemplate(TENANT_A, PHONE, 'boas_vindas', ['João'])

      expect(prismaMock.message.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'template',
            templateName: 'boas_vindas',
            direction: 'outbound',
          }),
        }),
      )
    })
  })

  // ── sendReaction ─────────────────────────────────────────────────────────────

  describe('sendReaction', () => {
    it('deve enviar reação sem verificar janela de 24h', async () => {
      prismaMock.message.findFirst.mockResolvedValue(null)

      await service.sendReaction(TENANT_A, PHONE, WA_MSG_ID, '👍')

      expect(global.fetch).toHaveBeenCalled()
    })

    it('deve incluir message_id e emoji corretos no payload', async () => {
      await service.sendReaction(TENANT_A, PHONE, WA_MSG_ID, '❤️')

      const [, init] = (global.fetch as jest.Mock).mock.calls[0] as [string, RequestInit]
      const body = JSON.parse(init.body as string) as Record<string, unknown>
      const reaction = body.reaction as Record<string, unknown>

      expect(reaction.message_id).toBe(WA_MSG_ID)
      expect(reaction.emoji).toBe('❤️')
      expect(body.type).toBe('reaction')
    })

    it('deve salvar mensagem com type=reaction e reactionEmoji', async () => {
      await service.sendReaction(TENANT_A, PHONE, WA_MSG_ID, '🔥')

      expect(prismaMock.message.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'reaction',
            reactionEmoji: '🔥',
            direction: 'outbound',
          }),
        }),
      )
    })
  })

  // ── Isolamento de tenant ────────────────────────────────────────────────────

  describe('Isolamento de tenant', () => {
    it('não deve usar config de outro tenant ao enviar texto', async () => {
      await service.sendTextMessage(TENANT_B, PHONE, 'teste')

      expect(prismaMock.whatsAppConfig.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: TENANT_B }),
        }),
      )
      expect(prismaMock.whatsAppConfig.findFirst).not.toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: TENANT_A }),
        }),
      )
    })

    it('deve filtrar contato por tenantId em todas as queries de contact', async () => {
      await service.sendTextMessage(TENANT_B, PHONE, 'teste')

      const contactCalls = prismaMock.contact.findFirst.mock.calls as Array<[{ where: { tenantId: string } }]>
      contactCalls.forEach((call) => {
        expect(call[0].where.tenantId).toBe(TENANT_B)
      })
    })

    it('deve filtrar conversa por tenantId correto', async () => {
      await service.sendTemplate(TENANT_A, PHONE, 'tmpl', [])

      expect(prismaMock.conversation.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: TENANT_A }),
        }),
      )
    })

    it('deve salvar mensagem com tenantId do tenant correto', async () => {
      await service.sendTemplate(TENANT_A, PHONE, 'tmpl', [])

      expect(prismaMock.message.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ tenantId: TENANT_A }),
        }),
      )
    })
  })

  // ── Verificação da janela 24h ───────────────────────────────────────────────

  describe('Janela de 24h', () => {
    it('deve usar cutoff de exatamente 24 horas atrás na query', async () => {
      const before = Date.now()
      await service.sendTextMessage(TENANT_A, PHONE, 'Olá')
      const after = Date.now()

      const msgCall = prismaMock.message.findFirst.mock.calls[0] as [{ where: { createdAt: { gte: Date } } }]
      const cutoff = msgCall[0].where.createdAt.gte.getTime()

      const expected24hMs = 24 * 60 * 60 * 1000
      expect(cutoff).toBeGreaterThanOrEqual(before - expected24hMs - 50)
      expect(cutoff).toBeLessThanOrEqual(after - expected24hMs + 50)
    })

    it('deve filtrar mensagem inbound por tenantId e direction', async () => {
      await service.sendTextMessage(TENANT_A, PHONE, 'Olá')

      expect(prismaMock.message.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: TENANT_A,
            direction: 'inbound',
          }),
        }),
      )
    })

    it('deve permitir envio para mídia dentro da janela 24h', async () => {
      prismaMock.message.findFirst.mockResolvedValue({ id: 'recent-inbound' })

      await expect(
        service.sendMediaMessage(TENANT_A, PHONE, 'image', 'https://example.com/img.jpg'),
      ).resolves.not.toThrow()
    })

    it('deve bloquear mídia fora da janela 24h', async () => {
      prismaMock.message.findFirst.mockResolvedValue(null)

      await expect(
        service.sendMediaMessage(TENANT_A, PHONE, 'video', 'https://example.com/video.mp4'),
      ).rejects.toThrow(BadRequestException)
    })
  })
})
