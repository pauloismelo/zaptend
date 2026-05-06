import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { InternalServerErrorException } from '@nestjs/common'
import { KmsService } from './kms.service'
import { KMSClient, EncryptCommand, DecryptCommand } from '@aws-sdk/client-kms'

jest.mock('@aws-sdk/client-kms')

const KMSClientMock = KMSClient as jest.MockedClass<typeof KMSClient>
const EncryptCommandMock = EncryptCommand as jest.MockedClass<typeof EncryptCommand>
const DecryptCommandMock = DecryptCommand as jest.MockedClass<typeof DecryptCommand>

const configServiceMock = {
  getOrThrow: jest.fn((key: string) => {
    if (key === 'AWS_KMS_KEY_ARN') return 'arn:aws:kms:us-east-1:123456789012:key/test-key'
    if (key === 'AWS_REGION') return 'sa-east-1'
    throw new Error(`Missing env: ${key}`)
  }),
}

describe('KmsService', () => {
  let service: KmsService
  let sendMock: jest.Mock

  beforeEach(async () => {
    sendMock = jest.fn()
    KMSClientMock.mockImplementation(() => ({ send: sendMock }) as unknown as KMSClient)

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KmsService,
        { provide: ConfigService, useValue: configServiceMock },
      ],
    }).compile()

    service = module.get<KmsService>(KmsService)
  })

  afterEach(() => jest.clearAllMocks())

  // ── encrypt ──────────────────────────────────────────

  describe('encrypt', () => {
    it('deve criptografar e retornar base64', async () => {
      const fakeBlob = Buffer.from('encrypted-bytes')
      sendMock.mockResolvedValue({ CiphertextBlob: fakeBlob })

      const result = await service.encrypt('my-secret-token')

      expect(EncryptCommandMock).toHaveBeenCalledWith(
        expect.objectContaining({ KeyId: 'arn:aws:kms:us-east-1:123456789012:key/test-key' }),
      )
      expect(result).toBe(fakeBlob.toString('base64'))
    })

    it('deve lançar InternalServerErrorException se KMS retornar blob vazio', async () => {
      sendMock.mockResolvedValue({ CiphertextBlob: null })

      await expect(service.encrypt('my-secret-token')).rejects.toThrow(
        InternalServerErrorException,
      )
    })

    it('deve lançar InternalServerErrorException se KMS falhar', async () => {
      sendMock.mockRejectedValue(new Error('KMS timeout'))

      await expect(service.encrypt('my-secret-token')).rejects.toThrow(
        InternalServerErrorException,
      )
    })
  })

  // ── decrypt ──────────────────────────────────────────

  describe('decrypt', () => {
    it('deve descriptografar e retornar a string original', async () => {
      const plaintext = Buffer.from('my-secret-token')
      sendMock.mockResolvedValue({ Plaintext: plaintext })

      const ciphertext = Buffer.from('encrypted-bytes').toString('base64')
      const result = await service.decrypt(ciphertext)

      expect(DecryptCommandMock).toHaveBeenCalledWith(
        expect.objectContaining({ KeyId: 'arn:aws:kms:us-east-1:123456789012:key/test-key' }),
      )
      expect(result).toBe('my-secret-token')
    })

    it('deve lançar InternalServerErrorException se KMS retornar plaintext vazio', async () => {
      sendMock.mockResolvedValue({ Plaintext: null })

      await expect(service.decrypt('some-base64==')).rejects.toThrow(
        InternalServerErrorException,
      )
    })

    it('deve lançar InternalServerErrorException se KMS falhar', async () => {
      sendMock.mockRejectedValue(new Error('Access denied'))

      await expect(service.decrypt('some-base64==')).rejects.toThrow(
        InternalServerErrorException,
      )
    })
  })
})
