import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class WebsocketService {
  private server: Server;
  private readonly logger = new Logger(WebsocketService.name);

  // Map para mantener conexiones de usuarios activos
  private userConnections: Map<string, Set<string>> = new Map();

  setServer(server: Server) {
    this.server = server;
  }

  /**
   * Registra una nueva conexión de usuario
   */
  addUserConnection(userId: string, socketId: string) {
    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Set());
    }
    this.userConnections.get(userId)!.add(socketId);

    this.logger.log(`User ${userId} connected with socket ${socketId}`);
    this.logger.log(
      `Total connections for user ${userId}: ${this.userConnections.get(userId)!.size}`,
    );
  }

  /**
   * Remueve una conexión de usuario
   */
  removeUserConnection(userId: string, socketId: string) {
    const connections = this.userConnections.get(userId);
    if (connections) {
      connections.delete(socketId);
      if (connections.size === 0) {
        this.userConnections.delete(userId);
        this.logger.log(`User ${userId} disconnected completely`);
      } else {
        this.logger.log(`User ${userId} has ${connections.size} connections remaining`);
      }
    }
  }

  /**
   * Verifica si un usuario está conectado
   */
  isUserConnected(userId: string): boolean {
    const connections = this.userConnections.get(userId);
    return connections ? connections.size > 0 : false;
  }

  /**
   * Emite notificación de nuevo booking pagado al profesional
   */
  emitBookingAlert(professionalId: string, alertData: BookingAlertData) {
    if (!this.server) {
      this.logger.warn('WebSocket server not initialized');
      return;
    }

    const connections = this.userConnections.get(professionalId);
    if (!connections || connections.size === 0) {
      this.logger.warn(`Professional ${professionalId} not connected`);
      return;
    }

    // Emitir a todas las conexiones del profesional
    connections.forEach((socketId) => {
      this.server.to(socketId).emit('new_booking_alert', alertData);
    });

    this.logger.log(
      `Booking alert sent to professional ${professionalId} (${connections.size} connections)`,
    );
  }

  /**
   * Emite notificación general a un usuario
   */
  emitNotification(userId: string, notification: NotificationData) {
    if (!this.server) {
      this.logger.warn('WebSocket server not initialized');
      return;
    }

    const connections = this.userConnections.get(userId);
    if (!connections || connections.size === 0) {
      this.logger.warn(`User ${userId} not connected`);
      return;
    }

    connections.forEach((socketId) => {
      this.server.to(socketId).emit('notification', notification);
    });

    this.logger.log(`Notification sent to user ${userId}`);
  }

  /**
   * Emite actualización cuando un booking es aceptado
   */
  emitBookingAccepted(clientId: string, bookingData: Record<string, unknown>) {
    if (!this.server) return;

    const connections = this.userConnections.get(clientId);
    if (connections && connections.size > 0) {
      connections.forEach((socketId) => {
        this.server.to(socketId).emit('booking_accepted', bookingData);
      });
      this.logger.log(`Booking accepted notification sent to client ${clientId}`);
    }
  }

  /**
   * Obtiene estadísticas de conexiones activas
   */
  getConnectionStats() {
    const totalUsers = this.userConnections.size;
    const totalConnections = Array.from(this.userConnections.values()).reduce(
      (total, connections) => total + connections.size,
      0,
    );

    return {
      totalUsers,
      totalConnections,
      users: Object.fromEntries(
        Array.from(this.userConnections.entries()).map(([userId, connections]) => [
          userId,
          connections.size,
        ]),
      ),
    };
  }
}

export interface BookingAlertData {
  bookingId: string;
  clientName: string;
  clientEmail: string;
  serviceDescription: string;
  amount: number;
  currency: string;
  scheduledAt: string;
  duration: number;
  paymentId: string;
  timestamp: string;
  urgency: 'high' | 'normal';
}

export interface NotificationData {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  timestamp: string;
}
