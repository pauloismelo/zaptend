import { Test, TestingModule } from '@nestjs/testing'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { ConflictException, UnauthorizedException } from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import * as crypto from 'crypto'
import { AuthService } from './auth.service'
import { PrismaService } from '../../prisma/prisma.service'

jest.mock('bcrypt')
jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomBytes: jest.fn(),
  createHash: jest.fn(),
}))

const prismaMock = {
  tenant: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  user: {
    findFirst: jest.fn(),
  },
  refreshToken: {
    findUnique: jest.fn(),
    create: jest.fn(),
    updateMany: jest.fn(),
  },
}

const jwtMock = { sign: jest.fn() }
const configMock = { getOrThrow: jest.fn().mockReturnValue('test-secret') }

describe('AuthService', () => {
  let service: AuthService

  const mockTenant = { id: 'tenant-1', slug: 'empresa-abc', name: 'Empresa ABC', email: 'admin@abc.com' }
  const mockUser = {
    id: 'user-1',
    tenantId: 'tenant-1',
    email: 'joao@abc.com',
    name: 'João',
    role: 'owner',
    passwordHash: '$2b$12$hashed',
    isActive: true,
    deletedAt: null,
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: jwtMock },
        { provide: ConfigService, useValue: configMock },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)

    // Default crypto mocks
    ;(crypto.randomBytes as jest.Mock).mockReturnValue(Buffer.from('a'.repeat(64)))
    ;(crypto.createHash as jest.Mock).mockReturnValue({
      update: jest.fn().mockReturnThis(),
      digest: jest.fn().mockReturnValue('hashed-token'),
    })
    jwtMock.sign.mockReturnValue('jwt-access-token')
    ;(bcrypt.hash as jest.Mock).mockResolvedValue('$2b$12$hashed')
    ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
    prismaMock.refreshToken.create.mockResolvedValue({})
  })

  afterEach(() => jest.clearAllMocks())

  // ── register ────────────────────────────────────────────────────────────────

  describe('register', () => {
    const registerDto = {
      tenantName: 'Empresa ABC',
      tenantSlug: 'empresa-abc',
      name: 'João',
      email: 'joao@abc.com',
      password: 'Senha@123',
    }

    it('deve registrar tenant e retornar tokens', async () => {
      prismaMock.tenant.findFirst.mockResolvedValue(null)
      prismaMock.tenant.create.mockResolvedValue({
        ...mockTenant,
        users: [mockUser],
      })

      const result = await service.register(registerDto)

      expect(result.accessToken).toBe('jwt-access-token')
      expect(result.refreshToken).toBeDefined()
      expect(result.user.email).toBe(mockUser.email)
      expect(result.user.role).toBe('owner')
      expect(result.user.tenantId).toBe(mockTenant.id)
    })

    it('deve criar tenant com slug correto', async () => {
      prismaMock.tenant.findFirst.mockResolvedValue(null)
      prismaMock.tenant.create.mockResolvedValue({ ...mockTenant, users: [mockUser] })

      await service.register(registerDto)

      expect(prismaMock.tenant.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ slug: 'empresa-abc', name: 'Empresa ABC' }),
        }),
      )
    })

    it('deve criar usuário com role owner e hash de senha', async () => {
      prismaMock.tenant.findFirst.mockResolvedValue(null)
      prismaMock.tenant.create.mockResolvedValue({ ...mockTenant, users: [mockUser] })

      await service.register(registerDto)

      expect(bcrypt.hash).toHaveBeenCalledWith('Senha@123', 12)
      expect(prismaMock.tenant.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            users: { create: expect.objectContaining({ role: 'owner', passwordHash: '$2b$12$hashed' }) },
          }),
        }),
      )
    })

    it('deve lançar ConflictException quando slug já existe', async () => {
      prismaMock.tenant.findFirst.mockResolvedValue(mockTenant)

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException)
      await expect(service.register(registerDto)).rejects.toThrow('Já existe um tenant com este slug')
    })

    it('deve salvar refresh token no banco', async () => {
      prismaMock.tenant.findFirst.mockResolvedValue(null)
      prismaMock.tenant.create.mockResolvedValue({ ...mockTenant, users: [mockUser] })

      await service.register(registerDto)

      expect(prismaMock.refreshToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: mockUser.id, tenantId: mockTenant.id }),
        }),
      )
    })
  })

  // ── login ───────────────────────────────────────────────────────────────────

  describe('login', () => {
    const loginDto = { tenantSlug: 'empresa-abc', email: 'joao@abc.com', password: 'Senha@123' }

    it('deve retornar tokens ao autenticar com sucesso', async () => {
      prismaMock.tenant.findFirst.mockResolvedValue(mockTenant)
      prismaMock.user.findFirst.mockResolvedValue(mockUser)

      const result = await service.login(loginDto)

      expect(result.accessToken).toBe('jwt-access-token')
      expect(result.refreshToken).toBeDefined()
      expect(result.user.id).toBe(mockUser.id)
    })

    it('deve lançar UnauthorizedException quando tenant não existe', async () => {
      prismaMock.tenant.findFirst.mockResolvedValue(null)

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException)
      await expect(service.login(loginDto)).rejects.toThrow('Credenciais inválidas')
    })

    it('deve lançar UnauthorizedException quando usuário não existe', async () => {
      prismaMock.tenant.findFirst.mockResolvedValue(mockTenant)
      prismaMock.user.findFirst.mockResolvedValue(null)

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException)
    })

    it('deve lançar UnauthorizedException quando senha é inválida', async () => {
      prismaMock.tenant.findFirst.mockResolvedValue(mockTenant)
      prismaMock.user.findFirst.mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException)
    })

    it('não deve vazar informação sobre qual campo está errado', async () => {
      prismaMock.tenant.findFirst.mockResolvedValue(mockTenant)
      prismaMock.user.findFirst.mockResolvedValue(null)

      const err1 = await service.login(loginDto).catch((e) => e)

      prismaMock.tenant.findFirst.mockResolvedValue(null)
      const err2 = await service.login(loginDto).catch((e) => e)

      expect(err1.message).toBe(err2.message)
    })

    it('deve filtrar usuário por tenantId', async () => {
      prismaMock.tenant.findFirst.mockResolvedValue(mockTenant)
      prismaMock.user.findFirst.mockResolvedValue(mockUser)

      await service.login(loginDto)

      expect(prismaMock.user.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: mockTenant.id }),
        }),
      )
    })
  })

  // ── refresh ─────────────────────────────────────────────────────────────────

  describe('refresh', () => {
    const storedToken = {
      tokenHash: 'hashed-token',
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      user: {
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        tenantId: mockUser.tenantId,
        tenant: mockTenant,
      },
    }

    it('deve retornar novo accessToken para refresh token válido', async () => {
      prismaMock.refreshToken.findUnique.mockResolvedValue(storedToken)

      const result = await service.refresh('raw-token')

      expect(result.accessToken).toBe('jwt-access-token')
      expect(jwtMock.sign).toHaveBeenCalledWith(
        expect.objectContaining({ sub: mockUser.id, tenantId: mockUser.tenantId }),
        expect.objectContaining({ expiresIn: '15m' }),
      )
    })

    it('deve lançar UnauthorizedException quando token não existe', async () => {
      prismaMock.refreshToken.findUnique.mockResolvedValue(null)

      await expect(service.refresh('invalid-token')).rejects.toThrow(UnauthorizedException)
    })

    it('deve lançar UnauthorizedException quando token está revogado', async () => {
      prismaMock.refreshToken.findUnique.mockResolvedValue({
        ...storedToken,
        revokedAt: new Date(),
      })

      await expect(service.refresh('revoked-token')).rejects.toThrow(UnauthorizedException)
    })

    it('deve lançar UnauthorizedException quando token está expirado', async () => {
      prismaMock.refreshToken.findUnique.mockResolvedValue({
        ...storedToken,
        expiresAt: new Date(Date.now() - 1000),
      })

      await expect(service.refresh('expired-token')).rejects.toThrow(UnauthorizedException)
    })
  })

  // ── logout ──────────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('deve revogar o refresh token', async () => {
      prismaMock.refreshToken.updateMany.mockResolvedValue({ count: 1 })

      await service.logout('raw-token')

      expect(prismaMock.refreshToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tokenHash: 'hashed-token', revokedAt: null }),
          data: expect.objectContaining({ revokedAt: expect.any(Date) }),
        }),
      )
    })

    it('deve concluir sem erro mesmo se o token não existir', async () => {
      prismaMock.refreshToken.updateMany.mockResolvedValue({ count: 0 })

      await expect(service.logout('unknown-token')).resolves.toBeUndefined()
    })
  })
})
