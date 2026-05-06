import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common'
import * as crypto from 'crypto'
import { PrismaService } from '../../prisma/prisma.service'
import { KmsService } from '../../common/kms/kms.service'
import { CreateWhatsAppConfigDto } from './dto/create-whatsapp-config.dto'
import { UpdateWhatsAppConfigDto } from './dto/update-whatsapp-config.dto'
import { WhatsAppConfigResponseDto } from './dto/whatsapp-config-response.dto'

@Injectable()
export class WhatsAppConfigService {
  private readonly logger = new Logger(WhatsAppConfigService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly kmsService: KmsService,
  ) {}

  async findAll(tenantId: string): Promise<WhatsAppConfigResponseDto[]> {
    const configs = await this.prisma.whatsAppConfig.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    })
    return configs.map(this.toResponse)
  }

  async findOne(id: string, tenantId: string): Promise<WhatsAppConfigResponseDto> {
    const config = await this.prisma.whatsAppConfig.findFirst({
      where: { id, tenantId },
    })
    if (!config) {
      throw new NotFoundException('Configuração WhatsApp não encontrada')
    }
    return this.toResponse(config)
  }

  async create(
    tenantId: string,
    dto: CreateWhatsAppConfigDto,
  ): Promise<WhatsAppConfigResponseDto> {
    const existing = await this.prisma.whatsAppConfig.findUnique({
      where: { phoneNumberId: dto.phoneNumberId },
    })
    if (existing) {
      throw new ConflictException('Este número de telefone já está cadastrado na plataforma')
    }

    const accessTokenEncrypted = await this.kmsService.encrypt(dto.accessToken)
    const webhookVerifyToken = crypto.randomBytes(32).toString('hex')

    const config = await this.prisma.whatsAppConfig.create({
      data: {
        tenantId,
        phoneNumberId: dto.phoneNumberId,
        wabaId: dto.wabaId,
        phoneNumber: dto.phoneNumber,
        displayName: dto.displayName,
        accessTokenEncrypted,
        webhookVerifyToken,
        welcomeMessage: dto.welcomeMessage ?? null,
        awayMessage: dto.awayMessage ?? null,
        businessHoursEnabled: dto.businessHoursEnabled ?? false,
        businessHours: dto.businessHours ? (dto.businessHours as object) : undefined,
        botEnabled: dto.botEnabled ?? false,
        botSystemPrompt: dto.botSystemPrompt ?? null,
        csatEnabled: dto.csatEnabled ?? true,
      },
    })

    this.logger.log(`WhatsApp config criada: ${config.id} para tenant ${tenantId}`)
    return this.toResponse(config)
  }

  async update(
    id: string,
    tenantId: string,
    dto: UpdateWhatsAppConfigDto,
  ): Promise<WhatsAppConfigResponseDto> {
    await this.findOne(id, tenantId)

    const data: Record<string, unknown> = {}

    if (dto.displayName !== undefined) data.displayName = dto.displayName
    if (dto.welcomeMessage !== undefined) data.welcomeMessage = dto.welcomeMessage
    if (dto.awayMessage !== undefined) data.awayMessage = dto.awayMessage
    if (dto.businessHoursEnabled !== undefined) data.businessHoursEnabled = dto.businessHoursEnabled
    if (dto.businessHours !== undefined) data.businessHours = dto.businessHours as object
    if (dto.isActive !== undefined) data.isActive = dto.isActive
    if (dto.botEnabled !== undefined) data.botEnabled = dto.botEnabled
    if (dto.botSystemPrompt !== undefined) data.botSystemPrompt = dto.botSystemPrompt
    if (dto.csatEnabled !== undefined) data.csatEnabled = dto.csatEnabled

    if (dto.accessToken !== undefined) {
      data.accessTokenEncrypted = await this.kmsService.encrypt(dto.accessToken)
      this.logger.log(`Access token re-criptografado para config ${id}`)
    }

    const updated = await this.prisma.whatsAppConfig.update({
      where: { id },
      data,
    })

    this.logger.log(`WhatsApp config atualizada: ${id} para tenant ${tenantId}`)
    return this.toResponse(updated)
  }

  async remove(id: string, tenantId: string): Promise<void> {
    await this.findOne(id, tenantId)

    await this.prisma.whatsAppConfig.delete({ where: { id } })
    this.logger.log(`WhatsApp config removida: ${id} para tenant ${tenantId}`)
  }

  // Usado internamente por outros serviços (não expõe o token via API)
  async getDecryptedAccessToken(id: string, tenantId: string): Promise<string> {
    const config = await this.prisma.whatsAppConfig.findFirst({
      where: { id, tenantId },
    })
    if (!config) {
      throw new NotFoundException('Configuração WhatsApp não encontrada')
    }
    return this.kmsService.decrypt(config.accessTokenEncrypted)
  }

  private toResponse(config: {
    id: string
    tenantId: string
    phoneNumberId: string
    wabaId: string
    phoneNumber: string
    displayName: string
    webhookVerifyToken: string
    isActive: boolean
    botEnabled: boolean
    botSystemPrompt: string | null
    businessHoursEnabled: boolean
    businessHours: unknown
    welcomeMessage: string | null
    awayMessage: string | null
    csatEnabled: boolean
    createdAt: Date
    updatedAt: Date
  }): WhatsAppConfigResponseDto {
    return {
      id: config.id,
      tenantId: config.tenantId,
      phoneNumberId: config.phoneNumberId,
      wabaId: config.wabaId,
      phoneNumber: config.phoneNumber,
      displayName: config.displayName,
      webhookVerifyToken: config.webhookVerifyToken,
      isActive: config.isActive,
      botEnabled: config.botEnabled,
      botSystemPrompt: config.botSystemPrompt,
      businessHoursEnabled: config.businessHoursEnabled,
      businessHours: config.businessHours as Record<string, unknown> | null,
      welcomeMessage: config.welcomeMessage,
      awayMessage: config.awayMessage,
      csatEnabled: config.csatEnabled,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    }
  }
}
