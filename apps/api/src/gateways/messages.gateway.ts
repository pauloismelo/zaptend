import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets'
import { Logger, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Server, Socket } from 'socket.io'
import { JwtPayload } from '@zaptend/types'

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
})
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server

  private readonly logger = new Logger(MessagesGateway.name)

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const workerSecret = (client.handshake.auth as Record<string, string>)?.workerSecret
      if (workerSecret && workerSecret === (process.env.WORKER_SECRET ?? '')) {
        client.data.worker = true
        this.logger.log(`Worker ${client.id} conectado`)
        return
      }

      const token =
        (client.handshake.auth as Record<string, string>)?.token ??
        client.handshake.headers?.authorization?.replace('Bearer ', '')

      if (!token) {
        throw new UnauthorizedException('Token não fornecido')
      }

      const payload = this.jwtService.verify<JwtPayload>(token)
      client.data.user = payload
      client.join(`tenant:${payload.tenantId}`)
      if (['supervisor', 'admin', 'owner'].includes(payload.role)) {
        client.join(`tenant:${payload.tenantId}:supervisors`)
      }

      this.logger.log(`Cliente ${client.id} conectado — tenant ${payload.tenantId}`)
    } catch {
      client.disconnect()
      this.logger.warn(`Conexão recusada para cliente ${client.id}: token inválido`)
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente ${client.id} desconectado`)
  }

  @SubscribeMessage('room:join')
  handleRoomJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tenantId: string },
  ) {
    const user = client.data.user as JwtPayload
    if (user?.tenantId !== data.tenantId) return
    client.join(`tenant:${data.tenantId}`)
  }

  @SubscribeMessage('room:leave')
  handleRoomLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tenantId: string },
  ) {
    client.leave(`tenant:${data.tenantId}`)
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const user = client.data.user as JwtPayload
    client.to(`tenant:${user.tenantId}`).emit('user:typing', {
      conversationId: data.conversationId,
      userId: user.sub,
      isTyping: true,
    })
  }

  @SubscribeMessage('worker:emit')
  handleWorkerEmit(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tenantId: string; event: string; data: unknown },
  ) {
    if (!client.data.worker) return
    const room = data.event === 'supervisor:alert'
      ? `tenant:${data.tenantId}:supervisors`
      : `tenant:${data.tenantId}`
    this.server.to(room).emit(data.event, data.data)
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const user = client.data.user as JwtPayload
    client.to(`tenant:${user.tenantId}`).emit('user:typing', {
      conversationId: data.conversationId,
      userId: user.sub,
      isTyping: false,
    })
  }

  emitConversationNew(tenantId: string, conversation: Record<string, unknown>) {
    this.server.to(`tenant:${tenantId}`).emit('conversation:new', { conversation })
  }

  emitMessageNew(tenantId: string, conversationId: string, message: Record<string, unknown>) {
    this.server.to(`tenant:${tenantId}`).emit('message:new', { conversationId, message })
  }

  emitConversationUpdated(
    tenantId: string,
    conversationId: string,
    changes: Record<string, unknown>,
  ) {
    this.server.to(`tenant:${tenantId}`).emit('conversation:updated', { conversationId, changes })
  }

  emitMessageStatus(tenantId: string, messageId: string, status: string) {
    this.server.to(`tenant:${tenantId}`).emit('message:status', { messageId, status })
  }
}
