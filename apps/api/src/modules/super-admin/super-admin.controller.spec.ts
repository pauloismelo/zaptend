import { Test, TestingModule } from '@nestjs/testing'
import { SuperAdminController } from './super-admin.controller'
import { SuperAdminService } from './super-admin.service'

const serviceMock = {
  tenants: jest.fn(),
  tenant: jest.fn(),
  updateStatus: jest.fn(),
  metrics: jest.fn(),
  usage: jest.fn(),
}

describe('SuperAdminController', () => {
  let controller: SuperAdminController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SuperAdminController],
      providers: [{ provide: SuperAdminService, useValue: serviceMock }],
    }).compile()
    controller = module.get(SuperAdminController)
  })

  afterEach(() => jest.clearAllMocks())

  it('delega listagem de tenants', () => {
    controller.tenants({ page: 1 })
    expect(serviceMock.tenants).toHaveBeenCalledWith({ page: 1 })
  })

  it('delega alteração de status', () => {
    controller.updateStatus('tenant-1', { status: 'suspended' })
    expect(serviceMock.updateStatus).toHaveBeenCalledWith('tenant-1', { status: 'suspended' })
  })

  it('delega métricas e uso', () => {
    controller.metrics()
    controller.usage('2026-05')
    expect(serviceMock.metrics).toHaveBeenCalled()
    expect(serviceMock.usage).toHaveBeenCalledWith('2026-05')
  })
})
