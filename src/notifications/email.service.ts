import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

export interface BookingAlertEmailOptions {
  to: string;
  bookingId: string;
  clientName: string;
  serviceDescription: string;
  amount: number;
  currency: string;
  scheduledAt: string;
  duration: number;
}

export interface BookingConfirmationEmailOptions {
  to: string;
  clientName: string;
  professionalName: string;
  scheduledAt: string;
  jitsiRoom: string;
  bookingId: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  /**
   * Envía email de alerta al profesional cuando recibe un nuevo booking pagado
   */
  async sendBookingAlertEmail(options: BookingAlertEmailOptions) {
    const {
      to,
      bookingId,
      clientName,
      serviceDescription,
      amount,
      currency,
      scheduledAt,
      duration,
    } = options;

    try {
      const scheduledDate = new Date(scheduledAt);
      const formattedDate = scheduledDate.toLocaleDateString('es-AR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      const emailHtml = `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🚨 Nueva Consulta Pagada</h1>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e1e1e1;">
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
              <h2 style="color: #333; margin: 0 0 15px 0;">¡Tienes una nueva solicitud de consulta!</h2>
              <p style="color: #666; margin: 0; font-size: 16px;">El cliente ya realizó el pago. Acepta la consulta para confirmar la cita.</p>
            </div>

            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #856404; margin: 0 0 10px 0;">⏰ Acción Requerida</h3>
              <p style="color: #856404; margin: 0;">Debes aceptar esta consulta dentro de las próximas 2 horas para confirmar la cita.</p>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
              <div>
                <h3 style="color: #333; margin: 0 0 10px 0;">👤 Cliente</h3>
                <p style="color: #666; margin: 0; font-size: 16px; font-weight: bold;">${clientName}</p>
              </div>
              <div>
                <h3 style="color: #333; margin: 0 0 10px 0;">💰 Pago</h3>
                <p style="color: #28a745; margin: 0; font-size: 18px; font-weight: bold;">$${amount} ${currency}</p>
              </div>
            </div>

            <div style="margin: 20px 0;">
              <h3 style="color: #333; margin: 0 0 10px 0;">📅 Fecha y Hora</h3>
              <p style="color: #666; margin: 0; font-size: 16px;">${formattedDate}</p>
              <p style="color: #888; margin: 5px 0 0 0; font-size: 14px;">Duración: ${duration} minutos</p>
            </div>

            <div style="margin: 20px 0;">
              <h3 style="color: #333; margin: 0 0 10px 0;">📝 Servicio</h3>
              <p style="color: #666; margin: 0; font-size: 16px;">${serviceDescription}</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/panel/professional-dashboard" 
                 style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
                🎯 Aceptar Consulta
              </a>
            </div>

            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 20px;">
              <p style="color: #666; margin: 0; font-size: 14px; text-align: center;">
                ID de Reserva: <strong>${bookingId}</strong>
              </p>
            </div>
          </div>

          <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e1e1e1;">
            <p style="color: #666; margin: 0; font-size: 12px;">
              Este es un email automático. No respondas a este mensaje.
            </p>
          </div>
        </div>
      `;

      const result = await this.resend.emails.send({
        from: process.env.FROM_EMAIL || 'notificaciones@profesional.app',
        to: [to],
        subject: '🚨 Nueva Consulta Pagada - Acción Requerida',
        html: emailHtml,
        tags: [
          { name: 'category', value: 'booking-alert' },
          { name: 'booking-id', value: bookingId },
        ],
      });

      this.logger.log(`✅ Booking alert email sent to ${to}`, {
        bookingId,
        emailId: result.data?.id,
      });

      return result;
    } catch (error) {
      this.logger.error(`❌ Failed to send booking alert email to ${to}:`, error);
      throw error;
    }
  }

  /**
   * Envía email de confirmación al cliente cuando el profesional acepta
   */
  async sendBookingConfirmationEmail(options: BookingConfirmationEmailOptions) {
    const { to, clientName, professionalName, scheduledAt, jitsiRoom, bookingId } = options;

    try {
      const scheduledDate = new Date(scheduledAt);
      const formattedDate = scheduledDate.toLocaleDateString('es-AR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      const emailHtml = `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">✅ Consulta Confirmada</h1>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e1e1e1;">
            <div style="background: #d4edda; padding: 20px; border-radius: 10px; margin-bottom: 20px; border: 1px solid #c3e6cb;">
              <h2 style="color: #155724; margin: 0 0 15px 0;">¡Tu consulta ha sido confirmada!</h2>
              <p style="color: #155724; margin: 0; font-size: 16px;">${professionalName} ha aceptado tu solicitud de consulta.</p>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
              <div>
                <h3 style="color: #333; margin: 0 0 10px 0;">👨‍⚕️ Profesional</h3>
                <p style="color: #666; margin: 0; font-size: 16px; font-weight: bold;">${professionalName}</p>
              </div>
              <div>
                <h3 style="color: #333; margin: 0 0 10px 0;">📅 Fecha y Hora</h3>
                <p style="color: #666; margin: 0; font-size: 16px;">${formattedDate}</p>
              </div>
            </div>

            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #856404; margin: 0 0 10px 0;">🔗 Acceso a la Videollamada</h3>
              <p style="color: #856404; margin: 0 0 10px 0;">Sala: <strong>${jitsiRoom}</strong></p>
              <p style="color: #856404; margin: 0; font-size: 14px;">Podrás acceder 10 minutos antes de la hora programada.</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/bookings/${bookingId}" 
                 style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
                📹 Ir a mi Consulta
              </a>
            </div>

            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
              <h4 style="color: #333; margin: 0 0 10px 0;">📋 Próximos Pasos:</h4>
              <ul style="color: #666; margin: 0; padding-left: 20px;">
                <li>Te enviaremos un recordatorio 30 minutos antes</li>
                <li>Asegúrate de tener una conexión estable a internet</li>
                <li>Prepara cualquier documentación relevante</li>
              </ul>
            </div>
          </div>

          <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e1e1e1;">
            <p style="color: #666; margin: 0; font-size: 12px;">
              ID de Reserva: ${bookingId} | Este es un email automático.
            </p>
          </div>
        </div>
      `;

      const result = await this.resend.emails.send({
        from: process.env.FROM_EMAIL || 'confirmaciones@profesional.app',
        to: [to],
        subject: `✅ Consulta confirmada con ${professionalName}`,
        html: emailHtml,
        tags: [
          { name: 'category', value: 'booking-confirmation' },
          { name: 'booking-id', value: bookingId },
        ],
      });

      this.logger.log(`✅ Booking confirmation email sent to ${to}`, {
        bookingId,
        emailId: result.data?.id,
      });

      return result;
    } catch (error) {
      this.logger.error(`❌ Failed to send booking confirmation email to ${to}:`, error);
      throw error;
    }
  }
}
