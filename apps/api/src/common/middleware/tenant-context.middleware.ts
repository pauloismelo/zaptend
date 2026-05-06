import { Injectable, NestMiddleware } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import { tenantStorage } from '../context/tenant.context'

const RESERVED_SUBDOMAINS = new Set(['app', 'admin', 'api', 'www', 'localhost'])

function extractTenantIdFromJwt(authHeader: string | undefined): string | undefined {
  if (!authHeader?.startsWith('Bearer ')) return undefined
  try {
    const parts = authHeader.slice(7).split('.')
    if (parts.length !== 3) return undefined
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'))
    return typeof payload.tenantId === 'string' ? payload.tenantId : undefined
  } catch {
    return undefined
  }
}

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const store: { tenantId?: string; tenantSlug?: string } = {}

    // 1. Extract tenantId from JWT payload (signature verified by JwtAuthGuard)
    const jwtTenantId = extractTenantIdFromJwt(req.headers['authorization'])
    if (jwtTenantId) {
      store.tenantId = jwtTenantId
    }

    // 2. Fallback: x-tenant-id header (webhooks sem JWT, ex: Meta Cloud API)
    if (!store.tenantId) {
      const headerTenantId = req.headers['x-tenant-id'] as string | undefined
      if (headerTenantId) store.tenantId = headerTenantId
    }

    // 3. tenantSlug via subdomínio
    const subdomain = req.hostname?.split('.')[0]
    if (subdomain && !RESERVED_SUBDOMAINS.has(subdomain)) {
      store.tenantSlug = subdomain
    }

    tenantStorage.run(store, () => next())
  }
}
