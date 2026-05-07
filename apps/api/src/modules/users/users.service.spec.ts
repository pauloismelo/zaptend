import { Test, TestingModule } from '@nestjs/testing'
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import { UsersService } from './users.service'
import { PrismaService } from '../../prisma/prisma.service'
import { UserRole } from '@prisma/client'

const TENANT_ID = 'tenant-001'
const USER_ID = 'user-001'
const ACTOR_ID = 'actor-001'

const mockUser = {
  id: USER_ID,
  tenantId: TENANT_ID,
  email: 'agente@empresa.com',
  name: 'Agente Teste',
  avatarUrl: null,
  role: UserRole.agent,
  isOnline: false,
  lastSeenAt: null,
  isActive: true,
  passwordHash: 'hash',
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  departments: [],
}

const mockPrisma = {
  user: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
}

describe('UsersService', () => {
  let service: UsersService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile()

    service = module.get<UsersService>(UsersService)
    jest.clearAllMocks()
  })

  // ─── findAll ───────────────────────────────────────────────

  describe('findAll', () => {
    it('deve retornar usuários filtrados por tenantId com isActive=true por padrão', async () => {
      mockPrisma.user.findMany.mockResolvedValue([mockUser])

      const result = await service.findAll(TENANT_ID, {})

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: TENANT_ID, isActive: true }),
        }),
      )
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(USER_ID)
    })

    it('deve filtrar por role quando informada', async () => {
      mockPrisma.user.findMany.mockResolvedValue([])

      await service.findAll(TENANT_ID, { role: UserRole.admin })

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ role: UserRole.admin }),
        }),
      )
    })

    it('deve filtrar por isOnline quando informado', async () => {
      mockPrisma.user.findMany.mockResolvedValue([])

      await service.findAll(TENANT_ID, { isOnline: true })

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isOnline: true }),
        }),
      )
    })

    it('deve filtrar por isActive=false quando explicitamente informado', async () => {
      mockPrisma.user.findMany.mockResolvedValue([])

      await service.findAll(TENANT_ID, { isActive: false })

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: false }),
        }),
      )
    })
  })

  // ─── invite ────────────────────────────────────────────────

  describe('invite', () => {
    it('deve criar usuário com tenantId correto e isActive=false', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null)
      const createdUser = { ...mockUser, isActive: false }
      mockPrisma.user.create.mockResolvedValue(createdUser)

      const dto = { email: 'novo@empresa.com', name: 'Novo User', role: UserRole.agent }
      const result = await service.invite(TENANT_ID, dto)

      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId: TENANT_ID,
            isActive: false,
          }),
        }),
      )
      expect(result).toHaveProperty('temporaryPassword')
      expect(typeof result.temporaryPassword).toBe('string')
      expect(result.temporaryPassword.length).toBe(8)
    })

    it('deve gerar passwordHash com bcrypt', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null)
      mockPrisma.user.create.mockResolvedValue({ ...mockUser, isActive: false })

      const bcryptSpy = jest.spyOn(bcrypt, 'hash')

      await service.invite(TENANT_ID, { email: 'x@y.com', name: 'X', role: UserRole.agent })

      expect(bcryptSpy).toHaveBeenCalledWith(expect.any(String), 12)
    })

    it('deve lançar ConflictException se e-mail já existe no tenant', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockUser)

      const dto = { email: 'agente@empresa.com', name: 'Dup', role: UserRole.agent }

      await expect(service.invite(TENANT_ID, dto)).rejects.toThrow(ConflictException)
    })
  })

  // ─── update ────────────────────────────────────────────────

  describe('update', () => {
    it('deve atualizar usuário com sucesso', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockUser)
      const updated = { ...mockUser, name: 'Novo Nome' }
      mockPrisma.user.update.mockResolvedValue(updated)

      const result = await service.update(USER_ID, TENANT_ID, { name: 'Novo Nome' })

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: USER_ID },
          data: expect.objectContaining({ name: 'Novo Nome' }),
        }),
      )
      expect(result.name).toBe('Novo Nome')
    })

    it('deve lançar NotFoundException se usuário não pertence ao tenant', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null)

      await expect(
        service.update('inexistente', TENANT_ID, { name: 'X' }),
      ).rejects.toThrow(NotFoundException)
    })
  })

  // ─── remove ────────────────────────────────────────────────

  describe('remove', () => {
    it('deve setar isActive=false (não deletar do banco)', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockUser)
      mockPrisma.user.update.mockResolvedValue({ ...mockUser, isActive: false })

      const result = await service.remove(USER_ID, TENANT_ID, ACTOR_ID)

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: USER_ID },
          data: { isActive: false },
        }),
      )
      expect(result.isActive).toBe(false)
    })

    it('deve lançar ForbiddenException ao tentar desativar o próprio usuário', async () => {
      await expect(
        service.remove(ACTOR_ID, TENANT_ID, ACTOR_ID),
      ).rejects.toThrow(ForbiddenException)
    })

    it('deve lançar NotFoundException se usuário não encontrado', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null)

      await expect(
        service.remove('inexistente', TENANT_ID, ACTOR_ID),
      ).rejects.toThrow(NotFoundException)
    })
  })

  // ─── updateOnlineStatus ────────────────────────────────────

  describe('updateOnlineStatus', () => {
    it('deve atualizar isOnline e lastSeenAt quando isOnline=true', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockUser)
      const now = new Date()
      mockPrisma.user.update.mockResolvedValue({ id: USER_ID, isOnline: true, lastSeenAt: now, updatedAt: now })

      const result = await service.updateOnlineStatus(USER_ID, TENANT_ID, { isOnline: true })

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isOnline: true, lastSeenAt: expect.any(Date) }),
        }),
      )
      expect(result.isOnline).toBe(true)
    })

    it('deve atualizar isOnline sem alterar lastSeenAt quando isOnline=false', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockUser)
      mockPrisma.user.update.mockResolvedValue({ id: USER_ID, isOnline: false, lastSeenAt: null, updatedAt: new Date() })

      await service.updateOnlineStatus(USER_ID, TENANT_ID, { isOnline: false })

      const updateCall = mockPrisma.user.update.mock.calls[0][0]
      expect(updateCall.data).not.toHaveProperty('lastSeenAt')
    })

    it('deve lançar NotFoundException se usuário não encontrado', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null)

      await expect(
        service.updateOnlineStatus('inexistente', TENANT_ID, { isOnline: true }),
      ).rejects.toThrow(NotFoundException)
    })
  })
})
