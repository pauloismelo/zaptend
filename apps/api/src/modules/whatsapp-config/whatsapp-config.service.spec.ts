import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException, ConflictException } from '@nestjs/common'
import { WhatsAppConfigService } from './whatsapp-config.service'
import { PrismaService } from '../../prisma/prisma.service'
import { KmsService } from '../../common/kms/kms.service'

const prismaMock = {
  whatsAppConfig: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}

const kmsMock = {
  encrypt: jest.fn(),
  decrypt: jest.fn(),
}

const mockConfig = {
  id: 'config-1',
  tenantId: 'tenant-a',
  phoneNumberId: '12345',
  wabaId: '67890',
  phoneNumber: '+5511999999999',
  displayName: 'Suporte',
  accessTokenEncrypted: 'enc-token',
  webhookVerifyToken: 'verify-token-abc',
  isActive: true,
  botEnabled: false,
  botSystemPrompt: null,
  businessHoursEnabled: false,
  businessHours: null,
  welcomeMessage: 'Olá!',
  awayMessage: null,
  csatEnabled: true,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
}

describe('WhatsAppConfigService', () => {
  let service: WhatsAppConfigService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WhatsAppConfigService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: KmsService, useValue: kmsMock },
      ],
    }).compile()

    service = module.get<WhatsAppConfigService>(WhatsAppConfigService)
  })

  afterEach(() => jest.clearAllMocks())

  // ── findAll ─────────────────────────────────────────

  describe('findAll', () => {
    it('deve retornar configurações do tenant correto', async () => {
      prismaMock.whatsAppConfig.findMany.mockResolvedValue([mockConfig])

      const result = await service.findAll('tenant-a')

      expect(prismaMock.whatsAppConfig.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tenantId: 'tenant-a' } }),
      )
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('config-1')
    })

    it('não deve expor accessTokenEncrypted na resposta', async () => {
      prismaMock.whatsAppConfig.findMany.mockResolvedValue([mockConfig])

      const [result] = await service.findAll('tenant-a')

      expect(result).not.toHaveProperty('accessTokenEncrypted')
    })

    it('deve retornar array vazio se tenant não tiver configurações', async () => {
      prismaMock.whatsAppConfig.findMany.mockResolvedValue([])

      const result = await service.findAll('tenant-sem-config')

      expect(result).toHaveLength(0)
    })
  })

  // ── findOne ─────────────────────────────────────────

  describe('findOne', () => {
    it('deve retornar a configuração quando encontrada', async () => {
      prismaMock.whatsAppConfig.findFirst.mockResolvedValue(mockConfig)

      const result = await service.findOne('config-1', 'tenant-a')

      expect(prismaMock.whatsAppConfig.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'config-1', tenantId: 'tenant-a' } }),
      )
      expect(result.id).toBe('config-1')
    })

    it('deve lançar NotFoundException se não encontrar', async () => {
      prismaMock.whatsAppConfig.findFirst.mockResolvedValue(null)

      await expect(service.findOne('id-inexistente', 'tenant-a')).rejects.toThrow(
        NotFoundException,
      )
    })

    it('deve lançar NotFoundException para config de outro tenant', async () => {
      prismaMock.whatsAppConfig.findFirst.mockResolvedValue(null)

      await expect(service.findOne('config-1', 'tenant-b')).rejects.toThrow(NotFoundException)
    })
  })

  // ── create ──────────────────────────────────────────

  describe('create', () => {
    const createDto = {
      phoneNumberId: '12345',
      wabaId: '67890',
      phoneNumber: '+5511999999999',
      displayName: 'Suporte',
      accessToken: 'raw-token-abc',
    }

    it('deve criptografar o accessToken com KMS antes de salvar', async () => {
      prismaMock.whatsAppConfig.findUnique.mockResolvedValue(null)
      kmsMock.encrypt.mockResolvedValue('encrypted-token-base64')
      prismaMock.whatsAppConfig.create.mockResolvedValue(mockConfig)

      await service.create('tenant-a', createDto)

      expect(kmsMock.encrypt).toHaveBeenCalledWith('raw-token-abc')
      expect(prismaMock.whatsAppConfig.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId: 'tenant-a',
            accessTokenEncrypted: 'encrypted-token-base64',
          }),
        }),
      )
    })

    it('deve gerar webhookVerifyToken único automaticamente', async () => {
      prismaMock.whatsAppConfig.findUnique.mockResolvedValue(null)
      kmsMock.encrypt.mockResolvedValue('encrypted-token')
      prismaMock.whatsAppConfig.create.mockResolvedValue(mockConfig)

      await service.create('tenant-a', createDto)

      const callArg = prismaMock.whatsAppConfig.create.mock.calls[0][0]
      expect(callArg.data.webhookVerifyToken).toBeDefined()
      expect(typeof callArg.data.webhookVerifyToken).toBe('string')
      expect(callArg.data.webhookVerifyToken.length).toBeGreaterThan(20)
    })

    it('deve lançar ConflictException se phoneNumberId já existir', async () => {
      prismaMock.whatsAppConfig.findUnique.mockResolvedValue(mockConfig)

      await expect(service.create('tenant-a', createDto)).rejects.toThrow(ConflictException)
      expect(kmsMock.encrypt).not.toHaveBeenCalled()
    })

    it('não deve expor accessTokenEncrypted na resposta', async () => {
      prismaMock.whatsAppConfig.findUnique.mockResolvedValue(null)
      kmsMock.encrypt.mockResolvedValue('encrypted-token')
      prismaMock.whatsAppConfig.create.mockResolvedValue(mockConfig)

      const result = await service.create('tenant-a', createDto)

      expect(result).not.toHaveProperty('accessTokenEncrypted')
    })
  })

  // ── update ──────────────────────────────────────────

  describe('update', () => {
    it('deve atualizar campos simples sem re-criptografar', async () => {
      prismaMock.whatsAppConfig.findFirst.mockResolvedValue(mockConfig)
      prismaMock.whatsAppConfig.update.mockResolvedValue({
        ...mockConfig,
        displayName: 'Novo Nome',
      })

      const result = await service.update('config-1', 'tenant-a', { displayName: 'Novo Nome' })

      expect(kmsMock.encrypt).not.toHaveBeenCalled()
      expect(result.displayName).toBe('Novo Nome')
    })

    it('deve re-criptografar accessToken quando fornecido', async () => {
      prismaMock.whatsAppConfig.findFirst.mockResolvedValue(mockConfig)
      kmsMock.encrypt.mockResolvedValue('new-encrypted-token')
      prismaMock.whatsAppConfig.update.mockResolvedValue(mockConfig)

      await service.update('config-1', 'tenant-a', { accessToken: 'new-raw-token' })

      expect(kmsMock.encrypt).toHaveBeenCalledWith('new-raw-token')
      expect(prismaMock.whatsAppConfig.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ accessTokenEncrypted: 'new-encrypted-token' }),
        }),
      )
    })

    it('deve lançar NotFoundException se configuração não pertencer ao tenant', async () => {
      prismaMock.whatsAppConfig.findFirst.mockResolvedValue(null)

      await expect(
        service.update('config-1', 'tenant-b', { displayName: 'Hacker' }),
      ).rejects.toThrow(NotFoundException)
    })
  })

  // ── remove ──────────────────────────────────────────

  describe('remove', () => {
    it('deve deletar a configuração do tenant correto', async () => {
      prismaMock.whatsAppConfig.findFirst.mockResolvedValue(mockConfig)
      prismaMock.whatsAppConfig.delete.mockResolvedValue(mockConfig)

      await service.remove('config-1', 'tenant-a')

      expect(prismaMock.whatsAppConfig.delete).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'config-1' } }),
      )
    })

    it('deve lançar NotFoundException se config não existir ou pertencer a outro tenant', async () => {
      prismaMock.whatsAppConfig.findFirst.mockResolvedValue(null)

      await expect(service.remove('config-1', 'tenant-b')).rejects.toThrow(NotFoundException)
      expect(prismaMock.whatsAppConfig.delete).not.toHaveBeenCalled()
    })
  })

  // ── getDecryptedAccessToken ──────────────────────────

  describe('getDecryptedAccessToken', () => {
    it('deve retornar o token descriptografado', async () => {
      prismaMock.whatsAppConfig.findFirst.mockResolvedValue(mockConfig)
      kmsMock.decrypt.mockResolvedValue('raw-access-token')

      const result = await service.getDecryptedAccessToken('config-1', 'tenant-a')

      expect(kmsMock.decrypt).toHaveBeenCalledWith('enc-token')
      expect(result).toBe('raw-access-token')
    })

    it('deve lançar NotFoundException para config de outro tenant', async () => {
      prismaMock.whatsAppConfig.findFirst.mockResolvedValue(null)

      await expect(service.getDecryptedAccessToken('config-1', 'tenant-b')).rejects.toThrow(
        NotFoundException,
      )
    })
  })
})
