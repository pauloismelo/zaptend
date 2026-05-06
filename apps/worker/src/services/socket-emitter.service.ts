import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { io, Socket } from 'socket.io-client'

@Injectable()
export class SocketEmitterService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SocketEmitterService.name)
  private socket!: Socket

  onModuleInit() {
    const wsUrl = process.env.INTERNAL_WS_URL ?? 'http://localhost:3001'

    this.socket = io(wsUrl, {
      auth: { workerSecret: process.env.WORKER_SECRET ?? '' },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10_000,
    })

    this.socket.on('connect', () => {
      this.logger.log(`Socket.io conectado ao servidor da API: ${wsUrl}`)
    })

    this.socket.on('disconnect', (reason) => {
      this.logger.warn(`Socket.io desconectado: ${reason}`)
    })

    this.socket.on('connect_error', (err) => {
      this.logger.error(`Erro de conexão Socket.io: ${err.message}`)
    })
  }

  onModuleDestroy() {
    this.socket?.disconnect()
  }

  /**
   * Emite um evento para a room do tenant via o servidor Socket.io da API.
   * A API deve escutar 'worker:emit' e retransmitir para a room do tenant.
   */
  emitToTenant(tenantId: string, event: string, data: unknown): void {
    if (!this.socket?.connected) {
      this.logger.warn(`Socket desconectado — evento '${event}' não enviado ao tenant ${tenantId}`)
      return
    }

    this.socket.emit('worker:emit', { tenantId, event, data })
    this.logger.debug(`Evento '${event}' emitido para tenant ${tenantId}`)
  }
}
