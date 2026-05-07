import { Test, TestingModule } from '@nestjs/testing'
import { ConflictException, NotFoundException } from '@nestjs/common'
import { ContactsService } from './contacts.service'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateContactDto } from './dto/create-contact.dto'
import { UpdateContactDto } from './dto/update-contact.dto'
import { FilterContactsDto } from './dto/filter-contacts.dto'

const TENANT_ID = 'tenant-uuid-001'
const CONTACT_ID = 'contact-uuid-001'

const mockContact = {
  id: CONTACT_ID,
  tenantId: TENANT_ID,
  phone: '5511999990001',
  name: 'João Silva',
  email: 'joao@exemplo.com',
  company: 'Acme',
  avatarUrl: null,
  tags: ['vip'],
  customFields: null,
  isBlocked: false,
  optedOut: false,
  notes: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  deletedAt: null,
}

const mockPrisma = {
  contact: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
  },
}

describe('ContactsService', () => {
  let service: ContactsService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContactsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile()

    service = module.get<ContactsService>(ContactsService)
    jest.clearAllMocks()
  })

  // ──────────────────────────────────────────────────────────
  // findAll
  // ──────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('deve retornar contatos paginados do tenant correto', async () => {
      mockPrisma.contact.findMany.mockResolvedValue([mockContact])
      mockPrisma.contact.count.mockResolvedValue(1)

      const filters: FilterContactsDto = { page: 1, limit: 20 }
      const result = await service.findAll(TENANT_ID, filters)

      expect(result.data).toHaveLength(1)
      expect(result.total).toBe(1)
      expect(result.page).toBe(1)
      expect(result.limit).toBe(20)
      expect(result.totalPages).toBe(1)

      const whereArg = mockPrisma.contact.findMany.mock.calls[0][0].where
      expect(whereArg.tenantId).toBe(TENANT_ID)
      expect(whereArg.deletedAt).toBeNull()
    })

    it('deve aplicar filtro de busca por nome/telefone/email', async () => {
      mockPrisma.contact.findMany.mockResolvedValue([])
      mockPrisma.contact.count.mockResolvedValue(0)

      await service.findAll(TENANT_ID, { search: 'João' })

      const whereArg = mockPrisma.contact.findMany.mock.calls[0][0].where
      expect(whereArg.OR).toBeDefined()
      expect(whereArg.OR).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: expect.objectContaining({ contains: 'João' }) }),
          expect.objectContaining({ phone: expect.objectContaining({ contains: 'João' }) }),
          expect.objectContaining({ email: expect.objectContaining({ contains: 'João' }) }),
        ]),
      )
    })

    it('deve aplicar filtro de tags', async () => {
      mockPrisma.contact.findMany.mockResolvedValue([])
      mockPrisma.contact.count.mockResolvedValue(0)

      await service.findAll(TENANT_ID, { tags: ['vip'] })

      const whereArg = mockPrisma.contact.findMany.mock.calls[0][0].where
      expect(whereArg.tags).toEqual({ hasSome: ['vip'] })
    })

    it('deve aplicar filtro de isBlocked', async () => {
      mockPrisma.contact.findMany.mockResolvedValue([])
      mockPrisma.contact.count.mockResolvedValue(0)

      await service.findAll(TENANT_ID, { isBlocked: true })

      const whereArg = mockPrisma.contact.findMany.mock.calls[0][0].where
      expect(whereArg.isBlocked).toBe(true)
    })

    it('deve excluir contatos com deletedAt preenchido', async () => {
      mockPrisma.contact.findMany.mockResolvedValue([])
      mockPrisma.contact.count.mockResolvedValue(0)

      await service.findAll(TENANT_ID, {})

      const whereArg = mockPrisma.contact.findMany.mock.calls[0][0].where
      expect(whereArg.deletedAt).toBeNull()
    })

    it('deve usar defaults page=1 e limit=20 quando não informados', async () => {
      mockPrisma.contact.findMany.mockResolvedValue([])
      mockPrisma.contact.count.mockResolvedValue(0)

      const result = await service.findAll(TENANT_ID, {})

      expect(result.page).toBe(1)
      expect(result.limit).toBe(20)
      const findManyArgs = mockPrisma.contact.findMany.mock.calls[0][0]
      expect(findManyArgs.take).toBe(20)
      expect(findManyArgs.skip).toBe(0)
    })
  })

  // ──────────────────────────────────────────────────────────
  // findOne
  // ──────────────────────────────────────────────────────────
  describe('findOne', () => {
    it('deve retornar o contato quando encontrado', async () => {
      mockPrisma.contact.findFirst.mockResolvedValue({ ...mockContact, conversations: [] })

      const result = await service.findOne(CONTACT_ID, TENANT_ID)

      expect(result.id).toBe(CONTACT_ID)
      expect(mockPrisma.contact.findFirst.mock.calls[0][0].where).toEqual({
        id: CONTACT_ID,
        tenantId: TENANT_ID,
        deletedAt: null,
      })
    })

    it('deve lançar NotFoundException quando contato não encontrado', async () => {
      mockPrisma.contact.findFirst.mockResolvedValue(null)

      await expect(service.findOne('nao-existe', TENANT_ID)).rejects.toThrow(
        new NotFoundException('Contato não encontrado'),
      )
    })

    it('não deve retornar contato de outro tenant', async () => {
      mockPrisma.contact.findFirst.mockResolvedValue(null)

      await expect(service.findOne(CONTACT_ID, 'outro-tenant')).rejects.toThrow(NotFoundException)
    })
  })

  // ──────────────────────────────────────────────────────────
  // create
  // ──────────────────────────────────────────────────────────
  describe('create', () => {
    const createDto: CreateContactDto = {
      phone: '5511999990002',
      name: 'Maria Souza',
      tags: ['lead'],
    }

    it('deve criar contato com o tenantId correto', async () => {
      mockPrisma.contact.findFirst.mockResolvedValue(null)
      mockPrisma.contact.create.mockResolvedValue({ ...mockContact, ...createDto, tenantId: TENANT_ID })

      const result = await service.create(TENANT_ID, createDto)

      expect(mockPrisma.contact.create.mock.calls[0][0].data.tenantId).toBe(TENANT_ID)
      expect(mockPrisma.contact.create.mock.calls[0][0].data.phone).toBe(createDto.phone)
      expect(result.tenantId).toBe(TENANT_ID)
    })

    it('deve lançar ConflictException se phone já existe para o tenant', async () => {
      mockPrisma.contact.findFirst.mockResolvedValue(mockContact)

      await expect(service.create(TENANT_ID, createDto)).rejects.toThrow(
        new ConflictException('Já existe um contato com esse telefone neste tenant'),
      )

      expect(mockPrisma.contact.create).not.toHaveBeenCalled()
    })

    it('deve criar contato com tags vazias quando não informadas', async () => {
      mockPrisma.contact.findFirst.mockResolvedValue(null)
      mockPrisma.contact.create.mockResolvedValue({ ...mockContact, tags: [] })

      await service.create(TENANT_ID, { phone: '5511888880001' })

      expect(mockPrisma.contact.create.mock.calls[0][0].data.tags).toEqual([])
    })
  })

  // ──────────────────────────────────────────────────────────
  // update
  // ──────────────────────────────────────────────────────────
  describe('update', () => {
    const updateDto: UpdateContactDto = { name: 'João Atualizado', isBlocked: true }

    it('deve atualizar parcialmente o contato', async () => {
      mockPrisma.contact.findFirst.mockResolvedValue({ ...mockContact, conversations: [] })
      mockPrisma.contact.update.mockResolvedValue({ ...mockContact, ...updateDto })

      const result = await service.update(CONTACT_ID, TENANT_ID, updateDto)

      expect(mockPrisma.contact.update.mock.calls[0][0].where.id).toBe(CONTACT_ID)
      expect(mockPrisma.contact.update.mock.calls[0][0].data.name).toBe('João Atualizado')
      expect(mockPrisma.contact.update.mock.calls[0][0].data.isBlocked).toBe(true)
      expect(result).toBeDefined()
    })

    it('deve lançar NotFoundException quando contato não existe', async () => {
      mockPrisma.contact.findFirst.mockResolvedValue(null)

      await expect(service.update('nao-existe', TENANT_ID, updateDto)).rejects.toThrow(
        NotFoundException,
      )
      expect(mockPrisma.contact.update).not.toHaveBeenCalled()
    })

    it('deve atualizar customFields corretamente', async () => {
      mockPrisma.contact.findFirst.mockResolvedValue({ ...mockContact, conversations: [] })
      const customFields = { cpf: '123.456.789-00', cargo: 'Gerente' }
      mockPrisma.contact.update.mockResolvedValue({ ...mockContact, customFields })

      await service.update(CONTACT_ID, TENANT_ID, { customFields })

      expect(mockPrisma.contact.update.mock.calls[0][0].data.customFields).toEqual(customFields)
    })
  })

  // ──────────────────────────────────────────────────────────
  // remove (soft delete)
  // ──────────────────────────────────────────────────────────
  describe('remove', () => {
    it('deve realizar soft delete setando deletedAt', async () => {
      mockPrisma.contact.findFirst.mockResolvedValue({ ...mockContact, conversations: [] })
      mockPrisma.contact.update.mockResolvedValue({ ...mockContact, deletedAt: new Date() })

      await service.remove(CONTACT_ID, TENANT_ID)

      const updateArgs = mockPrisma.contact.update.mock.calls[0][0]
      expect(updateArgs.where.id).toBe(CONTACT_ID)
      expect(updateArgs.data.deletedAt).toBeInstanceOf(Date)
    })

    it('deve lançar NotFoundException se contato não existe', async () => {
      mockPrisma.contact.findFirst.mockResolvedValue(null)

      await expect(service.remove('nao-existe', TENANT_ID)).rejects.toThrow(NotFoundException)
      expect(mockPrisma.contact.update).not.toHaveBeenCalled()
    })

    it('não deve deletar fisicamente o registro do banco', async () => {
      mockPrisma.contact.findFirst.mockResolvedValue({ ...mockContact, conversations: [] })
      mockPrisma.contact.update.mockResolvedValue({ ...mockContact, deletedAt: new Date() })

      await service.remove(CONTACT_ID, TENANT_ID)

      expect(mockPrisma.contact.update.mock.calls[0][0].data).not.toHaveProperty('id')
      expect(mockPrisma.contact.update.mock.calls[0][0].data.deletedAt).toBeDefined()
    })
  })

  // ──────────────────────────────────────────────────────────
  // importCsv
  // ──────────────────────────────────────────────────────────
  describe('importCsv', () => {
    const makeCsvFile = (content: string): Express.Multer.File =>
      ({
        buffer: Buffer.from(content, 'utf-8'),
        originalname: 'contacts.csv',
        mimetype: 'text/csv',
        fieldname: 'file',
        encoding: '7bit',
        size: content.length,
        stream: null as unknown as NodeJS.ReadableStream,
        destination: '',
        filename: '',
        path: '',
      } as Express.Multer.File)

    it('deve processar CSV válido e fazer upsert dos contatos', async () => {
      const csv = 'phone,name,email,company,tags\n5511999990001,João,joao@exemplo.com,Acme,vip|lead\n5511999990002,Maria,,,'
      mockPrisma.contact.upsert.mockResolvedValue(mockContact)

      const result = await service.importCsv(TENANT_ID, makeCsvFile(csv))

      expect(result.processed).toBe(2)
      expect(result.upserted).toBe(2)
      expect(result.skipped).toBe(0)
      expect(result.errors).toHaveLength(0)
      expect(mockPrisma.contact.upsert).toHaveBeenCalledTimes(2)
    })

    it('deve ignorar linhas sem phone', async () => {
      const csv = 'phone,name\n,João sem phone\n5511999990003,Pedro'
      mockPrisma.contact.upsert.mockResolvedValue(mockContact)

      const result = await service.importCsv(TENANT_ID, makeCsvFile(csv))

      expect(result.skipped).toBe(1)
      expect(result.upserted).toBe(1)
      expect(mockPrisma.contact.upsert).toHaveBeenCalledTimes(1)
    })

    it('deve fazer upsert com phone+tenantId correto', async () => {
      const csv = 'phone,name\n5511999990001,João'
      mockPrisma.contact.upsert.mockResolvedValue(mockContact)

      await service.importCsv(TENANT_ID, makeCsvFile(csv))

      const upsertArgs = mockPrisma.contact.upsert.mock.calls[0][0]
      expect(upsertArgs.where).toEqual({ tenantId_phone: { tenantId: TENANT_ID, phone: '5511999990001' } })
      expect(upsertArgs.create.tenantId).toBe(TENANT_ID)
    })

    it('deve parsear tags separadas por pipe (|)', async () => {
      const csv = 'phone,name,email,company,tags\n5511999990001,João,,,vip|lead|cliente'
      mockPrisma.contact.upsert.mockResolvedValue(mockContact)

      await service.importCsv(TENANT_ID, makeCsvFile(csv))

      const upsertArgs = mockPrisma.contact.upsert.mock.calls[0][0]
      expect(upsertArgs.create.tags).toEqual(['vip', 'lead', 'cliente'])
    })

    it('deve registrar erros de linha sem interromper o processo', async () => {
      const csv = 'phone,name\n5511999990001,João\n5511999990002,Maria'
      mockPrisma.contact.upsert
        .mockResolvedValueOnce(mockContact)
        .mockRejectedValueOnce(new Error('Erro de banco'))

      const result = await service.importCsv(TENANT_ID, makeCsvFile(csv))

      expect(result.upserted).toBe(1)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].error).toBe('Erro de banco')
    })
  })
})
