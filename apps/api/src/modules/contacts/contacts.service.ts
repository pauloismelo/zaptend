import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateContactDto } from './dto/create-contact.dto'
import { UpdateContactDto } from './dto/update-contact.dto'
import { FilterContactsDto } from './dto/filter-contacts.dto'
import { ImportContactsResultDto } from './dto/import-contacts.dto'
import {
  ContactResponseDto,
  PaginatedContactsDto,
} from './dto/contact-response.dto'

@Injectable()
export class ContactsService {
  private readonly logger = new Logger(ContactsService.name)

  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, filters: FilterContactsDto): Promise<PaginatedContactsDto> {
    const page = filters.page ?? 1
    const limit = filters.limit ?? 20
    const skip = (page - 1) * limit

    const tags = filters.tags
      ? Array.isArray(filters.tags)
        ? filters.tags
        : [filters.tags]
      : undefined

    const where = {
      tenantId,
      deletedAt: null,
      ...(filters.isBlocked !== undefined && { isBlocked: filters.isBlocked }),
      ...(tags?.length && { tags: { hasSome: tags } }),
      ...(filters.search && {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' as const } },
          { phone: { contains: filters.search, mode: 'insensitive' as const } },
          { email: { contains: filters.search, mode: 'insensitive' as const } },
        ],
      }),
    }

    const [data, total] = await Promise.all([
      this.prisma.contact.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      this.prisma.contact.count({ where }),
    ])

    return {
      data: data.map(this.toResponse),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  async findOne(id: string, tenantId: string): Promise<ContactResponseDto> {
    const contact = await this.prisma.contact.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        conversations: {
          where: { deletedAt: null },
          orderBy: { lastMessageAt: 'desc' },
          select: {
            id: true,
            status: true,
            channel: true,
            lastMessageAt: true,
            createdAt: true,
          },
        },
      },
    })

    if (!contact) {
      throw new NotFoundException('Contato não encontrado')
    }

    return this.toResponse(contact)
  }

  async create(tenantId: string, dto: CreateContactDto): Promise<ContactResponseDto> {
    const existing = await this.prisma.contact.findFirst({
      where: { tenantId, phone: dto.phone, deletedAt: null },
    })

    if (existing) {
      throw new ConflictException('Já existe um contato com esse telefone neste tenant')
    }

    const contact = await this.prisma.contact.create({
      data: {
        tenantId,
        phone: dto.phone,
        name: dto.name,
        email: dto.email,
        company: dto.company,
        avatarUrl: dto.avatarUrl,
        tags: dto.tags ?? [],
        customFields: dto.customFields ?? undefined,
        notes: dto.notes,
      },
    })

    this.logger.log(`Contato criado: ${contact.id} | tenant: ${tenantId}`)
    return this.toResponse(contact)
  }

  async update(id: string, tenantId: string, dto: UpdateContactDto): Promise<ContactResponseDto> {
    await this.findOne(id, tenantId)

    const data: Record<string, unknown> = {}
    if (dto.phone !== undefined) data.phone = dto.phone
    if (dto.name !== undefined) data.name = dto.name
    if (dto.email !== undefined) data.email = dto.email
    if (dto.company !== undefined) data.company = dto.company
    if (dto.avatarUrl !== undefined) data.avatarUrl = dto.avatarUrl
    if (dto.tags !== undefined) data.tags = dto.tags
    if (dto.customFields !== undefined) data.customFields = dto.customFields
    if (dto.notes !== undefined) data.notes = dto.notes
    if (dto.isBlocked !== undefined) data.isBlocked = dto.isBlocked

    const updated = await this.prisma.contact.update({
      where: { id },
      data,
    })

    this.logger.log(`Contato ${id} atualizado | tenant: ${tenantId}`)
    return this.toResponse(updated)
  }

  async remove(id: string, tenantId: string): Promise<void> {
    await this.findOne(id, tenantId)

    await this.prisma.contact.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    this.logger.log(`Contato ${id} removido (soft delete) | tenant: ${tenantId}`)
  }

  async importCsv(tenantId: string, file: Express.Multer.File): Promise<ImportContactsResultDto> {
    const content = file.buffer.toString('utf-8')
    const lines = content.split('\n').map(l => l.trim()).filter(Boolean)

    // Detecta se a primeira linha é cabeçalho
    const headerLine = lines[0]?.toLowerCase() ?? ''
    const hasHeader = headerLine.includes('phone') || headerLine.includes('telefone')
    const dataLines = hasHeader ? lines.slice(1) : lines

    // Identifica índices das colunas a partir do cabeçalho (ou usa posição padrão)
    let colPhone = 0, colName = 1, colEmail = 2, colCompany = 3, colTags = 4

    if (hasHeader) {
      const headers = headerLine.split(',').map(h => h.trim().toLowerCase())
      colPhone = headers.indexOf('phone') !== -1 ? headers.indexOf('phone') : headers.indexOf('telefone')
      colName = headers.indexOf('name') !== -1 ? headers.indexOf('name') : headers.indexOf('nome')
      colEmail = headers.indexOf('email')
      colCompany = headers.indexOf('company') !== -1 ? headers.indexOf('company') : headers.indexOf('empresa')
      colTags = headers.indexOf('tags')
    }

    let processed = 0
    let upserted = 0
    let skipped = 0
    const errors: Array<{ line: number; error: string }> = []

    for (let i = 0; i < dataLines.length; i++) {
      const lineNumber = hasHeader ? i + 2 : i + 1
      const rawLine = dataLines[i]
      if (!rawLine) continue

      processed++

      const cols = rawLine.split(',').map(c => c.trim())
      const phone = colPhone >= 0 ? cols[colPhone] : undefined

      if (!phone) {
        skipped++
        continue
      }

      try {
        const name = colName >= 0 ? (cols[colName] || undefined) : undefined
        const email = colEmail >= 0 ? (cols[colEmail] || undefined) : undefined
        const company = colCompany >= 0 ? (cols[colCompany] || undefined) : undefined
        const tagsRaw = colTags >= 0 ? (cols[colTags] || '') : ''
        const tags = tagsRaw ? tagsRaw.split('|').map(t => t.trim()).filter(Boolean) : []

        await this.prisma.contact.upsert({
          where: { tenantId_phone: { tenantId, phone } },
          create: {
            tenantId,
            phone,
            name,
            email,
            company,
            tags,
          },
          update: {
            name: name ?? undefined,
            email: email ?? undefined,
            company: company ?? undefined,
            tags: tags.length ? tags : undefined,
            deletedAt: null,
          },
        })

        upserted++
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro desconhecido'
        errors.push({ line: lineNumber, error: message })
        this.logger.warn(`Importação CSV: erro na linha ${lineNumber}: ${message}`)
      }
    }

    this.logger.log(
      `Importação CSV concluída | tenant: ${tenantId} | processadas: ${processed} | upserted: ${upserted} | ignoradas: ${skipped} | erros: ${errors.length}`,
    )

    return { processed, upserted, skipped, errors }
  }

  private toResponse(contact: Record<string, unknown>): ContactResponseDto {
    return contact as unknown as ContactResponseDto
  }
}
