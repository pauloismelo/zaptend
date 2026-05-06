import { Test, TestingModule } from '@nestjs/testing'
import { WhatsAppConfigController } from './whatsapp-config.controller'
import { WhatsAppConfigService } from './whatsapp-config.service'
import { JwtPayload } from '@zaptend/types'

const serviceMock = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
}

const mockUser: JwtPayload = {
  sub: 'user-1',
  email: 'admin@tenant.com',
  role: 'admin',
  tenantId: 'tenant-a',
  tenantSlug: 'acme',
}

const mockResponse = {
  id: 'config-1',
  tenantId: 'tenant-a',
  phoneNumberId: '12345',
  wabaId: '67890',
  phoneNumber: '+5511999999999',
  displayName: 'Suporte',
  webhookVerifyToken: 'verify-token',
  isActive: true,
  botEnabled: false,
  botSystemPrompt: null,
  businessHoursEnabled: false,
  businessHours: null,
  welcomeMessage: null,
  awayMessage: null,
  csatEnabled: true,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('WhatsAppConfigController', () => {
  let controller: WhatsAppConfigController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WhatsAppConfigController],
      providers: [{ provide: WhatsAppConfigService, useValue: serviceMock }],
    }).compile()

    controller = module.get<WhatsAppConfigController>(WhatsAppConfigController)
  })

  afterEach(() => jest.clearAllMocks())

  // ── findAll ─────────────────────────────────────────

  describe('findAll', () => {
    it('deve chamar service.findAll com tenantId do usuário autenticado', async () => {
      serviceMock.findAll.mockResolvedValue([mockResponse])

      const result = await controller.findAll(mockUser)

      expect(serviceMock.findAll).toHaveBeenCalledWith('tenant-a')
      expect(result).toHaveLength(1)
    })
  })

  // ── findOne ─────────────────────────────────────────

  describe('findOne', () => {
    it('deve chamar service.findOne com id e tenantId do usuário', async () => {
      serviceMock.findOne.mockResolvedValue(mockResponse)

      const result = await controller.findOne('config-1', mockUser)

      expect(serviceMock.findOne).toHaveBeenCalledWith('config-1', 'tenant-a')
      expect(result.id).toBe('config-1')
    })
  })

  // ── create ──────────────────────────────────────────

  describe('create', () => {
    it('deve chamar service.create com tenantId do usuário e dto', async () => {
      serviceMock.create.mockResolvedValue(mockResponse)
      const dto = {
        phoneNumberId: '12345',
        wabaId: '67890',
        phoneNumber: '+5511999999999',
        displayName: 'Suporte',
        accessToken: 'raw-token',
      }

      const result = await controller.create(dto, mockUser)

      expect(serviceMock.create).toHaveBeenCalledWith('tenant-a', dto)
      expect(result).toEqual(mockResponse)
    })
  })

  // ── update ──────────────────────────────────────────

  describe('update', () => {
    it('deve chamar service.update com id, tenantId e dto', async () => {
      const updatedResponse = { ...mockResponse, displayName: 'Novo Nome' }
      serviceMock.update.mockResolvedValue(updatedResponse)

      const result = await controller.update('config-1', { displayName: 'Novo Nome' }, mockUser)

      expect(serviceMock.update).toHaveBeenCalledWith('config-1', 'tenant-a', {
        displayName: 'Novo Nome',
      })
      expect(result.displayName).toBe('Novo Nome')
    })
  })

  // ── remove ──────────────────────────────────────────

  describe('remove', () => {
    it('deve chamar service.remove com id e tenantId do usuário', async () => {
      serviceMock.remove.mockResolvedValue(undefined)

      await controller.remove('config-1', mockUser)

      expect(serviceMock.remove).toHaveBeenCalledWith('config-1', 'tenant-a')
    })

    it('deve retornar void (sem body) ao remover', async () => {
      serviceMock.remove.mockResolvedValue(undefined)

      const result = await controller.remove('config-1', mockUser)

      expect(result).toBeUndefined()
    })
  })
})
