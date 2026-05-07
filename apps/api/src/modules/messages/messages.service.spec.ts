import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException, BadRequestException } from '@nestjs/common'
import { getQueueToken } from '@nestjs/bullmq'
import { MessagesService } from './messages.service'
import { PrismaService } from '../../prisma/prisma.service'
import { MessageTypeEnum } from './dto/message-type.enum'

const prismaMock = {
  conversation: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  message: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
}

const queueMock = {
  add: jest.fn(),
}

describe('MessagesService', () => {
  let service: MessagesService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: getQueueToken('messages-outbound'), useValue: queueMock },
      ],
    }).compile()

    service = module.get<MessagesService>(MessagesService)
    jest.clearAllMocks()
  })

  describe('findByConversation', () => {
    it('deve retornar mensagens sem hasMore quando não há próxima página', async () => {
      prismaMock.conversation.findFirst.mockResolvedValue({ id: 'conv-1' })
      const messages = Array.from({ length: 5 }, (_, i) => ({
        id: `msg-${i}`,
        content: `Mensagem ${i}`,
        createdAt: new Date(),
      }))
      prismaMock.message.findMany.mockResolvedValue(messages)

      const result = await service.findByConversation('conv-1', 'tenant-1', { limit: 30 })

      expect(result.data).toHaveLength(5)
      expect(result.hasMore).toBe(false)
      expect(result.nextCursor).toBeNull()
    })

    it('deve indicar hasMore e retornar nextCursor quando há mais mensagens', async () => {
      prismaMock.conversation.findFirst.mockResolvedValue({ id: 'conv-1' })
      // limit=2, service fetches limit+1=3, hasMore=true
      const messages = [
        { id: 'msg-3', content: 'c', createdAt: new Date() },
        { id: 'msg-2', content: 'b', createdAt: new Date() },
        { id: 'msg-1', content: 'a', createdAt: new Date() },
      ]
      prismaMock.message.findMany.mockResolvedValue(messages)

      const result = await service.findByConversation('conv-1', 'tenant-1', { limit: 2 })

      expect(result.data).toHaveLength(2)
      expect(result.hasMore).toBe(true)
      expect(result.nextCursor).toBe('msg-2')
    })

    it('deve usar cursor ao buscar mensagens anteriores', async () => {
      prismaMock.conversation.findFirst.mockResolvedValue({ id: 'conv-1' })
      prismaMock.message.findMany.mockResolvedValue([])

      await service.findByConversation('conv-1', 'tenant-1', { cursor: 'msg-10', limit: 30 })

      expect(prismaMock.message.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ cursor: { id: 'msg-10' }, skip: 1 }),
      )
    })

    it('não deve incluir cursor quando não fornecido', async () => {
      prismaMock.conversation.findFirst.mockResolvedValue({ id: 'conv-1' })
      prismaMock.message.findMany.mockResolvedValue([])

      await service.findByConversation('conv-1', 'tenant-1', {})

      expect(prismaMock.message.findMany).toHaveBeenCalledWith(
        expect.not.objectContaining({ cursor: expect.anything() }),
      )
    })

    it('deve filtrar por tenantId ao buscar conversa', async () => {
      prismaMock.conversation.findFirst.mockResolvedValue(null)

      await expect(
        service.findByConversation('conv-1', 'outro-tenant', {}),
      ).rejects.toThrow(NotFoundException)

      expect(prismaMock.conversation.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ tenantId: 'outro-tenant' }) }),
      )
    })

    it('deve lançar NotFoundException para conversa inexistente', async () => {
      prismaMock.conversation.findFirst.mockResolvedValue(null)

      await expect(
        service.findByConversation('conv-invalida', 'tenant-1', {}),
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('send', () => {
    const mockConversation = {
      id: 'conv-1',
      status: 'open',
      contact: { phone: '5511999999999' },
    }

    it('deve criar mensagem de texto e enfileirar envio', async () => {
      prismaMock.conversation.findFirst.mockResolvedValue(mockConversation)
      const createdMsg = { id: 'msg-new', type: 'text', content: 'Olá', sentByUser: null }
      prismaMock.message.create.mockResolvedValue(createdMsg)
      prismaMock.conversation.update.mockResolvedValue({})
      queueMock.add.mockResolvedValue({})

      const result = await service.send(
        'conv-1',
        'tenant-1',
        { type: MessageTypeEnum.text, content: 'Olá' },
        'user-1',
      )

      expect(prismaMock.message.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'text',
            content: 'Olá',
            direction: 'outbound',
            status: 'pending',
            sentBy: 'user-1',
          }),
        }),
      )
      expect(queueMock.add).toHaveBeenCalledWith(
        'send',
        expect.objectContaining({ messageId: 'msg-new', to: '5511999999999' }),
      )
      expect(result).toEqual(createdMsg)
    })

    it('deve atualizar lastMessageAt da conversa após envio', async () => {
      prismaMock.conversation.findFirst.mockResolvedValue(mockConversation)
      prismaMock.message.create.mockResolvedValue({ id: 'msg-1', sentByUser: null })
      prismaMock.conversation.update.mockResolvedValue({})
      queueMock.add.mockResolvedValue({})

      await service.send('conv-1', 'tenant-1', { type: MessageTypeEnum.text, content: 'Oi' }, 'user-1')

      expect(prismaMock.conversation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'conv-1' },
          data: expect.objectContaining({ lastMessageAt: expect.any(Date) }),
        }),
      )
    })

    it('deve lançar BadRequestException quando type=text sem content', async () => {
      await expect(
        service.send('conv-1', 'tenant-1', { type: MessageTypeEnum.text }, 'user-1'),
      ).rejects.toThrow(BadRequestException)
    })

    it('deve lançar BadRequestException quando type=image sem mediaUrl', async () => {
      await expect(
        service.send('conv-1', 'tenant-1', { type: MessageTypeEnum.image }, 'user-1'),
      ).rejects.toThrow(BadRequestException)
    })

    it('deve lançar BadRequestException quando type=audio sem mediaUrl', async () => {
      await expect(
        service.send('conv-1', 'tenant-1', { type: MessageTypeEnum.audio }, 'user-1'),
      ).rejects.toThrow(BadRequestException)
    })

    it('deve lançar BadRequestException quando type=template sem templateName', async () => {
      await expect(
        service.send('conv-1', 'tenant-1', { type: MessageTypeEnum.template }, 'user-1'),
      ).rejects.toThrow(BadRequestException)
    })

    it('deve lançar NotFoundException para conversa inexistente', async () => {
      prismaMock.conversation.findFirst.mockResolvedValue(null)

      await expect(
        service.send('conv-1', 'tenant-1', { type: MessageTypeEnum.text, content: 'Olá' }, 'user-1'),
      ).rejects.toThrow(NotFoundException)
    })

    it('deve lançar BadRequestException para conversa resolvida', async () => {
      prismaMock.conversation.findFirst.mockResolvedValue({ ...mockConversation, status: 'resolved' })

      await expect(
        service.send('conv-1', 'tenant-1', { type: MessageTypeEnum.text, content: 'Olá' }, 'user-1'),
      ).rejects.toThrow(BadRequestException)
    })

    it('deve lançar BadRequestException para conversa spam', async () => {
      prismaMock.conversation.findFirst.mockResolvedValue({ ...mockConversation, status: 'spam' })

      await expect(
        service.send('conv-1', 'tenant-1', { type: MessageTypeEnum.text, content: 'Olá' }, 'user-1'),
      ).rejects.toThrow(BadRequestException)
    })

    it('deve criar mensagem de imagem com mediaUrl', async () => {
      prismaMock.conversation.findFirst.mockResolvedValue(mockConversation)
      prismaMock.message.create.mockResolvedValue({ id: 'msg-img', type: 'image', sentByUser: null })
      prismaMock.conversation.update.mockResolvedValue({})
      queueMock.add.mockResolvedValue({})

      await service.send(
        'conv-1',
        'tenant-1',
        { type: MessageTypeEnum.image, mediaUrl: 'https://s3.amazonaws.com/bucket/img.jpg' },
        'user-1',
      )

      expect(prismaMock.message.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'image',
            mediaUrl: 'https://s3.amazonaws.com/bucket/img.jpg',
          }),
        }),
      )
    })

    it('deve criar mensagem de template com templateName e variáveis', async () => {
      prismaMock.conversation.findFirst.mockResolvedValue(mockConversation)
      prismaMock.message.create.mockResolvedValue({ id: 'msg-tpl', type: 'template', sentByUser: null })
      prismaMock.conversation.update.mockResolvedValue({})
      queueMock.add.mockResolvedValue({})

      await service.send(
        'conv-1',
        'tenant-1',
        { type: MessageTypeEnum.template, templateName: 'boas_vindas', templateVariables: { nome: 'João' } },
        'user-1',
      )

      expect(prismaMock.message.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ templateName: 'boas_vindas' }),
        }),
      )
      expect(queueMock.add).toHaveBeenCalledWith(
        'send',
        expect.objectContaining({ templateName: 'boas_vindas', templateVariables: { nome: 'João' } }),
      )
    })

    it('deve respeitar isolamento de tenant', async () => {
      prismaMock.conversation.findFirst.mockResolvedValue(null)

      await expect(
        service.send('conv-1', 'outro-tenant', { type: MessageTypeEnum.text, content: 'Olá' }, 'user-1'),
      ).rejects.toThrow(NotFoundException)

      expect(prismaMock.conversation.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: 'outro-tenant' }),
        }),
      )
    })
  })
})
