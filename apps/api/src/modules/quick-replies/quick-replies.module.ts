import { Module } from '@nestjs/common'
import { PrismaModule } from '../../prisma/prisma.module'
import { QuickRepliesController } from './quick-replies.controller'
import { QuickRepliesService } from './quick-replies.service'

@Module({
  imports: [PrismaModule],
  controllers: [QuickRepliesController],
  providers: [QuickRepliesService],
})
export class QuickRepliesModule {}

