import { Test, TestingModule } from '@nestjs/testing'
import { getQueueToken } from '@nestjs/bullmq'
import { Job } from 'bullmq'
import { MessagesInboundProcessor } from './messages-inbound.processor'
import { PrismaService } from '../prisma/prisma.service'
import { MetaApiService } from '../services/meta-api.service'
import { S3Service } from '../services/s3.service'
import { SocketEmitterService } from '../services/socket-emitter.service'
import { RoutingService } from '../services/routing.service'
import { QUEUE_MESSAGES_INBOUND } from '../app.module'
import type { InboundMessageJobPayload } from '@zaptend/types'

// ── Mocks ─────────────────────────────────────────────────────────────────────

const prismaMock = {
  contact: {
    upsert: jest.fn(),
  },
  conversation: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  message: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  whatsAppConfig: {
    findFirst: jest.fn(),
  },
}

const metaApiMock = {
  downloadMedia: jest.fn(),
}

const s3Mock = {
  upload: jest.fn(),
}

const socketEmitterMock = {
  emitToTenant: jest.fn(),
}

const routingMock = {
  assignConversation: jest.fn(),
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const TENANT_ID = 'tenant-abc'
const CONTACT_ID = 'contact-001'
const CONVERSATION_ID = 'conv-001'
const MESSAGE_ID = 'msg-001'
const WA_MESSAGE_ID = 'wamid.abc123'

const makeTextMessage = (overrides = {}) => ({
  from: '5511999999999',
  id: WA_MESSAGE_ID,
  timestamp: '1700000000',
  type: 'text' as const,
  text: { body: 'Olá, tudo bem?' },
  ...overrides,
})

const makeImageMessage = () => ({
  from: '5511999999999',
  id: 'wamid.img001',
  timestamp: '1700000001',
  type: 'image' as const,
  image: { id: 'media-id-001', mime_type: 'image/jpeg', sha256: 'abc', caption: 'foto' },
})

const makePayload = (
  messages: ReturnType<typeof makeTextMessage>[],
  statuses: { id: string; status: string; timestamp: string; recipient_id: string }[] = [],
): Job<InboundMessageJobPayload> =>
  ({
    id: 'job-001',
    data: {
      tenantId: TENANT_ID,
      rawPayload: {
        id: 'entry-1',
        changes: [
          {
            field: 'messages',
            value: {
              messaging_product: 'whatsapp',
              metadata: { display_phone_number: '5511000000000', phone_number_id: 'phone-001' },
              contacts: [{ profile: { name: 'João Silva' }, wa_id: '5511999999999' }],
              messages,
              statuses,
            },
          },
        ],
      },
    },
  }) as unknown as Job<InboundMessageJobPayload>

const mockContact = { id: CONTACT_ID, tenantId: TENANT_ID, phone: '5511999999999', name: 'João Silva' }
const mockConversation = { id: CONVERSATION_ID, tenantId: TENANT_ID, contactId: CONTACT_ID, assignedUserId: null, status: 'open', lastMessageAt: null }
const mockMessage = { id: MESSAGE_ID, tenantId: TENANT_ID, conversationId: CONVERSATION_ID, waMessageId: WA_MESSAGE_ID }

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('MessagesInboundProcessor', () => {
  let processor: MessagesInboundProcessor

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesInboundProcessor,
        { provide: PrismaService, useValue: prismaMock },
        { provide: MetaApiService, useValue: metaApiMock },
        { provide: S3Service, useValue: s3Mock },
        { provide: SocketEmitterService, useValue: socketEmitterMock },
        { provide: RoutingService, useValue: routingMock },
        { provide: getQueueToken(QUEUE_MESSAGES_INBOUND), useValue: {} },
      ],
    }).compile()

    processor = module.get<MessagesInboundProcessor>(MessagesInboundProcessor)
  })

  afterEach(() => jest.clearAllMocks())

  // ── process() ───────────────────────────────────────────────────────────────

  describe('process()', () => {
    it('deve processar mensagem de texto e emitir eventos', async () => {
      prismaMock.contact.upsert.mockResolvedValue(mockContact)
      prismaMock.conversation.findFirst.mockResolvedValue(null)
      prismaMock.conversation.create.mockResolvedValue(mockConversation)
      prismaMock.message.create.mockResolvedValue(mockMessage)
      prismaMock.message.findUnique.mockResolvedValue(null) // context lookup
      prismaMock.conversation.update.mockResolvedValue(mockConversation)
      prismaMock.whatsAppConfig.findFirst.mockResolvedValue(null)
      routingMock.assignConversation.mockResolvedValue(undefined)

      await processor.process(makePayload([makeTextMessage()]))

      expect(prismaMock.contact.upsert).toHaveBeenCalledTimes(1)
      expect(prismaMock.message.create).toHaveBeenCalledTimes(1)
      expect(socketEmitterMock.emitToTenant).toHaveBeenCalledWith(
        TENANT_ID,
        'conversation:new',
        expect.objectContaining({ conversation: mockConversation }),
      )
      expect(socketEmitterMock.emitToTenant).toHaveBeenCalledWith(
        TENANT_ID,
        'message:new',
        expect.objectContaining({ conversationId: CONVERSATION_ID }),
      )
    })

    it('deve processar múltiplas mensagens no mesmo job', async () => {
      prismaMock.contact.upsert.mockResolvedValue(mockContact)
      prismaMock.conversation.findFirst.mockResolvedValue(mockConversation)
      prismaMock.message.create.mockResolvedValue(mockMessage)
      prismaMock.message.findUnique.mockResolvedValue(null)
      prismaMock.conversation.update.mockResolvedValue(mockConversation)
      prismaMock.whatsAppConfig.findFirst.mockResolvedValue(null)
      routingMock.assignConversation.mockResolvedValue(undefined)

      const msg1 = makeTextMessage({ id: 'wamid.1' })
      const msg2 = makeTextMessage({ id: 'wamid.2', text: { body: 'Segunda mensagem' } })

      await processor.process(makePayload([msg1, msg2]))

      expect(prismaMock.message.create).toHaveBeenCalledTimes(2)
    })

    it('não deve lançar exceção quando uma mensagem falha — processa as demais', async () => {
      prismaMock.contact.upsert.mockRejectedValueOnce(new Error('DB connection failed'))
      prismaMock.contact.upsert.mockResolvedValueOnce(mockContact)
      prismaMock.conversation.findFirst.mockResolvedValue(mockConversation)
      prismaMock.message.create.mockResolvedValue(mockMessage)
      prismaMock.message.findUnique.mockResolvedValue(null)
      prismaMock.conversation.update.mockResolvedValue(mockConversation)
      prismaMock.whatsAppConfig.findFirst.mockResolvedValue(null)
      routingMock.assignConversation.mockResolvedValue(undefined)

      const msg1 = makeTextMessage({ id: 'wamid.fail' })
      const msg2 = makeTextMessage({ id: 'wamid.ok' })

      await expect(processor.process(makePayload([msg1, msg2]))).resolves.not.toThrow()
      expect(prismaMock.message.create).toHaveBeenCalledTimes(1)
    })
  })

  // ── Contact upsert ───────────────────────────────────────────────────────────

  describe('upsert de contato', () => {
    beforeEach(() => {
      prismaMock.conversation.findFirst.mockResolvedValue(mockConversation)
      prismaMock.message.create.mockResolvedValue(mockMessage)
      prismaMock.message.findUnique.mockResolvedValue(null)
      prismaMock.conversation.update.mockResolvedValue(mockConversation)
      prismaMock.whatsAppConfig.findFirst.mockResolvedValue(null)
      routingMock.assignConversation.mockResolvedValue(undefined)
    })

    it('deve criar contato com tenantId e telefone corretos', async () => {
      prismaMock.contact.upsert.mockResolvedValue(mockContact)

      await processor.process(makePayload([makeTextMessage()]))

      expect(prismaMock.contact.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId_phone: { tenantId: TENANT_ID, phone: '5511999999999' } },
          create: expect.objectContaining({ tenantId: TENANT_ID, phone: '5511999999999', name: 'João Silva' }),
        }),
      )
    })

    it('deve atualizar nome do contato quando já existir', async () => {
      prismaMock.contact.upsert.mockResolvedValue({ ...mockContact, name: 'João Atualizado' })

      await processor.process(makePayload([makeTextMessage()]))

      expect(prismaMock.contact.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: { name: 'João Silva' },
        }),
      )
    })

    it('deve garantir isolamento de tenant — nunca vazar dados entre tenants', async () => {
      prismaMock.contact.upsert.mockResolvedValue(mockContact)

      await processor.process(makePayload([makeTextMessage()]))

      const call = prismaMock.contact.upsert.mock.calls[0][0]
      expect(call.where.tenantId_phone.tenantId).toBe(TENANT_ID)
      expect(call.create.tenantId).toBe(TENANT_ID)
    })
  })

  // ── Conversation ─────────────────────────────────────────────────────────────

  describe('busca/criação de conversa', () => {
    beforeEach(() => {
      prismaMock.contact.upsert.mockResolvedValue(mockContact)
      prismaMock.message.create.mockResolvedValue(mockMessage)
      prismaMock.message.findUnique.mockResolvedValue(null)
      prismaMock.conversation.update.mockResolvedValue(mockConversation)
      prismaMock.whatsAppConfig.findFirst.mockResolvedValue(null)
      routingMock.assignConversation.mockResolvedValue(undefined)
    })

    it('deve criar nova conversa quando não há conversa aberta', async () => {
      prismaMock.conversation.findFirst.mockResolvedValue(null)
      prismaMock.conversation.create.mockResolvedValue(mockConversation)

      await processor.process(makePayload([makeTextMessage()]))

      expect(prismaMock.conversation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId: TENANT_ID,
            contactId: CONTACT_ID,
            channel: 'whatsapp',
            status: 'open',
          }),
        }),
      )
    })

    it('deve reutilizar conversa aberta existente', async () => {
      prismaMock.conversation.findFirst.mockResolvedValue(mockConversation)

      await processor.process(makePayload([makeTextMessage()]))

      expect(prismaMock.conversation.create).not.toHaveBeenCalled()
    })

    it('deve emitir conversation:new somente para novas conversas', async () => {
      prismaMock.conversation.findFirst.mockResolvedValue(null)
      prismaMock.conversation.create.mockResolvedValue(mockConversation)

      await processor.process(makePayload([makeTextMessage()]))

      expect(socketEmitterMock.emitToTenant).toHaveBeenCalledWith(
        TENANT_ID,
        'conversation:new',
        expect.anything(),
      )
      expect(socketEmitterMock.emitToTenant).not.toHaveBeenCalledWith(
        TENANT_ID,
        'conversation:updated',
        expect.anything(),
      )
    })

    it('deve emitir conversation:updated para conversas existentes', async () => {
      prismaMock.conversation.findFirst.mockResolvedValue(mockConversation)

      await processor.process(makePayload([makeTextMessage()]))

      expect(socketEmitterMock.emitToTenant).toHaveBeenCalledWith(
        TENANT_ID,
        'conversation:updated',
        expect.objectContaining({ conversationId: CONVERSATION_ID }),
      )
      expect(socketEmitterMock.emitToTenant).not.toHaveBeenCalledWith(
        TENANT_ID,
        'conversation:new',
        expect.anything(),
      )
    })

    it('deve buscar conversa filtrando por tenantId', async () => {
      prismaMock.conversation.findFirst.mockResolvedValue(mockConversation)

      await processor.process(makePayload([makeTextMessage()]))

      expect(prismaMock.conversation.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: TENANT_ID }),
        }),
      )
    })
  })

  // ── Message creation ─────────────────────────────────────────────────────────

  describe('criação de mensagem', () => {
    beforeEach(() => {
      prismaMock.contact.upsert.mockResolvedValue(mockContact)
      prismaMock.conversation.findFirst.mockResolvedValue(mockConversation)
      prismaMock.message.findUnique.mockResolvedValue(null)
      prismaMock.conversation.update.mockResolvedValue(mockConversation)
      prismaMock.whatsAppConfig.findFirst.mockResolvedValue(null)
      routingMock.assignConversation.mockResolvedValue(undefined)
    })

    it('deve criar mensagem de texto com campos corretos', async () => {
      prismaMock.message.create.mockResolvedValue(mockMessage)

      await processor.process(makePayload([makeTextMessage()]))

      expect(prismaMock.message.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId: TENANT_ID,
            conversationId: CONVERSATION_ID,
            waMessageId: WA_MESSAGE_ID,
            direction: 'inbound',
            type: 'text',
            content: 'Olá, tudo bem?',
            status: 'delivered',
          }),
        }),
      )
    })

    it('deve extrair conteúdo de caption para mensagem de imagem', async () => {
      prismaMock.message.create.mockResolvedValue(mockMessage)

      await processor.process(makePayload([makeImageMessage()]))

      expect(prismaMock.message.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'image',
            content: 'foto',
          }),
        }),
      )
    })

    it('deve salvar coordenadas para mensagem de localização', async () => {
      prismaMock.message.create.mockResolvedValue(mockMessage)

      const locationMsg = {
        from: '5511999999999',
        id: 'wamid.loc001',
        timestamp: '1700000002',
        type: 'location' as const,
        location: { latitude: -23.5505, longitude: -46.6333, name: 'São Paulo', address: 'SP, Brasil' },
      }

      await processor.process(makePayload([locationMsg]))

      expect(prismaMock.message.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            latitude: -23.5505,
            longitude: -46.6333,
            content: 'São Paulo, SP, Brasil',
          }),
        }),
      )
    })

    it('deve salvar emoji para mensagem de reação', async () => {
      prismaMock.message.create.mockResolvedValue(mockMessage)

      const reactionMsg = {
        from: '5511999999999',
        id: 'wamid.react001',
        timestamp: '1700000003',
        type: 'reaction' as const,
        reaction: { message_id: 'wamid.original', emoji: '👍' },
      }

      await processor.process(makePayload([reactionMsg]))

      expect(prismaMock.message.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            reactionEmoji: '👍',
          }),
        }),
      )
    })

    it('deve buscar replyToId quando mensagem tem context', async () => {
      const originalMsg = { id: 'original-db-id', tenantId: TENANT_ID }
      prismaMock.message.findUnique.mockResolvedValue(originalMsg)
      prismaMock.message.create.mockResolvedValue(mockMessage)

      const replyMsg = makeTextMessage({
        id: 'wamid.reply',
        context: { from: '5511888888888', id: 'wamid.original' },
      })

      await processor.process(makePayload([replyMsg]))

      expect(prismaMock.message.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { waMessageId: 'wamid.original' } }),
      )
      expect(prismaMock.message.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ replyToId: 'original-db-id' }),
        }),
      )
    })
  })

  // ── Media ─────────────────────────────────────────────────────────────────────

  describe('processamento de mídia', () => {
    beforeEach(() => {
      prismaMock.contact.upsert.mockResolvedValue(mockContact)
      prismaMock.conversation.findFirst.mockResolvedValue(mockConversation)
      prismaMock.message.findUnique.mockResolvedValue(null)
      prismaMock.conversation.update.mockResolvedValue(mockConversation)
      routingMock.assignConversation.mockResolvedValue(undefined)
    })

    it('deve baixar mídia da Meta API e salvar URL do S3', async () => {
      prismaMock.whatsAppConfig.findFirst.mockResolvedValue({
        accessTokenEncrypted: 'token-abc',
      })
      metaApiMock.downloadMedia.mockResolvedValue({
        buffer: Buffer.from('fake-image-data'),
        mimeType: 'image/jpeg',
      })
      s3Mock.upload.mockResolvedValue('https://bucket.s3.sa-east-1.amazonaws.com/tenants/tenant-abc/media/uuid.jpeg')
      prismaMock.message.create.mockResolvedValue(mockMessage)

      await processor.process(makePayload([makeImageMessage()]))

      expect(metaApiMock.downloadMedia).toHaveBeenCalledWith('media-id-001', 'token-abc')
      expect(s3Mock.upload).toHaveBeenCalledWith(
        TENANT_ID,
        expect.any(Buffer),
        'image/jpeg',
        undefined,
      )
      expect(prismaMock.message.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            mediaUrl: expect.stringContaining('s3'),
            mediaType: 'image/jpeg',
          }),
        }),
      )
    })

    it('deve salvar mediaUrl como null quando config WhatsApp não encontrada', async () => {
      prismaMock.whatsAppConfig.findFirst.mockResolvedValue(null)
      prismaMock.message.create.mockResolvedValue(mockMessage)

      await processor.process(makePayload([makeImageMessage()]))

      expect(metaApiMock.downloadMedia).not.toHaveBeenCalled()
      expect(prismaMock.message.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ mediaUrl: undefined }),
        }),
      )
    })

    it('deve continuar sem mediaUrl quando download da Meta falha', async () => {
      prismaMock.whatsAppConfig.findFirst.mockResolvedValue({
        accessTokenEncrypted: 'token-abc',
      })
      metaApiMock.downloadMedia.mockRejectedValue(new Error('Meta API indisponível'))
      prismaMock.message.create.mockResolvedValue(mockMessage)

      await processor.process(makePayload([makeImageMessage()]))

      expect(prismaMock.message.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ mediaUrl: undefined }),
        }),
      )
    })

    it('não deve chamar Meta API para mensagens de texto', async () => {
      prismaMock.whatsAppConfig.findFirst.mockResolvedValue({ accessTokenEncrypted: 'token' })
      prismaMock.message.create.mockResolvedValue(mockMessage)

      await processor.process(makePayload([makeTextMessage()]))

      expect(metaApiMock.downloadMedia).not.toHaveBeenCalled()
    })
  })

  // ── Routing ───────────────────────────────────────────────────────────────────

  describe('roteamento automático', () => {
    beforeEach(() => {
      prismaMock.contact.upsert.mockResolvedValue(mockContact)
      prismaMock.message.findUnique.mockResolvedValue(null)
      prismaMock.message.create.mockResolvedValue(mockMessage)
      prismaMock.conversation.update.mockResolvedValue(mockConversation)
      prismaMock.whatsAppConfig.findFirst.mockResolvedValue(null)
    })

    it('deve aplicar roteamento quando conversa não tem agente atribuído', async () => {
      prismaMock.conversation.findFirst.mockResolvedValue(null)
      prismaMock.conversation.create.mockResolvedValue({ ...mockConversation, assignedUserId: null })
      routingMock.assignConversation.mockResolvedValue(undefined)

      await processor.process(makePayload([makeTextMessage()]))

      expect(routingMock.assignConversation).toHaveBeenCalledWith(TENANT_ID, CONVERSATION_ID)
    })

    it('não deve aplicar roteamento quando conversa já tem agente', async () => {
      prismaMock.conversation.findFirst.mockResolvedValue({
        ...mockConversation,
        assignedUserId: 'agent-001',
      })
      routingMock.assignConversation.mockResolvedValue(undefined)

      await processor.process(makePayload([makeTextMessage()]))

      expect(routingMock.assignConversation).not.toHaveBeenCalled()
    })
  })

  // ── handleStatusUpdate ───────────────────────────────────────────────────────

  describe('handleStatusUpdate via process()', () => {
    const makeStatusPayload = (status: string) =>
      ({
        id: 'job-002',
        data: {
          tenantId: TENANT_ID,
          rawPayload: {
            id: 'entry-1',
            changes: [
              {
                field: 'messages',
                value: {
                  messaging_product: 'whatsapp',
                  metadata: { display_phone_number: '5511000000000', phone_number_id: 'phone-001' },
                  statuses: [
                    { id: WA_MESSAGE_ID, status, timestamp: '1700000010', recipient_id: '5511999999999' },
                  ],
                },
              },
            ],
          },
        },
      }) as unknown as Job<InboundMessageJobPayload>

    it('deve atualizar status delivered e emitir evento', async () => {
      prismaMock.message.findUnique.mockResolvedValue({
        id: MESSAGE_ID,
        tenantId: TENANT_ID,
      })
      prismaMock.message.update.mockResolvedValue({})

      await processor.process(makeStatusPayload('delivered'))

      expect(prismaMock.message.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { waMessageId: WA_MESSAGE_ID },
          data: expect.objectContaining({ status: 'delivered', deliveredAt: expect.any(Date) }),
        }),
      )
      expect(socketEmitterMock.emitToTenant).toHaveBeenCalledWith(
        TENANT_ID,
        'message:status',
        expect.objectContaining({ messageId: MESSAGE_ID, status: 'delivered' }),
      )
    })

    it('deve atualizar status read e salvar readAt', async () => {
      prismaMock.message.findUnique.mockResolvedValue({ id: MESSAGE_ID, tenantId: TENANT_ID })
      prismaMock.message.update.mockResolvedValue({})

      await processor.process(makeStatusPayload('read'))

      expect(prismaMock.message.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'read', readAt: expect.any(Date) }),
        }),
      )
    })

    it('deve atualizar status failed e salvar failedAt', async () => {
      prismaMock.message.findUnique.mockResolvedValue({ id: MESSAGE_ID, tenantId: TENANT_ID })
      prismaMock.message.update.mockResolvedValue({})

      await processor.process(makeStatusPayload('failed'))

      expect(prismaMock.message.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'failed', failedAt: expect.any(Date) }),
        }),
      )
    })

    it('deve ignorar status desconhecido', async () => {
      await processor.process(makeStatusPayload('unknown_status'))

      expect(prismaMock.message.findUnique).not.toHaveBeenCalled()
      expect(prismaMock.message.update).not.toHaveBeenCalled()
    })

    it('deve ignorar update quando mensagem pertence a outro tenant — isolamento', async () => {
      prismaMock.message.findUnique.mockResolvedValue({
        id: MESSAGE_ID,
        tenantId: 'outro-tenant',
      })

      await processor.process(makeStatusPayload('delivered'))

      expect(prismaMock.message.update).not.toHaveBeenCalled()
    })

    it('deve ignorar update quando mensagem não encontrada', async () => {
      prismaMock.message.findUnique.mockResolvedValue(null)

      await processor.process(makeStatusPayload('delivered'))

      expect(prismaMock.message.update).not.toHaveBeenCalled()
    })
  })
})
