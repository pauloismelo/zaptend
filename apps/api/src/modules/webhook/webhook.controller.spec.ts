import { Test, TestingModule } from '@nestjs/testing'
import { BadRequestException, UnauthorizedException } from '@nestjs/common'
import { WebhookController } from './webhook.controller'
import { WebhookService } from './webhook.service'
import { VerifyWebhookQueryDto } from './dto/verify-webhook.dto'
import { MetaWebhookPayloadDto } from './dto/meta-webhook.dto'
import { Request } from 'express'
import { RawBodyRequest } from '@nestjs/common'

// ─── Mock ─────────────────────────────────────────────────────────────────────

const serviceMock = {
  verifySignature: jest.fn(),
  handleVerification: jest.fn(),
  processPayload: jest.fn(),
}

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('WebhookController', () => {
  let controller: WebhookController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebhookController],
      providers: [{ provide: WebhookService, useValue: serviceMock }],
    }).compile()

    controller = module.get<WebhookController>(WebhookController)
  })

  afterEach(() => jest.clearAllMocks())

  // ── verifyWebhook (GET) ─────────────────────────────────────────────────────

  describe('verifyWebhook (GET)', () => {
    it('deve retornar o challenge quando verificação for bem-sucedida', async () => {
      serviceMock.handleVerification.mockResolvedValue('challenge-xyz')

      const query: VerifyWebhookQueryDto = {
        'hub.mode': 'subscribe',
        'hub.verify_token': 'valid-token',
        'hub.challenge': 'challenge-xyz',
      }

      const result = await controller.verifyWebhook('tenant-a', query)

      expect(result).toBe('challenge-xyz')
    })

    it('deve chamar handleVerification com os parâmetros corretos', async () => {
      serviceMock.handleVerification.mockResolvedValue('ch')

      const query: VerifyWebhookQueryDto = {
        'hub.mode': 'subscribe',
        'hub.verify_token': 'token-abc',
        'hub.challenge': 'ch',
      }

      await controller.verifyWebhook('tenant-b', query)

      expect(serviceMock.handleVerification).toHaveBeenCalledWith(
        'tenant-b',
        'subscribe',
        'token-abc',
        'ch',
      )
    })

    it('deve propagar BadRequestException do service (mode inválido)', async () => {
      serviceMock.handleVerification.mockRejectedValue(
        new BadRequestException('Modo de verificação inválido'),
      )

      const query: VerifyWebhookQueryDto = {
        'hub.mode': 'unsubscribe',
        'hub.verify_token': 'token',
        'hub.challenge': 'ch',
      }

      await expect(controller.verifyWebhook('tenant-a', query)).rejects.toThrow(BadRequestException)
    })

    it('deve propagar UnauthorizedException do service (token inválido)', async () => {
      serviceMock.handleVerification.mockRejectedValue(
        new UnauthorizedException('Token de verificação inválido'),
      )

      const query: VerifyWebhookQueryDto = {
        'hub.mode': 'subscribe',
        'hub.verify_token': 'token-errado',
        'hub.challenge': 'ch',
      }

      await expect(controller.verifyWebhook('tenant-a', query)).rejects.toThrow(
        UnauthorizedException,
      )
    })
  })

  // ── handleWebhook (POST) ────────────────────────────────────────────────────

  describe('handleWebhook (POST)', () => {
    function buildReq(rawBodyStr = '{}'): RawBodyRequest<Request> {
      return { rawBody: Buffer.from(rawBodyStr) } as unknown as RawBodyRequest<Request>
    }

    function buildPayload(): MetaWebhookPayloadDto {
      return {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'waba-id',
            changes: [
              {
                field: 'messages',
                value: {
                  messaging_product: 'whatsapp',
                  metadata: { display_phone_number: '5511', phone_number_id: '12345' },
                  messages: [
                    {
                      from: '5511999990000',
                      id: 'wamid.abc',
                      timestamp: '1716000000',
                      type: 'text',
                      text: { body: 'Olá' },
                    },
                  ],
                },
              },
            ],
          },
        ],
      }
    }

    it('deve retornar { status: "ok" } quando payload é válido', async () => {
      serviceMock.verifySignature.mockReturnValue(undefined)
      serviceMock.processPayload.mockResolvedValue(undefined)

      const result = await controller.handleWebhook(
        buildReq(),
        'tenant-a',
        'sha256=validhash',
        buildPayload(),
      )

      expect(result).toEqual({ status: 'ok' })
    })

    it('deve chamar verifySignature com rawBody e assinatura', async () => {
      const rawStr = '{"object":"whatsapp_business_account"}'
      const req = buildReq(rawStr)
      serviceMock.verifySignature.mockReturnValue(undefined)
      serviceMock.processPayload.mockResolvedValue(undefined)

      await controller.handleWebhook(req, 'tenant-a', 'sha256=abc', buildPayload())

      expect(serviceMock.verifySignature).toHaveBeenCalledWith(
        Buffer.from(rawStr),
        'sha256=abc',
      )
    })

    it('deve chamar processPayload com tenantId e body corretos', async () => {
      serviceMock.verifySignature.mockReturnValue(undefined)
      serviceMock.processPayload.mockResolvedValue(undefined)

      const payload = buildPayload()
      await controller.handleWebhook(buildReq(), 'tenant-a', 'sha256=sig', payload)

      expect(serviceMock.processPayload).toHaveBeenCalledWith('tenant-a', payload)
    })

    it('deve propagar UnauthorizedException se assinatura for inválida', async () => {
      serviceMock.verifySignature.mockImplementation(() => {
        throw new UnauthorizedException('Assinatura do webhook inválida')
      })

      await expect(
        controller.handleWebhook(buildReq(), 'tenant-a', 'sha256=errada', buildPayload()),
      ).rejects.toThrow(UnauthorizedException)

      // Não deve processar o payload se a assinatura falhou
      expect(serviceMock.processPayload).not.toHaveBeenCalled()
    })

    it('deve usar Buffer vazio quando rawBody for undefined', async () => {
      const req = { rawBody: undefined } as unknown as RawBodyRequest<Request>
      serviceMock.verifySignature.mockReturnValue(undefined)
      serviceMock.processPayload.mockResolvedValue(undefined)

      await controller.handleWebhook(req, 'tenant-a', 'sha256=sig', buildPayload())

      expect(serviceMock.verifySignature).toHaveBeenCalledWith(Buffer.from(''), 'sha256=sig')
    })

    it('deve aguardar processPayload antes de responder', async () => {
      const order: string[] = []
      serviceMock.verifySignature.mockReturnValue(undefined)
      serviceMock.processPayload.mockImplementation(async () => {
        order.push('processPayload')
      })

      await controller.handleWebhook(buildReq(), 'tenant-a', 'sha256=sig', buildPayload())
      order.push('response')

      expect(order).toEqual(['processPayload', 'response'])
    })
  })
})
