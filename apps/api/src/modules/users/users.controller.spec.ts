import { Test, TestingModule } from '@nestjs/testing'
import { UsersController } from './users.controller'
import { UsersService } from './users.service'
import { JwtPayload } from '@zaptend/types'
import { UserRole } from '@prisma/client'

const mockJwtPayload: JwtPayload = {
  sub: 'actor-001',
  email: 'admin@empresa.com',
  role: 'admin',
  tenantId: 'tenant-001',
  tenantSlug: 'empresa',
}

const mockUsersService = {
  findAll: jest.fn(),
  invite: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  updateOnlineStatus: jest.fn(),
}

describe('UsersController', () => {
  let controller: UsersController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile()

    controller = module.get<UsersController>(UsersController)
    jest.clearAllMocks()
  })

  describe('findAll', () => {
    it('deve chamar service.findAll com tenantId do usuário autenticado', async () => {
      mockUsersService.findAll.mockResolvedValue([])
      const filters = { role: UserRole.agent }

      await controller.findAll(mockJwtPayload, filters)

      expect(mockUsersService.findAll).toHaveBeenCalledWith(mockJwtPayload.tenantId, filters)
    })
  })

  describe('invite', () => {
    it('deve chamar service.invite com tenantId e dto corretos', async () => {
      const dto = { email: 'novo@empresa.com', name: 'Novo', role: UserRole.agent }
      mockUsersService.invite.mockResolvedValue({ id: 'new-id', ...dto })

      await controller.invite(mockJwtPayload, dto)

      expect(mockUsersService.invite).toHaveBeenCalledWith(mockJwtPayload.tenantId, dto)
    })
  })

  describe('update', () => {
    it('deve chamar service.update com id, tenantId e dto corretos', async () => {
      const dto = { name: 'Atualizado' }
      mockUsersService.update.mockResolvedValue({ id: 'user-001', name: 'Atualizado' })

      await controller.update('user-001', dto, mockJwtPayload)

      expect(mockUsersService.update).toHaveBeenCalledWith('user-001', mockJwtPayload.tenantId, dto)
    })
  })

  describe('remove', () => {
    it('deve chamar service.remove com id, tenantId e actorId corretos', async () => {
      mockUsersService.remove.mockResolvedValue({ id: 'user-001', isActive: false })

      await controller.remove('user-001', mockJwtPayload)

      expect(mockUsersService.remove).toHaveBeenCalledWith(
        'user-001',
        mockJwtPayload.tenantId,
        mockJwtPayload.sub,
      )
    })
  })

  describe('updateOnlineStatus', () => {
    it('deve chamar service.updateOnlineStatus com id, tenantId e dto corretos', async () => {
      const dto = { isOnline: true }
      mockUsersService.updateOnlineStatus.mockResolvedValue({ id: 'user-001', isOnline: true })

      await controller.updateOnlineStatus('user-001', dto, mockJwtPayload)

      expect(mockUsersService.updateOnlineStatus).toHaveBeenCalledWith(
        'user-001',
        mockJwtPayload.tenantId,
        dto,
      )
    })
  })
})
