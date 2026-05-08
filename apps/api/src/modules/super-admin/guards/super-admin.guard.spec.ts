import { ForbiddenException } from '@nestjs/common'
import { SuperAdminGuard } from './super-admin.guard'

function context(email: string) {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user: { email } }),
    }),
  } as never
}

describe('SuperAdminGuard', () => {
  const guard = new SuperAdminGuard()

  it('permite email @zaptend.com.br', () => {
    expect(guard.canActivate(context('admin@zaptend.com.br'))).toBe(true)
  })

  it('bloqueia email de tenant', () => {
    expect(() => guard.canActivate(context('admin@cliente.com'))).toThrow(ForbiddenException)
  })
})
