import { Test, TestingModule } from '@nestjs/testing'
import { DepartmentsController } from './departments.controller'
import { DepartmentsService } from './departments.service'
import { JwtPayload } from '@zaptend/types'

const mockJwtPayload: JwtPayload = {
  sub: 'actor-001',
  email: 'admin@empresa.com',
  role: 'admin',
  tenantId: 'tenant-001',
  tenantSlug: 'empresa',
}

const mockDepartmentsService = {
  findAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  assignAgents: jest.fn(),
  removeAgent: jest.fn(),
}

describe('DepartmentsController', () => {
  let controller: DepartmentsController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DepartmentsController],
      providers: [
        { provide: DepartmentsService, useValue: mockDepartmentsService },
      ],
    }).compile()

    controller = module.get<DepartmentsController>(DepartmentsController)
    jest.clearAllMocks()
  })

  describe('findAll', () => {
    it('deve chamar service.findAll com tenantId do usuário autenticado', async () => {
      mockDepartmentsService.findAll.mockResolvedValue([])

      await controller.findAll(mockJwtPayload)

      expect(mockDepartmentsService.findAll).toHaveBeenCalledWith(mockJwtPayload.tenantId)
    })
  })

  describe('create', () => {
    it('deve chamar service.create com tenantId e dto corretos', async () => {
      const dto = { name: 'Suporte', description: 'Desc', color: '#00B37E' }
      mockDepartmentsService.create.mockResolvedValue({ id: 'dept-001', ...dto })

      await controller.create(dto, mockJwtPayload)

      expect(mockDepartmentsService.create).toHaveBeenCalledWith(mockJwtPayload.tenantId, dto)
    })
  })

  describe('update', () => {
    it('deve chamar service.update com id, tenantId e dto corretos', async () => {
      const dto = { name: 'Vendas', isActive: true }
      mockDepartmentsService.update.mockResolvedValue({ id: 'dept-001', ...dto })

      await controller.update('dept-001', dto, mockJwtPayload)

      expect(mockDepartmentsService.update).toHaveBeenCalledWith('dept-001', mockJwtPayload.tenantId, dto)
    })
  })

  describe('remove', () => {
    it('deve chamar service.remove com id e tenantId corretos', async () => {
      mockDepartmentsService.remove.mockResolvedValue({ id: 'dept-001', isActive: false })

      await controller.remove('dept-001', mockJwtPayload)

      expect(mockDepartmentsService.remove).toHaveBeenCalledWith('dept-001', mockJwtPayload.tenantId)
    })
  })

  describe('assignAgents', () => {
    it('deve chamar service.assignAgents com id, tenantId e dto corretos', async () => {
      const dto = { userIds: ['user-001', 'user-002'] }
      mockDepartmentsService.assignAgents.mockResolvedValue({ id: 'dept-001', agents: [] })

      await controller.assignAgents('dept-001', dto, mockJwtPayload)

      expect(mockDepartmentsService.assignAgents).toHaveBeenCalledWith(
        'dept-001',
        mockJwtPayload.tenantId,
        dto,
      )
    })
  })

  describe('removeAgent', () => {
    it('deve chamar service.removeAgent com id, userId e tenantId corretos', async () => {
      mockDepartmentsService.removeAgent.mockResolvedValue({ id: 'dept-001', agents: [] })

      await controller.removeAgent('dept-001', 'user-001', mockJwtPayload)

      expect(mockDepartmentsService.removeAgent).toHaveBeenCalledWith(
        'dept-001',
        'user-001',
        mockJwtPayload.tenantId,
      )
    })
  })
})
