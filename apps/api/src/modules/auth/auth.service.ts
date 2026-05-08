import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import * as bcrypt from 'bcrypt'
import * as crypto from 'crypto'
import { PrismaService } from '../../prisma/prisma.service'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'
import { AuthResponseDto, AuthUserDto, AccessTokenResponseDto } from './dto/auth-response.dto'
import { JwtPayload } from '@zaptend/types'

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const existing = await this.prisma.tenant.findFirst({
      where: { slug: dto.tenantSlug, deletedAt: null },
    })
    if (existing) {
      throw new ConflictException('Já existe um tenant com este slug')
    }

    const passwordHash = await bcrypt.hash(dto.password, 12)

    const tenant = await this.prisma.tenant.create({
      data: {
        slug: dto.tenantSlug,
        name: dto.tenantName,
        email: dto.email,
        status: 'trialing',
        users: {
          create: { email: dto.email, name: dto.name, passwordHash, role: 'owner' },
        },
      },
      include: { users: true },
    })

    const user = tenant.users[0]
    this.logger.log(`Novo tenant registrado: ${tenant.slug} (${tenant.id})`)

    return this.buildTokenResponse(user, tenant)
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const tenant = await this.prisma.tenant.findFirst({
      where: { slug: dto.tenantSlug, deletedAt: null },
    })
    if (!tenant) {
      throw new UnauthorizedException('Credenciais inválidas')
    }
    if (tenant.status === 'suspended') {
      throw new UnauthorizedException('Tenant suspenso por pendência de assinatura')
    }

    const user = await this.prisma.user.findFirst({
      where: { tenantId: tenant.id, email: dto.email, isActive: true, deletedAt: null },
    })
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas')
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash)
    if (!passwordValid) {
      throw new UnauthorizedException('Credenciais inválidas')
    }

    this.logger.log(`Login realizado: user=${user.id} tenant=${tenant.id}`)

    return this.buildTokenResponse(user, tenant)
  }

  async refresh(rawRefreshToken: string): Promise<AccessTokenResponseDto> {
    const tokenHash = this.hashToken(rawRefreshToken)

    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: { include: { tenant: true } } },
    })

    if (!stored || stored.revokedAt !== null || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token inválido ou expirado')
    }

    const { user } = stored
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role as JwtPayload['role'],
      tenantId: user.tenantId,
      tenantSlug: user.tenant.slug,
    }

    const accessToken = this.signAccessToken(payload)
    return { accessToken }
  }

  async logout(rawRefreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(rawRefreshToken)
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    })
  }

  private async buildTokenResponse(
    user: { id: string; email: string; name: string; role: string; tenantId: string },
    tenant: { id: string; slug: string },
  ): Promise<AuthResponseDto> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role as JwtPayload['role'],
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
    }

    const accessToken = this.signAccessToken(payload)
    const rawRefreshToken = crypto.randomBytes(64).toString('hex')
    const tokenHash = this.hashToken(rawRefreshToken)

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    await this.prisma.refreshToken.create({
      data: { userId: user.id, tenantId: tenant.id, tokenHash, expiresAt },
    })

    const authUser: AuthUserDto = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
    }

    return { accessToken, refreshToken: rawRefreshToken, user: authUser }
  }

  private signAccessToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload, {
      expiresIn: '15m',
      secret: this.configService.getOrThrow<string>('JWT_SECRET'),
    })
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex')
  }
}
