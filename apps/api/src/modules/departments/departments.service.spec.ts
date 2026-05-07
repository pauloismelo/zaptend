import { Test, TestingModule } from '@nestjs/testing'
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common'
import { DepartmentsService } from './departments.service'
import { PrismaService } from '../../prisma/prisma.service'

const TENANT_ID = 'tenant-001'
const DEPT_ID = 'dept-001'
const USER_ID = 'user-001'

const mockDepartment = {
  id: DEPT_ID,
  tenantId: TENANT_ID,
  name: 'Suporte',
  description: 'Time de suporte',
  color: '#00B37E',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  agents: [],
}

const mockPrisma = {
  department: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  user: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
  },
}

describe('DepartmentsService', () => {
  let service: DepartmentsService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DepartmentsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile()

    service = module.get<DepartmentsService>(DepartmentsService)
    jest.clearAllMocks()
  })

  // ─── findAll ───────────────────────────────────────────────

  describe('findAll', () => {
    it('deve retornar departamentos filtrados por tenantId', async () => {
      mockPrisma.department.findMany.mockResolvedValue([mockDepartment])

      const result = await service.findAll(TENANT_ID)

      expect(mockPrisma.department.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: TENANT_ID },
        }),
      )
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(DEPT_ID)
    })

    it('deve retornar lista vazia quando não há departamentos', async () => {
      mockPrisma.department.findMany.mockResolvedValue([])

      const result = await service.findAll(TENANT_ID)

      expect(result).toHaveLength(0)
    })
  })

  // ─── create ────────────────────────────────────────────────

  describe('create', () => {
    it('deve criar departamento com sucesso', async () => {
      mockPrisma.department.findFirst.mockResolvedValue(null)
      mockPrisma.department.create.mockResolvedValue(mockDepartment)

      const dto = { name: 'Suporte', description: 'Desc', color: '#00B37E' }
      const result = await service.create(TENANT_ID, dto)

      expect(mockPrisma.department.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ tenantId: TENANT_ID, name: 'Suporte' }),
        }),
      )
      expect(result.id).toBe(DEPT_ID)
    })

    it('deve lançar ConflictException se nome já existe no tenant', async () => {
      mockPrisma.department.findFirst.mockResolvedValue(mockDepartment)

      await expect(
        service.create(TENANT_ID, { name: 'Suporte' }),
      ).rejects.toThrow(ConflictException)
    })

    it('deve usar cor padrão #00B37E quando color não informada', async () => {
      mockPrisma.department.findFirst.mockResolvedValue(null)
      mockPrisma.department.create.mockResolvedValue(mockDepartment)

      await service.create(TENANT_ID, { name: 'Novo' })

      expect(mockPrisma.department.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ color: '#00B37E' }),
        }),
      )
    })
  })

  // ─── update ────────────────────────────────────────────────

  describe('update', () => {
    it('deve atualizar departamento com sucesso', async () => {
      mockPrisma.department.findFirst.mockResolvedValue(mockDepartment)
      const updated = { ...mockDepartment, name: 'Vendas' }
      mockPrisma.department.update.mockResolvedValue(updated)

      const result = await service.update(DEPT_ID, TENANT_ID, { name: 'Vendas' })

      expect(mockPrisma.department.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: DEPT_ID } }),
      )
      expect(result.name).toBe('Vendas')
    })

    it('deve lançar NotFoundException se departamento não encontrado', async () => {
      mockPrisma.department.findFirst.mockResolvedValue(null)

      await expect(
        service.update('inexistente', TENANT_ID, { name: 'X' }),
      ).rejects.toThrow(NotFoundException)
    })

    it('deve lançar ConflictException se novo nome já existe em outro departamento do tenant', async () => {
      mockPrisma.department.findFirst
        .mockResolvedValueOnce(mockDepartment) // busca pelo dept atual
        .mockResolvedValueOnce({ ...mockDepartment, id: 'outro-dept', name: 'Vendas' }) // nome duplicado

      await expect(
        service.update(DEPT_ID, TENANT_ID, { name: 'Vendas' }),
      ).rejects.toThrow(ConflictException)
    })
  })

  // ─── remove ────────────────────────────────────────────────

  describe('remove', () => {
    it('deve setar isActive=false (soft delete)', async () => {
      mockPrisma.department.findFirst.mockResolvedValue(mockDepartment)
      mockPrisma.department.update.mockResolvedValue({ ...mockDepartment, isActive: false })

      const result = await service.remove(DEPT_ID, TENANT_ID)

      expect(mockPrisma.department.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: DEPT_ID },
          data: { isActive: false },
        }),
      )
      expect(result.isActive).toBe(false)
    })

    it('deve lançar NotFoundException se departamento não encontrado', async () => {
      mockPrisma.department.findFirst.mockResolvedValue(null)

      await expect(service.remove('inexistente', TENANT_ID)).rejects.toThrow(NotFoundException)
    })
  })

  // ─── assignAgents ──────────────────────────────────────────

  describe('assignAgents', () => {
    it('deve conectar usuários ao departamento em massa', async () => {
      mockPrisma.department.findFirst.mockResolvedValue(mockDepartment)
      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'user-001' },
        { id: 'user-002' },
      ])
      mockPrisma.department.update.mockResolvedValue({
        ...mockDepartment,
        agents: [{ id: 'user-001' }, { id: 'user-002' }],
      })

      const result = await service.assignAgents(DEPT_ID, TENANT_ID, {
        userIds: ['user-001', 'user-002'],
      })

      expect(mockPrisma.department.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            agents: {
              connect: [{ id: 'user-001' }, { id: 'user-002' }],
            },
          }),
        }),
      )
      expect(result.agents).toHaveLength(2)
    })

    it('deve lançar NotFoundException se departamento não encontrado', async () => {
      mockPrisma.department.findFirst.mockResolvedValue(null)

      await expect(
        service.assignAgents('inexistente', TENANT_ID, { userIds: ['user-001'] }),
      ).rejects.toThrow(NotFoundException)
    })

    it('deve lançar BadRequestException se algum userId não pertence ao tenant', async () => {
      mockPrisma.department.findFirst.mockResolvedValue(mockDepartment)
      mockPrisma.user.findMany.mockResolvedValue([{ id: 'user-001' }]) // só 1 encontrado de 2 pedidos

      await expect(
        service.assignAgents(DEPT_ID, TENANT_ID, { userIds: ['user-001', 'user-nao-existe'] }),
      ).rejects.toThrow(BadRequestException)
    })
  })

  // ─── removeAgent ───────────────────────────────────────────

  describe('removeAgent', () => {
    it('deve desconectar agente do departamento', async () => {
      mockPrisma.department.findFirst.mockResolvedValue(mockDepartment)
      mockPrisma.user.findFirst.mockResolvedValue({ id: USER_ID })
      mockPrisma.department.update.mockResolvedValue({ ...mockDepartment, agents: [] })

      const result = await service.removeAgent(DEPT_ID, USER_ID, TENANT_ID)

      expect(mockPrisma.department.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            agents: { disconnect: { id: USER_ID } },
          }),
        }),
      )
      expect(result.agents).toHaveLength(0)
    })

    it('deve lançar NotFoundException se departamento não encontrado', async () => {
      mockPrisma.department.findFirst.mockResolvedValue(null)

      await expect(
        service.removeAgent('inexistente', USER_ID, TENANT_ID),
      ).rejects.toThrow(NotFoundException)
    })

    it('deve lançar NotFoundException se agente não encontrado no tenant', async () => {
      mockPrisma.department.findFirst.mockResolvedValue(mockDepartment)
      mockPrisma.user.findFirst.mockResolvedValue(null)

      await expect(
        service.removeAgent(DEPT_ID, 'user-inexistente', TENANT_ID),
      ).rejects.toThrow(NotFoundException)
    })
  })
})
