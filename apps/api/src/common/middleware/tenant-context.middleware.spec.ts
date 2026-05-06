import { TenantContextMiddleware } from './tenant-context.middleware'
import { tenantStorage } from '../context/tenant.context'
import { Request, Response } from 'express'

function makeJwtBearer(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `Bearer ${header}.${body}.fakesignature`
}

function makeReq(overrides: Partial<Request> = {}): Request {
  return {
    hostname: 'localhost',
    headers: {},
    ...overrides,
  } as unknown as Request
}

const res = {} as Response

describe('TenantContextMiddleware', () => {
  let middleware: TenantContextMiddleware

  beforeEach(() => {
    middleware = new TenantContextMiddleware()
  })

  describe('extração de tenantId via JWT', () => {
    it('deve extrair tenantId do payload JWT no header Authorization', (done) => {
      const req = makeReq({
        headers: { authorization: makeJwtBearer({ tenantId: 'tenant-jwt-123', sub: 'user-1' }) },
      })

      middleware.use(req, res, () => {
        expect(tenantStorage.getStore()?.tenantId).toBe('tenant-jwt-123')
        done()
      })
    })

    it('não deve extrair tenantId de JWT mal-formado (sem 3 partes)', (done) => {
      const req = makeReq({
        headers: { authorization: 'Bearer invalido' },
      })

      middleware.use(req, res, () => {
        expect(tenantStorage.getStore()?.tenantId).toBeUndefined()
        done()
      })
    })

    it('não deve extrair tenantId de JWT com payload inválido (base64 quebrado)', (done) => {
      const req = makeReq({
        headers: { authorization: 'Bearer header.!!!.sig' },
      })

      middleware.use(req, res, () => {
        expect(tenantStorage.getStore()?.tenantId).toBeUndefined()
        done()
      })
    })

    it('não deve extrair tenantId se o campo tenantId não for string', (done) => {
      const req = makeReq({
        headers: { authorization: makeJwtBearer({ tenantId: 12345 }) },
      })

      middleware.use(req, res, () => {
        expect(tenantStorage.getStore()?.tenantId).toBeUndefined()
        done()
      })
    })
  })

  describe('fallback: header x-tenant-id', () => {
    it('deve usar x-tenant-id quando não há Authorization header', (done) => {
      const req = makeReq({
        headers: { 'x-tenant-id': 'tenant-header-456' },
      })

      middleware.use(req, res, () => {
        expect(tenantStorage.getStore()?.tenantId).toBe('tenant-header-456')
        done()
      })
    })

    it('deve preferir JWT ao x-tenant-id quando ambos estão presentes', (done) => {
      const req = makeReq({
        headers: {
          authorization: makeJwtBearer({ tenantId: 'tenant-jwt-abc' }),
          'x-tenant-id': 'tenant-header-xyz',
        },
      })

      middleware.use(req, res, () => {
        expect(tenantStorage.getStore()?.tenantId).toBe('tenant-jwt-abc')
        done()
      })
    })

    it('não deve definir tenantId se nenhuma fonte estiver presente', (done) => {
      const req = makeReq({ headers: {} })

      middleware.use(req, res, () => {
        expect(tenantStorage.getStore()?.tenantId).toBeUndefined()
        done()
      })
    })
  })

  describe('extração de tenantSlug via subdomínio', () => {
    it('deve extrair tenantSlug de subdomínio personalizado', (done) => {
      const req = makeReq({ hostname: 'minha-empresa.zaptend.com.br', headers: {} })

      middleware.use(req, res, () => {
        expect(tenantStorage.getStore()?.tenantSlug).toBe('minha-empresa')
        done()
      })
    })

    it('não deve definir tenantSlug para subdomínio reservado "app"', (done) => {
      const req = makeReq({ hostname: 'app.zaptend.com.br', headers: {} })

      middleware.use(req, res, () => {
        expect(tenantStorage.getStore()?.tenantSlug).toBeUndefined()
        done()
      })
    })

    it('não deve definir tenantSlug para subdomínio reservado "admin"', (done) => {
      const req = makeReq({ hostname: 'admin.zaptend.com.br', headers: {} })

      middleware.use(req, res, () => {
        expect(tenantStorage.getStore()?.tenantSlug).toBeUndefined()
        done()
      })
    })

    it('não deve definir tenantSlug para "localhost"', (done) => {
      const req = makeReq({ hostname: 'localhost', headers: {} })

      middleware.use(req, res, () => {
        expect(tenantStorage.getStore()?.tenantSlug).toBeUndefined()
        done()
      })
    })

    it('deve definir tenantId via JWT e tenantSlug via subdomínio simultaneamente', (done) => {
      const req = makeReq({
        hostname: 'acme.zaptend.com.br',
        headers: { authorization: makeJwtBearer({ tenantId: 'tenant-acme-id' }) },
      })

      middleware.use(req, res, () => {
        const store = tenantStorage.getStore()
        expect(store?.tenantId).toBe('tenant-acme-id')
        expect(store?.tenantSlug).toBe('acme')
        done()
      })
    })
  })

  describe('isolamento de contexto (AsyncLocalStorage)', () => {
    it('deve isolar contextos entre requisições concorrentes', async () => {
      const results: Array<string | undefined> = []

      await Promise.all([
        new Promise<void>((resolve) =>
          middleware.use(
            makeReq({ headers: { authorization: makeJwtBearer({ tenantId: 'tenant-A' }) } }),
            res,
            () => {
              results[0] = tenantStorage.getStore()?.tenantId
              resolve()
            },
          ),
        ),
        new Promise<void>((resolve) =>
          middleware.use(
            makeReq({ headers: { authorization: makeJwtBearer({ tenantId: 'tenant-B' }) } }),
            res,
            () => {
              results[1] = tenantStorage.getStore()?.tenantId
              resolve()
            },
          ),
        ),
      ])

      expect(results[0]).toBe('tenant-A')
      expect(results[1]).toBe('tenant-B')
    })
  })
})
