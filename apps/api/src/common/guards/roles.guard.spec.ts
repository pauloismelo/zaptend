import { Test, TestingModule } from '@nestjs/testing'
import { ExecutionContext, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { RolesGuard } from './roles.guard'
import { ROLES_KEY } from '../decorators/roles.decorator'
import { UserRole } from '@zaptend/types'

function makeContext(userRole: UserRole | undefined, metaRoles: UserRole[] | undefined): ExecutionContext {
  const mockReflector = {
    getAllAndOverride: jest.fn().mockReturnValue(metaRoles),
  }

  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => ({ user: userRole !== undefined ? { role: userRole } : undefined }),
    }),
    // injeta o reflector mockado via closure
    _reflector: mockReflector,
  } as unknown as ExecutionContext
}

describe('RolesGuard', () => {
  let guard: RolesGuard
  let reflector: jest.Mocked<Reflector>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RolesGuard, Reflector],
    }).compile()

    guard = module.get<RolesGuard>(RolesGuard)
    reflector = module.get(Reflector)
  })

  afterEach(() => jest.clearAllMocks())

  function buildContext(userRole: UserRole | undefined): ExecutionContext {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user: userRole !== undefined ? { role: userRole } : undefined }),
      }),
    } as unknown as ExecutionContext
  }

  describe('sem roles configuradas', () => {
    it('deve permitir acesso quando não há roles requeridas (endpoint público)', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined)
      const ctx = buildContext('agent')

      expect(guard.canActivate(ctx)).toBe(true)
    })

    it('deve permitir acesso quando roles é array vazio', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([])
      const ctx = buildContext('agent')

      expect(guard.canActivate(ctx)).toBe(true)
    })
  })

  describe('papel agent', () => {
    it('deve permitir acesso quando user tem o papel requerido', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['agent'] as UserRole[])
      const ctx = buildContext('agent')

      expect(guard.canActivate(ctx)).toBe(true)
    })

    it('deve negar acesso quando user não tem o papel requerido', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin'] as UserRole[])
      const ctx = buildContext('agent')

      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException)
    })
  })

  describe('papel supervisor', () => {
    it('deve permitir acesso para supervisor quando requerido', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['supervisor'] as UserRole[])
      const ctx = buildContext('supervisor')

      expect(guard.canActivate(ctx)).toBe(true)
    })

    it('supervisor não pode acessar rota restrita a owner', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['owner'] as UserRole[])
      const ctx = buildContext('supervisor')

      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException)
    })
  })

  describe('papel admin', () => {
    it('deve permitir acesso para admin quando requerido', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin'] as UserRole[])
      const ctx = buildContext('admin')

      expect(guard.canActivate(ctx)).toBe(true)
    })

    it('admin não pode acessar rota restrita exclusivamente a owner', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['owner'] as UserRole[])
      const ctx = buildContext('admin')

      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException)
    })
  })

  describe('papel owner', () => {
    it('deve permitir acesso para owner quando requerido', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['owner'] as UserRole[])
      const ctx = buildContext('owner')

      expect(guard.canActivate(ctx)).toBe(true)
    })

    it('owner pode acessar rota que aceita múltiplos papéis', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin', 'owner'] as UserRole[])
      const ctx = buildContext('owner')

      expect(guard.canActivate(ctx)).toBe(true)
    })
  })

  describe('múltiplos papéis (lógica OR)', () => {
    it('deve permitir acesso quando user tem um dos papéis permitidos', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['supervisor', 'admin', 'owner'] as UserRole[])
      const ctx = buildContext('supervisor')

      expect(guard.canActivate(ctx)).toBe(true)
    })

    it('deve negar acesso quando user não tem nenhum dos papéis permitidos', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin', 'owner'] as UserRole[])
      const ctx = buildContext('agent')

      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException)
    })
  })

  describe('mensagem de erro', () => {
    it('deve lançar ForbiddenException com mensagem em português', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['owner'] as UserRole[])
      const ctx = buildContext('agent')

      expect(() => guard.canActivate(ctx)).toThrow(
        new ForbiddenException('Você não tem permissão para acessar este recurso'),
      )
    })
  })

  describe('reflector', () => {
    it('deve consultar metadata no handler e na classe (getAllAndOverride)', () => {
      const handler = jest.fn()
      const cls = jest.fn()
      const getAllAndOverrideSpy = jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined)

      const ctx = {
        getHandler: () => handler,
        getClass: () => cls,
        switchToHttp: () => ({ getRequest: () => ({ user: { role: 'agent' } }) }),
      } as unknown as ExecutionContext

      guard.canActivate(ctx)

      expect(getAllAndOverrideSpy).toHaveBeenCalledWith(ROLES_KEY, [handler, cls])
    })
  })
})
