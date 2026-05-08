import { BroadcastProcessor } from './broadcast.processor'

const prismaMock = {
  broadcast: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  whatsAppConfig: {
    findFirst: jest.fn(),
  },
  contact: {
    findMany: jest.fn(),
  },
}

const metaApiMock = {
  sendTemplate: jest.fn(),
}

describe('BroadcastProcessor', () => {
  let processor: BroadcastProcessor

  beforeEach(() => {
    processor = new BroadcastProcessor(prismaMock as any, metaApiMock as any)
    prismaMock.broadcast.findFirst.mockResolvedValue({
      id: 'broadcast-1',
      tenantId: 'tenant-1',
      templateName: 'promo',
      templateVariables: { nome: '{{contact.name}}', plano: '{{customFields.plano}}' },
      segmentFilters: { fields: { plano: 'pro' } },
      startedAt: null,
    })
    prismaMock.whatsAppConfig.findFirst.mockResolvedValue({
      phoneNumberId: 'phone-1',
      accessTokenEncrypted: 'token',
    })
    prismaMock.contact.findMany.mockResolvedValue([
      { id: 'contact-1', phone: '5511999999999', name: 'Ana', company: null, customFields: { plano: 'pro' }, tags: [] },
      { id: 'contact-2', phone: '5511888888888', name: 'Bia', company: null, customFields: { plano: 'starter' }, tags: [] },
    ])
    prismaMock.broadcast.update.mockResolvedValue({})
    metaApiMock.sendTemplate.mockResolvedValue({ messages: [{ id: 'wamid' }] })
    jest.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
      callback()
      return 0 as any
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
    jest.clearAllMocks()
  })

  it('envia template para contatos elegíveis e atualiza contadores', async () => {
    await processor.process({ data: { tenantId: 'tenant-1', broadcastId: 'broadcast-1' } } as any)

    expect(metaApiMock.sendTemplate).toHaveBeenCalledTimes(1)
    expect(metaApiMock.sendTemplate).toHaveBeenCalledWith({
      phoneNumberId: 'phone-1',
      accessToken: 'token',
      to: '5511999999999',
      templateName: 'promo',
      variables: { nome: 'Ana', plano: 'pro' },
    })
    expect(prismaMock.broadcast.update).toHaveBeenCalledWith({
      where: { id: 'broadcast-1' },
      data: { sentCount: { increment: 1 } },
    })
    expect(prismaMock.broadcast.update).toHaveBeenLastCalledWith({
      where: { id: 'broadcast-1' },
      data: { status: 'completed', completedAt: expect.any(Date) },
    })
  })

  it('marca broadcast como failed quando tenant não tem WhatsApp ativo', async () => {
    prismaMock.whatsAppConfig.findFirst.mockResolvedValue(null)

    await expect(
      processor.process({ data: { tenantId: 'tenant-1', broadcastId: 'broadcast-1' } } as any),
    ).rejects.toThrow('sem configuração WhatsApp ativa')

    expect(prismaMock.broadcast.update).toHaveBeenCalledWith({
      where: { id: 'broadcast-1' },
      data: { status: 'failed' },
    })
  })
})
