import { Module } from '@nestjs/common'
import { WhatsAppConfigController } from './whatsapp-config.controller'
import { WhatsAppConfigService } from './whatsapp-config.service'
import { KmsModule } from '../../common/kms/kms.module'
import { PrismaModule } from '../../prisma/prisma.module'

@Module({
  imports: [PrismaModule, KmsModule],
  controllers: [WhatsAppConfigController],
  providers: [WhatsAppConfigService],
  exports: [WhatsAppConfigService],
})
export class WhatsAppConfigModule {}
