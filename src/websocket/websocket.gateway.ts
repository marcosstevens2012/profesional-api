import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WebsocketService } from './websocket.service';

@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:3000',
      'https://profesional-frontend.vercel.app',
      process.env.FRONTEND_URL,
    ].filter(Boolean),
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket'],
  allowEIO3: true,
})
@Injectable()
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(WebsocketGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly websocketService: WebsocketService,
  ) {}

  afterInit() {
    this.websocketService.setServer(this.server);
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: Socket) {
    try {
      // Extraer token del query o headers
      const token =
        (client.handshake.query.token as string) ||
        (client.handshake.auth.token as string) ||
        client.request.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.disconnect();
        return;
      }

      // Verificar y decodificar token
      const payload = this.jwtService.verify(token);
      const userId = payload.sub || payload.userId;

      if (!userId) {
        this.logger.warn(`Invalid token payload for client ${client.id}`);
        client.disconnect();
        return;
      }

      // Almacenar datos del usuario en el socket
      client.data.userId = userId;
      client.data.userEmail = payload.email;
      client.data.userRole = payload.role;

      // Registrar conexión
      this.websocketService.addUserConnection(userId, client.id);

      // Unirse a sala personal del usuario
      await client.join(`user_${userId}`);

      // Si es profesional, unirse a sala de profesionales
      if (payload.role === 'PROFESSIONAL') {
        await client.join('professionals');
      }

      this.logger.log(`User ${userId} (${payload.email}) connected with socket ${client.id}`);

      // Enviar confirmación de conexión
      client.emit('connection_confirmed', {
        message: 'Connected successfully',
        userId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`Error handling connection for client ${client.id}:`, error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const { userId } = client.data;

    if (userId) {
      this.websocketService.removeUserConnection(userId, client.id);
      this.logger.log(`User ${userId} disconnected (socket: ${client.id})`);
    } else {
      this.logger.log(`Unknown client disconnected (socket: ${client.id})`);
    }
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(client: Socket, roomName: string) {
    client.join(roomName);
    this.logger.log(`Client ${client.id} joined room: ${roomName}`);
    return { success: true, room: roomName };
  }

  @SubscribeMessage('leave_room')
  handleLeaveRoom(client: Socket, roomName: string) {
    client.leave(roomName);
    this.logger.log(`Client ${client.id} left room: ${roomName}`);
    return { success: true, room: roomName };
  }

  @SubscribeMessage('ping')
  handlePing(client: Socket) {
    return {
      pong: true,
      timestamp: new Date().toISOString(),
      userId: client.data.userId,
    };
  }

  @SubscribeMessage('accept_booking')
  async handleAcceptBooking(
    client: Socket,
    data: { bookingId: string; response: 'accept' | 'reject' },
  ) {
    const { userId } = client.data;

    if (!userId) {
      client.emit('error', { message: 'Unauthorized' });
      return;
    }

    try {
      // Aquí irá la lógica para aceptar el booking
      // Por ahora solo confirmamos la recepción
      client.emit('booking_response_received', {
        bookingId: data.bookingId,
        response: data.response,
        timestamp: new Date().toISOString(),
      });

      this.logger.log(
        `Professional ${userId} ${data.response === 'accept' ? 'accepted' : 'rejected'} booking ${data.bookingId}`,
      );

      return { success: true, action: data.response };
    } catch (error) {
      this.logger.error('Error handling booking response:', error);
      client.emit('error', { message: 'Error processing booking response' });
      return { success: false, error: 'Processing error' };
    }
  }

  /**
   * Método para obtener estadísticas de conexiones (debug)
   */
  @SubscribeMessage('get_stats')
  handleGetStats() {
    // Solo permitir a administradores o para debug
    return this.websocketService.getConnectionStats();
  }
}
