import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  KMSClient,
  EncryptCommand,
  DecryptCommand,
} from '@aws-sdk/client-kms'

@Injectable()
export class KmsService {
  private readonly logger = new Logger(KmsService.name)
  private readonly client: KMSClient
  private readonly keyArn: string

  constructor(private readonly configService: ConfigService) {
    this.keyArn = this.configService.getOrThrow<string>('AWS_KMS_KEY_ARN')
    this.client = new KMSClient({
      region: this.configService.getOrThrow<string>('AWS_REGION'),
    })
  }

  async encrypt(plaintext: string): Promise<string> {
    try {
      const command = new EncryptCommand({
        KeyId: this.keyArn,
        Plaintext: Buffer.from(plaintext, 'utf-8'),
      })
      const { CiphertextBlob } = await this.client.send(command)
      if (!CiphertextBlob) {
        throw new InternalServerErrorException('KMS retornou blob vazio ao criptografar')
      }
      return Buffer.from(CiphertextBlob).toString('base64')
    } catch (error) {
      this.logger.error('Erro ao criptografar com KMS', (error as Error).stack)
      throw new InternalServerErrorException('Falha ao criptografar token de acesso')
    }
  }

  async decrypt(ciphertext: string): Promise<string> {
    try {
      const command = new DecryptCommand({
        KeyId: this.keyArn,
        CiphertextBlob: Buffer.from(ciphertext, 'base64'),
      })
      const { Plaintext } = await this.client.send(command)
      if (!Plaintext) {
        throw new InternalServerErrorException('KMS retornou plaintext vazio ao descriptografar')
      }
      return Buffer.from(Plaintext).toString('utf-8')
    } catch (error) {
      this.logger.error('Erro ao descriptografar com KMS', (error as Error).stack)
      throw new InternalServerErrorException('Falha ao descriptografar token de acesso')
    }
  }
}
