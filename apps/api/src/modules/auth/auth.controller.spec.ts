import { Test, TestingModule } from '@nestjs/testing'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'

const serviceMock = {
  register: jest.fn(),
  login: jest.fn(),
  refresh: jest.fn(),
  logout: jest.fn(),
}

const mockAuthResponse = {
  accessToken: 'jwt-access-token',
  refreshToken: 'raw-refresh-token',
  user: {
    id: 'user-1',
    email: 'joao@abc.com',
    name: 'João',
    role: 'owner',
    tenantId: 'tenant-1',
    tenantSlug: 'empresa-abc',
  },
}

describe('AuthController', () => {
  let controller: AuthController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: serviceMock }],
    }).compile()

    controller = module.get<AuthController>(AuthController)
  })

  afterEach(() => jest.clearAllMocks())

  // ── register ────────────────────────────────────────────────────────────────

  describe('POST /auth/register', () => {
    const dto = {
      tenantName: 'Empresa ABC',
      tenantSlug: 'empresa-abc',
      name: 'João',
      email: 'joao@abc.com',
      password: 'Senha@123',
    }

    it('deve chamar service.register e retornar AuthResponseDto', async () => {
      serviceMock.register.mockResolvedValue(mockAuthResponse)

      const result = await controller.register(dto)

      expect(serviceMock.register).toHaveBeenCalledWith(dto)
      expect(result).toEqual(mockAuthResponse)
    })

    it('deve propagar exceções do service', async () => {
      const { ConflictException } = await import('@nestjs/common')
      serviceMock.register.mockRejectedValue(new ConflictException('Slug em uso'))

      await expect(controller.register(dto)).rejects.toThrow('Slug em uso')
    })
  })

  // ── login ───────────────────────────────────────────────────────────────────

  describe('POST /auth/login', () => {
    const dto = { tenantSlug: 'empresa-abc', email: 'joao@abc.com', password: 'Senha@123' }

    it('deve chamar service.login e retornar AuthResponseDto', async () => {
      serviceMock.login.mockResolvedValue(mockAuthResponse)

      const result = await controller.login(dto)

      expect(serviceMock.login).toHaveBeenCalledWith(dto)
      expect(result).toEqual(mockAuthResponse)
    })

    it('deve propagar UnauthorizedException do service', async () => {
      const { UnauthorizedException } = await import('@nestjs/common')
      serviceMock.login.mockRejectedValue(new UnauthorizedException('Credenciais inválidas'))

      await expect(controller.login(dto)).rejects.toThrow('Credenciais inválidas')
    })
  })

  // ── refresh ─────────────────────────────────────────────────────────────────

  describe('POST /auth/refresh', () => {
    const dto = { refreshToken: 'raw-refresh-token' }

    it('deve chamar service.refresh com o refreshToken do body', async () => {
      serviceMock.refresh.mockResolvedValue({ accessToken: 'new-jwt' })

      const result = await controller.refresh(dto)

      expect(serviceMock.refresh).toHaveBeenCalledWith('raw-refresh-token')
      expect(result).toEqual({ accessToken: 'new-jwt' })
    })

    it('deve propagar UnauthorizedException para token inválido', async () => {
      const { UnauthorizedException } = await import('@nestjs/common')
      serviceMock.refresh.mockRejectedValue(new UnauthorizedException('Token inválido'))

      await expect(controller.refresh(dto)).rejects.toThrow('Token inválido')
    })
  })

  // ── logout ──────────────────────────────────────────────────────────────────

  describe('POST /auth/logout', () => {
    const dto = { refreshToken: 'raw-refresh-token' }

    it('deve chamar service.logout com o refreshToken do body', async () => {
      serviceMock.logout.mockResolvedValue(undefined)

      await controller.logout(dto)

      expect(serviceMock.logout).toHaveBeenCalledWith('raw-refresh-token')
    })

    it('deve retornar undefined (204 No Content)', async () => {
      serviceMock.logout.mockResolvedValue(undefined)

      const result = await controller.logout(dto)

      expect(result).toBeUndefined()
    })
  })
})
