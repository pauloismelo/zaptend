import { Test, TestingModule } from '@nestjs/testing'
import { ContactsController } from './contacts.controller'
import { ContactsService } from './contacts.service'
import { CreateContactDto } from './dto/create-contact.dto'
import { UpdateContactDto } from './dto/update-contact.dto'
import { FilterContactsDto } from './dto/filter-contacts.dto'
import { JwtPayload } from '@zaptend/types'
import { ImportContactsResultDto } from './dto/import-contacts.dto'
import { PaginatedContactsDto, ContactResponseDto } from './dto/contact-response.dto'

const TENANT_ID = 'tenant-uuid-001'
const CONTACT_ID = 'contact-uuid-001'

const mockUser: JwtPayload = {
  sub: 'user-uuid-001',
  tenantId: TENANT_ID,
  email: 'agent@zaptend.com',
  role: 'agent',
}

const mockContactResponse: ContactResponseDto = {
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
}

const mockPaginatedResponse: PaginatedContactsDto = {
  data: [mockContactResponse],
  total: 1,
  page: 1,
  limit: 20,
  totalPages: 1,
}

const mockImportResult: ImportContactsResultDto = {
  processed: 2,
  upserted: 2,
  skipped: 0,
  errors: [],
}

const mockService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  importCsv: jest.fn(),
}

describe('ContactsController', () => {
  let controller: ContactsController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContactsController],
      providers: [{ provide: ContactsService, useValue: mockService }],
    }).compile()

    controller = module.get<ContactsController>(ContactsController)
    jest.clearAllMocks()
  })

  // ──────────────────────────────────────────────────────────
  // GET /contacts
  // ──────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('deve chamar contactsService.findAll com tenantId do usuário autenticado', async () => {
      mockService.findAll.mockResolvedValue(mockPaginatedResponse)

      const query: FilterContactsDto = { page: 1, limit: 10, search: 'João' }
      const result = await controller.findAll(mockUser, query)

      expect(mockService.findAll).toHaveBeenCalledWith(TENANT_ID, query)
      expect(result).toEqual(mockPaginatedResponse)
    })

    it('deve repassar todos os filtros ao service', async () => {
      mockService.findAll.mockResolvedValue(mockPaginatedResponse)

      const query: FilterContactsDto = { isBlocked: false, tags: ['vip'], page: 2, limit: 50 }
      await controller.findAll(mockUser, query)

      expect(mockService.findAll).toHaveBeenCalledWith(TENANT_ID, query)
    })
  })

  // ──────────────────────────────────────────────────────────
  // GET /contacts/:id
  // ──────────────────────────────────────────────────────────
  describe('findOne', () => {
    it('deve chamar contactsService.findOne com id e tenantId corretos', async () => {
      mockService.findOne.mockResolvedValue(mockContactResponse)

      const result = await controller.findOne(CONTACT_ID, mockUser)

      expect(mockService.findOne).toHaveBeenCalledWith(CONTACT_ID, TENANT_ID)
      expect(result).toEqual(mockContactResponse)
    })
  })

  // ──────────────────────────────────────────────────────────
  // POST /contacts
  // ──────────────────────────────────────────────────────────
  describe('create', () => {
    it('deve chamar contactsService.create com tenantId do usuário', async () => {
      mockService.create.mockResolvedValue(mockContactResponse)

      const dto: CreateContactDto = { phone: '5511999990001', name: 'João Silva' }
      const result = await controller.create(dto, mockUser)

      expect(mockService.create).toHaveBeenCalledWith(TENANT_ID, dto)
      expect(result).toEqual(mockContactResponse)
    })
  })

  // ──────────────────────────────────────────────────────────
  // PATCH /contacts/:id
  // ──────────────────────────────────────────────────────────
  describe('update', () => {
    it('deve chamar contactsService.update com id, tenantId e dto corretos', async () => {
      mockService.update.mockResolvedValue(mockContactResponse)

      const dto: UpdateContactDto = { name: 'João Atualizado', isBlocked: true }
      const result = await controller.update(CONTACT_ID, dto, mockUser)

      expect(mockService.update).toHaveBeenCalledWith(CONTACT_ID, TENANT_ID, dto)
      expect(result).toEqual(mockContactResponse)
    })
  })

  // ──────────────────────────────────────────────────────────
  // DELETE /contacts/:id
  // ──────────────────────────────────────────────────────────
  describe('remove', () => {
    it('deve chamar contactsService.remove com id e tenantId corretos', async () => {
      mockService.remove.mockResolvedValue(undefined)

      await controller.remove(CONTACT_ID, mockUser)

      expect(mockService.remove).toHaveBeenCalledWith(CONTACT_ID, TENANT_ID)
    })
  })

  // ──────────────────────────────────────────────────────────
  // POST /contacts/import
  // ──────────────────────────────────────────────────────────
  describe('importCsv', () => {
    it('deve chamar contactsService.importCsv com o arquivo e tenantId corretos', async () => {
      mockService.importCsv.mockResolvedValue(mockImportResult)

      const mockFile = {
        buffer: Buffer.from('phone,name\n5511999990001,João'),
        originalname: 'contacts.csv',
        mimetype: 'text/csv',
      } as Express.Multer.File

      const result = await controller.importCsv(mockFile, mockUser)

      expect(mockService.importCsv).toHaveBeenCalledWith(TENANT_ID, mockFile)
      expect(result).toEqual(mockImportResult)
    })
  })
})
