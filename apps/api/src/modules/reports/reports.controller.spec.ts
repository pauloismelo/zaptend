import { Test, TestingModule } from '@nestjs/testing'
import { ReportsController } from './reports.controller'
import { ReportsService } from './reports.service'

const serviceMock = {
  overview: jest.fn(),
  volume: jest.fn(),
  agents: jest.fn(),
  heatmap: jest.fn(),
  lastHoursVolume: jest.fn(),
  unassigned: jest.fn(),
}

const user = { sub: 'u1', tenantId: 'tenant-1', tenantSlug: 'acme', email: 'a@test.com', role: 'admin' as const }

describe('ReportsController', () => {
  let controller: ReportsController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [{ provide: ReportsService, useValue: serviceMock }],
    }).compile()
    controller = module.get(ReportsController)
  })

  afterEach(() => jest.clearAllMocks())

  it('usa tenantId do JWT no overview', () => {
    controller.overview(user, {})
    expect(serviceMock.overview).toHaveBeenCalledWith('tenant-1', {})
  })

  it('usa tenantId do JWT nos relatórios', () => {
    controller.volume(user, { period: 'day' })
    controller.agents(user, {})
    controller.heatmap(user, {})
    expect(serviceMock.volume).toHaveBeenCalledWith('tenant-1', { period: 'day' })
    expect(serviceMock.agents).toHaveBeenCalledWith('tenant-1', {})
    expect(serviceMock.heatmap).toHaveBeenCalledWith('tenant-1', {})
  })
})
