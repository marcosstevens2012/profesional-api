import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface PushNotificationOptions {
  userId: string;
  bookingId: string;
  clientName: string;
  serviceDescription: string;
  amount: number;
  currency: string;
}

@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Envía notificación push al profesional sobre nuevo booking
   * Por ahora almacena en BD para ser enviada por el frontend
   */
  async sendBookingAlert(options: PushNotificationOptions) {
    const { userId, bookingId, clientName, serviceDescription, amount, currency } = options;

    try {
      // Crear notificación en base de datos que será polling por el frontend
      const notification = await this.prisma.notification.create({
        data: {
          userId,
          type: 'BOOKING_REQUEST',
          title: '🚨 Nueva Consulta Pagada',
          message: `${clientName} ha pagado $${amount} ${currency} por: ${serviceDescription}`,
          payload: {
            bookingId,
            clientName,
            amount: amount.toString(),
            currency,
            action: 'booking_alert',
            urgent: true,
            sound: 'booking-alert',
            requiresAction: true,
            actionUrl: `${process.env.FRONTEND_URL}/panel/professional-dashboard`,
          },
        },
      });

      this.logger.log(`✅ Push notification created for user ${userId}`, {
        notificationId: notification.id,
        bookingId,
      });

      // Aquí podrías integrar con servicios como Firebase FCM, OneSignal, etc.
      // await this.sendFCMNotification(userId, {
      //   title: '🚨 Nueva Consulta Pagada',
      //   body: `${clientName} ha pagado $${amount} ${currency}`,
      //   data: { bookingId, type: 'booking_alert' }
      // });

      return { success: true, notificationId: notification.id };
    } catch (error) {
      this.logger.error(`❌ Failed to send push notification to user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Registra un token de push notification para un usuario
   * (Para implementación futura con FCM)
   */
  async registerPushToken(userId: string, token: string, deviceType: 'web' | 'ios' | 'android') {
    try {
      // Aquí guardarías el token en la base de datos
      // y lo asociarías con el usuario para envío de notificaciones

      this.logger.log(`📱 Push token registered for user ${userId}`, {
        deviceType,
        tokenPreview: `${token.substring(0, 20)}...`,
      });

      return { success: true };
    } catch (error) {
      this.logger.error(`❌ Failed to register push token for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Ejemplo de integración con Firebase FCM
   * (Descomentar cuando tengas configurado Firebase)
   */
  // private async sendFCMNotification(userId: string, payload: {
  //   title: string;
  //   body: string;
  //   data: Record<string, string>;
  // }) {
  //   try {
  //     // Obtener tokens del usuario
  //     const tokens = await this.getUserPushTokens(userId);
  //
  //     if (tokens.length === 0) {
  //       this.logger.warn(`No push tokens found for user ${userId}`);
  //       return;
  //     }

  //     const message = {
  //       notification: {
  //         title: payload.title,
  //         body: payload.body,
  //       },
  //       data: payload.data,
  //       tokens,
  //     };

  //     const response = await admin.messaging().sendMulticast(message);
  //     this.logger.log(`FCM notification sent`, {
  //       successCount: response.successCount,
  //       failureCount: response.failureCount,
  //     });

  //     return response;
  //   } catch (error) {
  //     this.logger.error('Failed to send FCM notification:', error);
  //     throw error;
  //   }
  // }
}
