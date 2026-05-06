import { AsyncLocalStorage } from 'async_hooks'

interface TenantStore {
  tenantId?: string
  tenantSlug?: string
}

export const tenantStorage = new AsyncLocalStorage<TenantStore>()

export class TenantContext {
  static get(): TenantStore | undefined {
    return tenantStorage.getStore()
  }

  static getTenantId(): string | undefined {
    return tenantStorage.getStore()?.tenantId
  }

  static getTenantSlug(): string | undefined {
    return tenantStorage.getStore()?.tenantSlug
  }

  static requireTenantId(): string {
    const id = tenantStorage.getStore()?.tenantId
    if (!id) throw new Error('TenantId não encontrado no contexto da requisição')
    return id
  }
}
