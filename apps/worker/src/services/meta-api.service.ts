import { Injectable, Logger } from '@nestjs/common'

export interface MetaMediaResult {
  buffer: Buffer
  mimeType: string
  filename?: string
}

@Injectable()
export class MetaApiService {
  private readonly logger = new Logger(MetaApiService.name)
  private readonly apiVersion = process.env.META_API_VERSION ?? 'v20.0'

  async downloadMedia(mediaId: string, accessToken: string): Promise<MetaMediaResult> {
    const metaUrl = `https://graph.facebook.com/${this.apiVersion}/${mediaId}`

    const urlResponse = await fetch(metaUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!urlResponse.ok) {
      throw new Error(
        `Falha ao obter URL da mídia ${mediaId}: ${urlResponse.status} ${urlResponse.statusText}`,
      )
    }

    const { url, mime_type } = (await urlResponse.json()) as {
      url: string
      mime_type: string
    }

    this.logger.debug(`Baixando mídia ${mediaId} (${mime_type})`)

    const mediaResponse = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!mediaResponse.ok) {
      throw new Error(
        `Falha ao baixar mídia ${mediaId}: ${mediaResponse.status} ${mediaResponse.statusText}`,
      )
    }

    const arrayBuffer = await mediaResponse.arrayBuffer()

    return {
      buffer: Buffer.from(arrayBuffer),
      mimeType: mime_type,
    }
  }
}
