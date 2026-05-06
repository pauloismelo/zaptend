import { Module } from '@nestjs/common'
import { WhatsAppService } from './whatsapp.service'
import { KmsModule } from '../../common/kms/kms.module'
import { PrismaModule } from '../../prisma/prisma.module'

@Module({
  imports: [PrismaModule, KmsModule],
  providers: [WhatsAppService],
  exports: [WhatsAppService],
})
export class WhatsAppModule {}
