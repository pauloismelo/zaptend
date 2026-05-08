import { Injectable, Logger } from '@nestjs/common'

export interface MetaMediaResult {
  buffer: Buffer
  mimeType: string
  filename?: string
}

export interface SendTemplateOptions {
  phoneNumberId: string
  accessToken: string
  to: string
  templateName: string
  languageCode?: string
  variables?: Record<string, unknown>
}

export interface SendTextOptions {
  phoneNumberId: string
  accessToken: string
  to: string
  text: string
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

  async sendTemplate(options: SendTemplateOptions): Promise<Record<string, unknown>> {
    const url = `https://graph.facebook.com/${this.apiVersion}/${options.phoneNumberId}/messages`
    const variableValues = Object.values(options.variables ?? {})
      .filter((value) => value !== undefined && value !== null)
      .map((value) => ({
        type: 'text',
        text: String(value),
      }))

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${options.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: options.to,
        type: 'template',
        template: {
          name: options.templateName,
          language: { code: options.languageCode ?? 'pt_BR' },
          ...(variableValues.length
            ? { components: [{ type: 'body', parameters: variableValues }] }
            : {}),
        },
      }),
    })

    if (!response.ok) {
      const details = await response.text()
      throw new Error(`Falha ao enviar template ${options.templateName}: ${response.status} ${details}`)
    }

    return (await response.json()) as Record<string, unknown>
  }

  async sendText(options: SendTextOptions): Promise<Record<string, unknown>> {
    const url = `https://graph.facebook.com/${this.apiVersion}/${options.phoneNumberId}/messages`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${options.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: options.to,
        type: 'text',
        text: { preview_url: false, body: options.text },
      }),
    })

    if (!response.ok) {
      const details = await response.text()
      throw new Error(`Falha ao enviar texto: ${response.status} ${details}`)
    }

    return (await response.json()) as Record<string, unknown>
  }
}
