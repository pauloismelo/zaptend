import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common'
import { JwtPayload } from '@zaptend/types'

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user?: JwtPayload & { role?: string } }>()
    const email = request.user?.email ?? ''
    if (!email.endsWith('@zaptend.com.br')) {
      throw new ForbiddenException('Acesso restrito ao Super Admin')
    }
    return true
  }
}
