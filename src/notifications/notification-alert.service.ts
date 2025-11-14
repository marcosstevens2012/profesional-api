import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { WebsocketService } from '../websocket/websocket.service';
import { EmailService } from './email.service';
import { PushNotificationService } from './push-notification.service';
import { WhatsAppService } from './whatsapp.service';

export interface BookingAlertOptions {
  bookingId: string;
  professionalUserId: string;
  professionalEmail: string;
  professionalPhone?: string;
  clientName: string;
  clientEmail: string;
  serviceDescription: string;
  amount: number;
  currency: string;
  scheduledAt: string;
  duration: number;
}

@Injectable()
export class NotificationAlertService {
  private readonly logger = new Logger(NotificationAlertService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly websocketService: WebsocketService,
    private readonly emailService: EmailService,
    private readonly whatsAppService: WhatsAppService,
    private readonly pushNotificationService: PushNotificationService,
  ) {}

  /**
   * Envía todas las alertas cuando se recibe un pago de booking
   */
  async sendBookingPaidAlerts(options: BookingAlertOptions) {
    const {
      bookingId,
      professionalUserId,
      professionalEmail,
      professionalPhone,
      clientName,
      serviceDescription,
      amount,
      currency,
      scheduledAt,
      duration,
    } = options;

    this.logger.log(`🚨 Sending all booking alerts for booking ${bookingId}`);

    const alertPromises: Promise<void>[] = [];

    // 1. Alerta WebSocket en tiempo real (inmediata)
    try {
      const alertData = {
        bookingId,
        clientName,
        clientEmail: options.clientEmail,
        serviceDescription,
        amount,
        currency,
        scheduledAt,
        duration,
        paymentId: `payment_${bookingId}`,
        timestamp: new Date().toISOString(),
        urgency: 'high' as const,
      };

      this.websocketService.emitBookingAlert(professionalUserId, alertData);
      this.logger.log('✅ WebSocket alert sent');
    } catch (error) {
      this.logger.error('❌ WebSocket alert failed:', error);
    }

    // 2. Email asíncrono
    alertPromises.push(
      this.emailService
        .sendBookingAlertEmail({
          to: professionalEmail,
          bookingId,
          clientName,
          serviceDescription,
          amount,
          currency,
          scheduledAt,
          duration,
        })
        .then(() => {})
        .catch((error) => {
          this.logger.error('❌ Email alert failed:', error);
        }),
    );

    // 3. WhatsApp asíncrono (si tiene número)
    if (professionalPhone) {
      alertPromises.push(
        this.whatsAppService
          .sendBookingAlert({
            phone: professionalPhone,
            bookingId,
            clientName,
            serviceDescription,
            amount,
            currency,
            scheduledAt,
          })
          .catch((error) => {
            this.logger.error('❌ WhatsApp alert failed:', error);
          }),
      );
    }

    // 4. Push notification asíncrona
    alertPromises.push(
      this.pushNotificationService
        .sendBookingAlert({
          userId: professionalUserId,
          bookingId,
          clientName,
          serviceDescription,
          amount,
          currency,
        })
        .then(() => {})
        .catch((error) => {
          this.logger.error('❌ Push notification failed:', error);
        }),
    );

    // Ejecutar todas las notificaciones en paralelo
    await Promise.allSettled(alertPromises);

    this.logger.log(`🎯 All booking alerts sent for booking ${bookingId}`);
  }

  /**
   * Alerta cuando el profesional acepta el booking
   */
  async sendBookingAcceptedAlerts(bookingId: string, clientUserId: string) {
    this.logger.log(`✅ Sending booking accepted alerts for booking ${bookingId}`);

    try {
      // Obtener detalles del booking
      const booking = await this.prisma.booking.findUniqueOrThrow({
        where: { id: bookingId },
        include: {
          client: true,
          professional: {
            include: { user: true },
          },
        },
      });

      // WebSocket inmediato
      this.websocketService.emitBookingAccepted(clientUserId, {
        bookingId,
        professionalName: booking.professional.name,
        jitsiRoom: booking.jitsiRoom,
        message: 'Tu consulta ha sido aceptada',
      });

      // Email de confirmación
      await this.emailService.sendBookingConfirmationEmail({
        to: booking.client.email,
        clientName: booking.client.name || 'Cliente',
        professionalName: booking.professional.name || 'Profesional',
        scheduledAt: booking.scheduledAt.toISOString(),
        jitsiRoom: booking.jitsiRoom || '',
        bookingId,
      });

      this.logger.log(`✅ Booking accepted alerts sent for ${bookingId}`);
    } catch (error) {
      this.logger.error('❌ Failed to send booking accepted alerts:', error);
    }
  }
}
