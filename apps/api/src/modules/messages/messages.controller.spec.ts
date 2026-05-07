import { Test, TestingModule } from '@nestjs/testing'
import { MessagesController } from './messages.controller'
import { MessagesService } from './messages.service'
import { MessageTypeEnum } from './dto/message-type.enum'
import { JwtPayload } from '@zaptend/types'

const mockUser: JwtPayload = {
  sub: 'user-1',
  email: 'agent@example.com',
  role: 'agent',
  tenantId: 'tenant-1',
  tenantSlug: 'empresa-x',
}

const serviceMock = {
  findByConversation: jest.fn(),
  send: jest.fn(),
}

describe('MessagesController', () => {
  let controller: MessagesController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MessagesController],
      providers: [{ provide: MessagesService, useValue: serviceMock }],
    }).compile()

    controller = module.get<MessagesController>(MessagesController)
    jest.clearAllMocks()
  })

  describe('findByConversation', () => {
    it('deve chamar service com conversationId, tenantId e query', async () => {
      const expected = { data: [], nextCursor: null, hasMore: false }
      serviceMock.findByConversation.mockResolvedValue(expected)

      const result = await controller.findByConversation('conv-1', mockUser, { limit: 30 })

      expect(serviceMock.findByConversation).toHaveBeenCalledWith('conv-1', 'tenant-1', { limit: 30 })
      expect(result).toEqual(expected)
    })

    it('deve passar cursor quando fornecido', async () => {
      const expected = { data: [], nextCursor: null, hasMore: false }
      serviceMock.findByConversation.mockResolvedValue(expected)

      await controller.findByConversation('conv-1', mockUser, { cursor: 'msg-50', limit: 20 })

      expect(serviceMock.findByConversation).toHaveBeenCalledWith('conv-1', 'tenant-1', {
        cursor: 'msg-50',
        limit: 20,
      })
    })
  })

  describe('send', () => {
    it('deve chamar service com conversationId, tenantId, dto e actorId (user.sub)', async () => {
      const dto = { type: MessageTypeEnum.text, content: 'Olá mundo' }
      const expected = { id: 'msg-1', content: 'Olá mundo', type: 'text' }
      serviceMock.send.mockResolvedValue(expected)

      const result = await controller.send('conv-1', dto, mockUser)

      expect(serviceMock.send).toHaveBeenCalledWith('conv-1', 'tenant-1', dto, 'user-1')
      expect(result).toEqual(expected)
    })

    it('deve passar mediaUrl para mensagens de imagem', async () => {
      const dto = { type: MessageTypeEnum.image, mediaUrl: 'https://s3.example.com/img.jpg' }
      serviceMock.send.mockResolvedValue({ id: 'msg-img' })

      await controller.send('conv-1', dto, mockUser)

      expect(serviceMock.send).toHaveBeenCalledWith('conv-1', 'tenant-1', dto, 'user-1')
    })
  })
})
