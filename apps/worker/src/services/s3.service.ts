import { Injectable, Logger } from '@nestjs/common'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { randomUUID } from 'crypto'

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name)
  private readonly s3 = new S3Client({
    region: process.env.AWS_REGION ?? 'sa-east-1',
  })
  private readonly bucket = process.env.AWS_S3_BUCKET ?? ''

  async upload(
    tenantId: string,
    buffer: Buffer,
    mimeType: string,
    filename?: string,
  ): Promise<string> {
    const ext = mimeType.split('/')[1]?.replace(/[^a-z0-9]/g, '') ?? 'bin'
    const key = `tenants/${tenantId}/media/${randomUUID()}.${ext}`

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        ...(filename && { ContentDisposition: `inline; filename="${filename}"` }),
      }),
    )

    const region = process.env.AWS_REGION ?? 'sa-east-1'
    const url = `https://${this.bucket}.s3.${region}.amazonaws.com/${key}`

    this.logger.debug(`Mídia enviada ao S3: ${url}`)

    return url
  }
}
