import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiQuery,
  ApiConsumes,
} from '@nestjs/swagger'
import { FileInterceptor } from '@nestjs/platform-express'
import { ContactsService } from './contacts.service'
import { CreateContactDto } from './dto/create-contact.dto'
import { UpdateContactDto } from './dto/update-contact.dto'
import { FilterContactsDto } from './dto/filter-contacts.dto'
import { ImportContactsDto, ImportContactsResultDto } from './dto/import-contacts.dto'
import { ContactResponseDto, PaginatedContactsDto } from './dto/contact-response.dto'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { Roles } from '../../common/decorators/roles.decorator'
import { JwtPayload } from '@zaptend/types'

@ApiTags('Contatos')
@ApiBearerAuth()
@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  @Roles('agent', 'supervisor', 'admin', 'owner')
  @ApiOperation({
    summary: 'Listar contatos',
    description: 'Retorna contatos do tenant paginados, com filtros opcionais por busca, tags e status de bloqueio.',
  })
  @ApiQuery({ name: 'search', type: String, required: false, description: 'Busca por nome, telefone ou e-mail' })
  @ApiQuery({ name: 'tags', type: [String], required: false, description: 'Filtrar por tags' })
  @ApiQuery({ name: 'isBlocked', type: Boolean, required: false, description: 'Filtrar por status de bloqueio' })
  @ApiQuery({ name: 'page', type: Number, required: false, example: 1 })
  @ApiQuery({ name: 'limit', type: Number, required: false, example: 20 })
  @ApiResponse({ status: 200, description: 'Lista paginada de contatos', type: PaginatedContactsDto })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: FilterContactsDto,
  ): Promise<PaginatedContactsDto> {
    return this.contactsService.findAll(user.tenantId, query)
  }

  @Get(':id')
  @Roles('agent', 'supervisor', 'admin', 'owner')
  @ApiOperation({
    summary: 'Buscar contato por ID',
    description: 'Retorna os detalhes do contato incluindo histórico de conversas.',
  })
  @ApiParam({ name: 'id', description: 'ID do contato' })
  @ApiResponse({ status: 200, description: 'Detalhes do contato', type: ContactResponseDto })
  @ApiResponse({ status: 404, description: 'Contato não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<ContactResponseDto> {
    return this.contactsService.findOne(id, user.tenantId)
  }

  @Post()
  @Roles('agent', 'supervisor', 'admin', 'owner')
  @ApiOperation({
    summary: 'Criar contato',
    description: 'Cria um novo contato para o tenant. O telefone deve ser único por tenant.',
  })
  @ApiBody({ type: CreateContactDto })
  @ApiResponse({ status: 201, description: 'Contato criado com sucesso', type: ContactResponseDto })
  @ApiResponse({ status: 409, description: 'Já existe um contato com esse telefone' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  create(
    @Body() dto: CreateContactDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ContactResponseDto> {
    return this.contactsService.create(user.tenantId, dto)
  }

  @Patch(':id')
  @Roles('agent', 'supervisor', 'admin', 'owner')
  @ApiOperation({
    summary: 'Atualizar contato',
    description: 'Atualiza parcialmente os dados do contato, incluindo customFields, tags e status de bloqueio.',
  })
  @ApiParam({ name: 'id', description: 'ID do contato' })
  @ApiBody({ type: UpdateContactDto })
  @ApiResponse({ status: 200, description: 'Contato atualizado', type: ContactResponseDto })
  @ApiResponse({ status: 404, description: 'Contato não encontrado' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateContactDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ContactResponseDto> {
    return this.contactsService.update(id, user.tenantId, dto)
  }

  @Delete(':id')
  @Roles('supervisor', 'admin', 'owner')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remover contato',
    description: 'Realiza soft delete do contato (define deletedAt). O registro não é apagado do banco.',
  })
  @ApiParam({ name: 'id', description: 'ID do contato' })
  @ApiResponse({ status: 204, description: 'Contato removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Contato não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.contactsService.remove(id, user.tenantId)
  }

  @Post('import')
  @Roles('supervisor', 'admin', 'owner')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Importar contatos via CSV',
    description:
      'Importa contatos em lote a partir de um arquivo CSV. Colunas: phone (obrigatório), name, email, company, tags (separadas por |). Faz upsert pelo phone + tenantId.',
  })
  @ApiBody({ type: ImportContactsDto })
  @ApiResponse({ status: 200, description: 'Resultado da importação', type: ImportContactsResultDto })
  @ApiResponse({ status: 400, description: 'Arquivo inválido ou ausente' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  importCsv(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5 MB
          new FileTypeValidator({ fileType: /text\/(csv|plain)|application\/vnd\.ms-excel/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @CurrentUser() user: JwtPayload,
  ): Promise<ImportContactsResultDto> {
    return this.contactsService.importCsv(user.tenantId, file)
  }
}
