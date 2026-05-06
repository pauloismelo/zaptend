import { NestFactory } from '@nestjs/core'
import { Logger } from '@nestjs/common'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const logger = new Logger('Worker')

  const port = process.env.WORKER_PORT ?? 3002
  await app.listen(port)
  logger.log(`Worker rodando na porta ${port}`)
}

bootstrap()
