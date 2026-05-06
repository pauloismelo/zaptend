import { NestFactory } from '@nestjs/core'
import { ValidationPipe, Logger } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const logger = new Logger('Bootstrap')

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || /\.zaptend\.com\.br$/.test(origin) || process.env.NODE_ENV === 'development') {
        callback(null, true)
      } else {
        callback(new Error('Origem não permitida pelo CORS'))
      }
    },
    credentials: true,
  })

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )

  const config = new DocumentBuilder()
    .setTitle('ZapTend API')
    .setDescription('Plataforma SaaS de atendimento via WhatsApp')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
    .addTag('auth', 'Autenticação e autorização')
    .addTag('tenants', 'Gerenciamento de tenants')
    .addTag('users', 'Usuários e agentes')
    .addTag('contacts', 'Contatos')
    .addTag('conversations', 'Conversas')
    .addTag('messages', 'Mensagens')
    .addTag('departments', 'Departamentos')
    .addTag('whatsapp', 'Configuração WhatsApp')
    .addTag('webhooks', 'Webhooks Meta')
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('docs', app, document)

  const port = process.env.PORT ?? 3001
  await app.listen(port)
  logger.log(`API rodando em http://localhost:${port}`)
  logger.log(`Swagger em http://localhost:${port}/docs`)
}

bootstrap()
