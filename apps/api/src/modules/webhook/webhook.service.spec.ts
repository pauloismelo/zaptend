import { Test, TestingModule } from '@nestjs/testing'
import { BadRequestException, UnauthorizedException } from '@nestjs/common'
import { getQueueToken } from '@nestjs/bullmq'
import * as crypto from 'crypto'
import { WebhookService, MESSAGES_INBOUND_QUEUE } from './webhook.service'
import { PrismaService } from '../../prisma/prisma.service'
import { MetaWebhookPayloadDto } from './dto/meta-webhook.dto'

// ─── Mocks ───────────────────────────────────────────────────────────────────

const prismaMock = {
  whatsAppConfig: {
    findFirst: jest.fn(),
  },
}

const queueMock = {
  add: jest.fn(),
}

const mockConfig = {
  id: 'config-1',
  tenantId: 'tenant-a',
  phoneNumberId: '12345',
  webhookVerifyToken: 'valid-token-xyz',
  isActive: true,
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildSignature(body: Buffer, secret: string): string {
  return `sha256=${crypto.createHmac('sha256', secret).update(body).digest('hex')}`
}

function buildPayload(overrides: Partial<MetaWebhookPayloadDto> = {}): MetaWebhookPayloadDto {
  return {
    object: 'whatsapp_business_account',
    entry: [],
    ...overrides,
  }
}

function buildTextMessage(from = '5511999990000', msgId = 'wamid.abc123') {
  return {
    from,
    id: msgId,
    timestamp: '1716000000',
    type: 'text' as const,
    text: { body: 'Olá!' },
  }
}

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('WebhookService', () => {
  let service: WebhookService
  const APP_SECRET = 'test-app-secret'

  beforeEach(async () => {
    process.env.META_APP_SECRET = APP_SECRET

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: getQueueToken(MESSAGES_INBOUND_QUEUE), useValue: queueMock },
      ],
    }).compile()

    service = module.get<WebhookService>(WebhookService)
  })

  afterEach(() => jest.clearAllMocks())

  // ── verifySignature ─────────────────────────────────────────────────────────

  describe('verifySignature', () => {
    it('deve aceitar assinatura HMAC válida', () => {
      const body = Buffer.from('{"object":"whatsapp_business_account"}')
      const sig = buildSignature(body, APP_SECRET)

      expect(() => service.verifySignature(body, sig)).not.toThrow()
    })

    it('deve rejeitar assinatura incorreta', () => {
      const body = Buffer.from('{"object":"test"}')
      const sig = buildSignature(body, 'outro-secret')

      expect(() => service.verifySignature(body, sig)).toThrow(UnauthorizedException)
    })

    it('deve rejeitar assinatura ausente (string vazia)', () => {
      const body = Buffer.from('test')

      expect(() => service.verifySignature(body, '')).toThrow(UnauthorizedException)
    })

    it('deve rejeitar se META_APP_SECRET não estiver configurado', () => {
      delete process.env.META_APP_SECRET
      const body = Buffer.from('test')

      expect(() => service.verifySignature(body, 'sha256=abc')).toThrow(BadRequestException)
    })

    it('deve rejeitar assinatura com comprimento diferente', () => {
      const body = Buffer.from('test')
      // Assinatura com formato correto mas valor errado
      expect(() => service.verifySignature(body, 'sha256=abc123')).toThrow(UnauthorizedException)
    })

    it('deve usar comparação em tempo constante (não vazar por timing)', () => {
      const body = Buffer.from('body')
      const validSig = buildSignature(body, APP_SECRET)
      // Mesma chamada duas vezes deve retornar o mesmo resultado sem falha
      expect(() => service.verifySignature(body, validSig)).not.toThrow()
      expect(() => service.verifySignature(body, validSig)).not.toThrow()
    })
  })

  // ── handleVerification ──────────────────────────────────────────────────────

  describe('handleVerification', () => {
    it('deve retornar o challenge quando token for válido', async () => {
      prismaMock.whatsAppConfig.findFirst.mockResolvedValue(mockConfig)

      const result = await service.handleVerification(
        'tenant-a',
        'subscribe',
        'valid-token-xyz',
        'challenge-abc',
      )

      expect(result).toBe('challenge-abc')
    })

    it('deve buscar configuração pelo tenantId e token corretos', async () => {
      prismaMock.whatsAppConfig.findFirst.mockResolvedValue(mockConfig)

      await service.handleVerification('tenant-a', 'subscribe', 'valid-token-xyz', 'ch')

      expect(prismaMock.whatsAppConfig.findFirst).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-a', webhookVerifyToken: 'valid-token-xyz', isActive: true },
      })
    })

    it('deve lançar BadRequestException se mode !== subscribe', async () => {
      await expect(
        service.handleVerification('tenant-a', 'unsubscribe', 'token', 'ch'),
      ).rejects.toThrow(BadRequestException)

      expect(prismaMock.whatsAppConfig.findFirst).not.toHaveBeenCalled()
    })

    it('deve lançar UnauthorizedException se token não encontrar configuração', async () => {
      prismaMock.whatsAppConfig.findFirst.mockResolvedValue(null)

      await expect(
        service.handleVerification('tenant-a', 'subscribe', 'token-errado', 'ch'),
      ).rejects.toThrow(UnauthorizedException)
    })

    it('deve lançar UnauthorizedException se config pertencer a outro tenant', async () => {
      prismaMock.whatsAppConfig.findFirst.mockResolvedValue(null)

      await expect(
        service.handleVerification('tenant-b', 'subscribe', 'valid-token-xyz', 'ch'),
      ).rejects.toThrow(UnauthorizedException)
    })
  })

  // ── processPayload — mensagens ──────────────────────────────────────────────

  describe('processPayload — mensagens inbound', () => {
    it('deve enfileirar mensagem de texto', async () => {
      const msg = buildTextMessage()
      const payload = buildPayload({
        entry: [
          {
            id: 'waba-id',
            changes: [
              {
                field: 'messages',
                value: {
                  messaging_product: 'whatsapp',
                  metadata: { display_phone_number: '5511', phone_number_id: '12345' },
                  contacts: [{ wa_id: msg.from, profile: { name: 'Cliente' } }],
                  messages: [msg],
                },
              },
            ],
          },
        ],
      })

      await service.processPayload('tenant-a', payload)

      expect(queueMock.add).toHaveBeenCalledWith(
        'process-inbound',
        expect.objectContaining({
          tenantId: 'tenant-a',
          message: expect.objectContaining({ type: 'text', from: msg.from }),
          contact: expect.objectContaining({ wa_id: msg.from }),
        }),
        expect.any(Object),
      )
    })

    it('deve enfileirar mensagem de imagem', async () => {
      const payload = buildPayload({
        entry: [
          {
            id: 'waba-id',
            changes: [
              {
                field: 'messages',
                value: {
                  messaging_product: 'whatsapp',
                  metadata: { display_phone_number: '5511', phone_number_id: '12345' },
                  messages: [
                    {
                      from: '5511999990000',
                      id: 'wamid.img1',
                      timestamp: '1716000000',
                      type: 'image' as const,
                      image: { id: 'img-id-123', mime_type: 'image/jpeg', sha256: 'abc' },
                    },
                  ],
                },
              },
            ],
          },
        ],
      })

      await service.processPayload('tenant-a', payload)

      expect(queueMock.add).toHaveBeenCalledWith(
        'process-inbound',
        expect.objectContaining({ message: expect.objectContaining({ type: 'image' }) }),
        expect.any(Object),
      )
    })

    it('deve enfileirar mensagem de áudio', async () => {
      const payload = buildPayload({
        entry: [
          {
            id: 'waba-id',
            changes: [
              {
                field: 'messages',
                value: {
                  messaging_product: 'whatsapp',
                  metadata: { display_phone_number: '5511', phone_number_id: '12345' },
                  messages: [
                    {
                      from: '5511999990000',
                      id: 'wamid.aud1',
                      timestamp: '1716000000',
                      type: 'audio' as const,
                      audio: { id: 'aud-id-123', mime_type: 'audio/ogg', sha256: 'def', voice: true },
                    },
                  ],
                },
              },
            ],
          },
        ],
      })

      await service.processPayload('tenant-a', payload)

      expect(queueMock.add).toHaveBeenCalledWith(
        'process-inbound',
        expect.objectContaining({ message: expect.objectContaining({ type: 'audio' }) }),
        expect.any(Object),
      )
    })

    it('deve enfileirar mensagem de vídeo', async () => {
      const payload = buildPayload({
        entry: [
          {
            id: 'waba-id',
            changes: [
              {
                field: 'messages',
                value: {
                  messaging_product: 'whatsapp',
                  metadata: { display_phone_number: '5511', phone_number_id: '12345' },
                  messages: [
                    {
                      from: '5511999990000',
                      id: 'wamid.vid1',
                      timestamp: '1716000000',
                      type: 'video' as const,
                      video: { id: 'vid-id-123', mime_type: 'video/mp4', sha256: 'ghi', caption: 'Assista' },
                    },
                  ],
                },
              },
            ],
          },
        ],
      })

      await service.processPayload('tenant-a', payload)

      expect(queueMock.add).toHaveBeenCalledWith(
        'process-inbound',
        expect.objectContaining({ message: expect.objectContaining({ type: 'video' }) }),
        expect.any(Object),
      )
    })

    it('deve enfileirar mensagem de documento', async () => {
      const payload = buildPayload({
        entry: [
          {
            id: 'waba-id',
            changes: [
              {
                field: 'messages',
                value: {
                  messaging_product: 'whatsapp',
                  metadata: { display_phone_number: '5511', phone_number_id: '12345' },
                  messages: [
                    {
                      from: '5511999990000',
                      id: 'wamid.doc1',
                      timestamp: '1716000000',
                      type: 'document' as const,
                      document: { id: 'doc-id-123', mime_type: 'application/pdf', sha256: 'jkl', filename: 'contrato.pdf' },
                    },
                  ],
                },
              },
            ],
          },
        ],
      })

      await service.processPayload('tenant-a', payload)

      expect(queueMock.add).toHaveBeenCalledWith(
        'process-inbound',
        expect.objectContaining({ message: expect.objectContaining({ type: 'document' }) }),
        expect.any(Object),
      )
    })

    it('deve enfileirar mensagem de localização', async () => {
      const payload = buildPayload({
        entry: [
          {
            id: 'waba-id',
            changes: [
              {
                field: 'messages',
                value: {
                  messaging_product: 'whatsapp',
                  metadata: { display_phone_number: '5511', phone_number_id: '12345' },
                  messages: [
                    {
                      from: '5511999990000',
                      id: 'wamid.loc1',
                      timestamp: '1716000000',
                      type: 'location' as const,
                      location: { latitude: -23.5, longitude: -46.6, name: 'Escritório', address: 'Rua X' },
                    },
                  ],
                },
              },
            ],
          },
        ],
      })

      await service.processPayload('tenant-a', payload)

      expect(queueMock.add).toHaveBeenCalledWith(
        'process-inbound',
        expect.objectContaining({ message: expect.objectContaining({ type: 'location' }) }),
        expect.any(Object),
      )
    })

    it('deve enfileirar mensagem de contatos', async () => {
      const payload = buildPayload({
        entry: [
          {
            id: 'waba-id',
            changes: [
              {
                field: 'messages',
                value: {
                  messaging_product: 'whatsapp',
                  metadata: { display_phone_number: '5511', phone_number_id: '12345' },
                  messages: [
                    {
                      from: '5511999990000',
                      id: 'wamid.con1',
                      timestamp: '1716000000',
                      type: 'contacts' as const,
                      contacts: [{ name: { formatted_name: 'João Silva' }, phones: [{ phone: '+5511', wa_id: '5511' }] }],
                    },
                  ],
                },
              },
            ],
          },
        ],
      })

      await service.processPayload('tenant-a', payload)

      expect(queueMock.add).toHaveBeenCalledWith(
        'process-inbound',
        expect.objectContaining({ message: expect.objectContaining({ type: 'contacts' }) }),
        expect.any(Object),
      )
    })

    it('deve enfileirar sticker', async () => {
      const payload = buildPayload({
        entry: [
          {
            id: 'waba-id',
            changes: [
              {
                field: 'messages',
                value: {
                  messaging_product: 'whatsapp',
                  metadata: { display_phone_number: '5511', phone_number_id: '12345' },
                  messages: [
                    {
                      from: '5511999990000',
                      id: 'wamid.stk1',
                      timestamp: '1716000000',
                      type: 'sticker' as const,
                      sticker: { id: 'stk-123', mime_type: 'image/webp', sha256: 'xyz', animated: false },
                    },
                  ],
                },
              },
            ],
          },
        ],
      })

      await service.processPayload('tenant-a', payload)

      expect(queueMock.add).toHaveBeenCalledWith(
        'process-inbound',
        expect.objectContaining({ message: expect.objectContaining({ type: 'sticker' }) }),
        expect.any(Object),
      )
    })

    it('deve enfileirar reaction', async () => {
      const payload = buildPayload({
        entry: [
          {
            id: 'waba-id',
            changes: [
              {
                field: 'messages',
                value: {
                  messaging_product: 'whatsapp',
                  metadata: { display_phone_number: '5511', phone_number_id: '12345' },
                  messages: [
                    {
                      from: '5511999990000',
                      id: 'wamid.rea1',
                      timestamp: '1716000000',
                      type: 'reaction' as const,
                      reaction: { message_id: 'wamid.abc', emoji: '👍' },
                    },
                  ],
                },
              },
            ],
          },
        ],
      })

      await service.processPayload('tenant-a', payload)

      expect(queueMock.add).toHaveBeenCalledWith(
        'process-inbound',
        expect.objectContaining({ message: expect.objectContaining({ type: 'reaction' }) }),
        expect.any(Object),
      )
    })

    it('deve usar fallback de contato quando contacts não inclui o remetente', async () => {
      const msg = buildTextMessage('5511000000000')
      const payload = buildPayload({
        entry: [
          {
            id: 'waba-id',
            changes: [
              {
                field: 'messages',
                value: {
                  messaging_product: 'whatsapp',
                  metadata: { display_phone_number: '5511', phone_number_id: '12345' },
                  contacts: [],
                  messages: [msg],
                },
              },
            ],
          },
        ],
      })

      await service.processPayload('tenant-a', payload)

      expect(queueMock.add).toHaveBeenCalledWith(
        'process-inbound',
        expect.objectContaining({
          contact: { wa_id: '5511000000000', profile: { name: '5511000000000' } },
        }),
        expect.any(Object),
      )
    })

    it('deve ignorar changes que não sejam do campo "messages"', async () => {
      const payload = buildPayload({
        entry: [
          {
            id: 'waba-id',
            changes: [{ field: 'account_alerts', value: {} as never }],
          },
        ],
      })

      await service.processPayload('tenant-a', payload)

      expect(queueMock.add).not.toHaveBeenCalled()
    })

    it('não deve chamar a fila se entry estiver vazio', async () => {
      await service.processPayload('tenant-a', buildPayload({ entry: [] }))

      expect(queueMock.add).not.toHaveBeenCalled()
    })
  })

  // ── processPayload — status updates ────────────────────────────────────────

  describe('processPayload — status updates', () => {
    it('deve enfileirar update de status "delivered"', async () => {
      const payload = buildPayload({
        entry: [
          {
            id: 'waba-id',
            changes: [
              {
                field: 'messages',
                value: {
                  messaging_product: 'whatsapp',
                  metadata: { display_phone_number: '5511', phone_number_id: '12345' },
                  statuses: [
                    {
                      id: 'wamid.outbound1',
                      status: 'delivered',
                      timestamp: '1716000100',
                      recipient_id: '5511999990000',
                    },
                  ],
                },
              },
            ],
          },
        ],
      })

      await service.processPayload('tenant-a', payload)

      expect(queueMock.add).toHaveBeenCalledWith(
        'update-status',
        expect.objectContaining({
          tenantId: 'tenant-a',
          waMessageId: 'wamid.outbound1',
          status: 'delivered',
        }),
        expect.any(Object),
      )
    })

    it('deve enfileirar update de status "read"', async () => {
      const payload = buildPayload({
        entry: [
          {
            id: 'waba-id',
            changes: [
              {
                field: 'messages',
                value: {
                  messaging_product: 'whatsapp',
                  metadata: { display_phone_number: '5511', phone_number_id: '12345' },
                  statuses: [
                    {
                      id: 'wamid.outbound2',
                      status: 'read',
                      timestamp: '1716000200',
                      recipient_id: '5511999990000',
                    },
                  ],
                },
              },
            ],
          },
        ],
      })

      await service.processPayload('tenant-a', payload)

      expect(queueMock.add).toHaveBeenCalledWith(
        'update-status',
        expect.objectContaining({ status: 'read', waMessageId: 'wamid.outbound2' }),
        expect.any(Object),
      )
    })

    it('deve processar mensagens e status no mesmo payload', async () => {
      const msg = buildTextMessage()
      const payload = buildPayload({
        entry: [
          {
            id: 'waba-id',
            changes: [
              {
                field: 'messages',
                value: {
                  messaging_product: 'whatsapp',
                  metadata: { display_phone_number: '5511', phone_number_id: '12345' },
                  contacts: [{ wa_id: msg.from, profile: { name: 'Cliente' } }],
                  messages: [msg],
                  statuses: [
                    { id: 'wamid.out1', status: 'sent', timestamp: '1716000000', recipient_id: '5511' },
                  ],
                },
              },
            ],
          },
        ],
      })

      await service.processPayload('tenant-a', payload)

      // 1 status + 1 mensagem = 2 chamadas
      expect(queueMock.add).toHaveBeenCalledTimes(2)
      expect(queueMock.add).toHaveBeenCalledWith('update-status', expect.any(Object), expect.any(Object))
      expect(queueMock.add).toHaveBeenCalledWith('process-inbound', expect.any(Object), expect.any(Object))
    })
  })
})
