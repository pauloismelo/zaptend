import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { ConfigService } from '@nestjs/config'
import { JwtPayload } from '@zaptend/types'
import { PrismaService } from '../../../prisma/prisma.service'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    })
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, tenantId: payload.tenantId, isActive: true, deletedAt: null },
      select: { id: true, tenant: { select: { status: true } } },
    })

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado ou inativo')
    }
    if (user.tenant.status === 'suspended') {
      throw new UnauthorizedException('Tenant suspenso por pendência de assinatura')
    }

    return payload
  }
}
