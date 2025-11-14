import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

export interface WhatsAppBookingAlertOptions {
  phone: string;
  bookingId: string;
  clientName: string;
  serviceDescription: string;
  amount: number;
  currency: string;
  scheduledAt: string;
}

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private kapsoClient: AxiosInstance;

  constructor() {
    this.kapsoClient = axios.create({
      baseURL: process.env.KAPSO_API_URL || 'https://api.kapso.com/v1',
      headers: {
        Authorization: `Bearer ${process.env.KAPSO_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Envía alerta por WhatsApp al profesional cuando recibe un booking pagado
   */
  async sendBookingAlert(options: WhatsAppBookingAlertOptions) {
    const { phone, bookingId, clientName, serviceDescription, amount, currency, scheduledAt } =
      options;

    try {
      // Formatear número de teléfono (remover caracteres especiales y agregar código de país si es necesario)
      const formattedPhone = this.formatPhoneNumber(phone);

      const scheduledDate = new Date(scheduledAt);
      const formattedDate = scheduledDate.toLocaleDateString('es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
      });

      const message = `🚨 *NUEVA CONSULTA PAGADA* 🚨

¡Tienes una nueva solicitud de consulta!

👤 *Cliente:* ${clientName}
📋 *Servicio:* ${serviceDescription}
💰 *Pago:* $${amount} ${currency}
📅 *Fecha:* ${formattedDate}

⏰ *ACCIÓN REQUERIDA*
Debes aceptar esta consulta en las próximas 2 horas.

🎯 Acepta aquí: ${process.env.FRONTEND_URL}/panel/professional-dashboard

_ID de Reserva: ${bookingId}_`;

      const response = await this.kapsoClient.post('/messages/send', {
        to: formattedPhone,
        type: 'text',
        text: {
          body: message,
        },
        messaging_product: 'whatsapp',
      });

      this.logger.log(`✅ WhatsApp booking alert sent to ${formattedPhone}`, {
        bookingId,
        messageId: response.data?.messages?.[0]?.id,
        phone: formattedPhone,
      });

      return response.data;
    } catch (error) {
      this.logger.error(`❌ Failed to send WhatsApp booking alert to ${phone}:`, error);

      // Agregar detalles específicos del error si está disponible
      if (
        error instanceof Error &&
        'response' in error &&
        error.response &&
        typeof error.response === 'object' &&
        'data' in error.response
      ) {
        this.logger.error('Kapso API Error Details:', (error.response as any).data);
      }
      throw error;
    }
  }

  /**
   * Envía confirmación por WhatsApp al cliente cuando el profesional acepta
   */
  async sendBookingConfirmation(options: {
    phone: string;
    clientName: string;
    professionalName: string;
    scheduledAt: string;
    bookingId: string;
  }) {
    const { phone, clientName, professionalName, scheduledAt, bookingId } = options;

    try {
      const formattedPhone = this.formatPhoneNumber(phone);

      const scheduledDate = new Date(scheduledAt);
      const formattedDate = scheduledDate.toLocaleDateString('es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
      });

      const message = `✅ *CONSULTA CONFIRMADA* ✅

¡Hola ${clientName}!

Tu consulta ha sido confirmada:

👨‍⚕️ *Profesional:* ${professionalName}
📅 *Fecha:* ${formattedDate}

📹 Podrás acceder a la videollamada 10 minutos antes de la hora programada.

🔗 Accede aquí: ${process.env.FRONTEND_URL}/bookings/${bookingId}

Te enviaremos un recordatorio 30 minutos antes.

_ID de Reserva: ${bookingId}_`;

      const response = await this.kapsoClient.post('/messages/send', {
        to: formattedPhone,
        type: 'text',
        text: {
          body: message,
        },
        messaging_product: 'whatsapp',
      });

      this.logger.log(`✅ WhatsApp booking confirmation sent to ${formattedPhone}`, {
        bookingId,
        messageId: response.data?.messages?.[0]?.id,
      });

      return response.data;
    } catch (error) {
      this.logger.error(`❌ Failed to send WhatsApp booking confirmation to ${phone}:`, error);
      throw error;
    }
  }

  /**
   * Envía recordatorio por WhatsApp antes de la consulta
   */
  async sendBookingReminder(options: {
    phone: string;
    name: string;
    professionalName: string;
    scheduledAt: string;
    bookingId: string;
    minutesBefore: number;
  }) {
    const { phone, name, professionalName, scheduledAt, bookingId, minutesBefore } = options;

    try {
      const formattedPhone = this.formatPhoneNumber(phone);

      const scheduledDate = new Date(scheduledAt);
      const formattedDate = scheduledDate.toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
      });

      const message = `⏰ *RECORDATORIO DE CONSULTA* ⏰

¡Hola ${name}!

Tu consulta con ${professionalName} comienza en ${minutesBefore} minutos (${formattedDate}).

📹 Accede ya a la videollamada:
${process.env.FRONTEND_URL}/bookings/${bookingId}/meeting

💡 *Consejos:*
- Verifica tu conexión a internet
- Ten tus documentos listos
- Encuentra un lugar tranquilo

¡Nos vemos en la consulta!

_ID: ${bookingId}_`;

      const response = await this.kapsoClient.post('/messages/send', {
        to: formattedPhone,
        type: 'text',
        text: {
          body: message,
        },
        messaging_product: 'whatsapp',
      });

      this.logger.log(`✅ WhatsApp booking reminder sent to ${formattedPhone}`, {
        bookingId,
        messageId: response.data?.messages?.[0]?.id,
        minutesBefore,
      });

      return response.data;
    } catch (error) {
      this.logger.error(`❌ Failed to send WhatsApp booking reminder to ${phone}:`, error);
      throw error;
    }
  }

  /**
   * Formatea número de teléfono para WhatsApp
   * Asume números argentinos por defecto
   */
  private formatPhoneNumber(phone: string): string {
    // Remover espacios, guiones y paréntesis
    let cleanPhone = phone.replace(/[\s\-\(\)]/g, '');

    // Remover signos + al inicio
    cleanPhone = cleanPhone.replace(/^\+/, '');

    // Si empieza con 549, ya tiene código de país argentino
    if (cleanPhone.startsWith('549')) {
      return cleanPhone;
    }

    // Si empieza con 54, agregar 9
    if (cleanPhone.startsWith('54')) {
      return `549${cleanPhone.slice(2)}`;
    }

    // Si empieza con 9 y tiene 10-11 dígitos, agregar código de país
    if (cleanPhone.startsWith('9') && cleanPhone.length >= 10) {
      return `54${cleanPhone}`;
    }

    // Si no tiene código de país y empieza con área (11, 221, etc.), agregar código completo
    if (cleanPhone.match(/^(11|221|223|261|341|351|381)\d{7,8}$/)) {
      return `549${cleanPhone}`;
    }

    // Por defecto, asumir que es número argentino sin código
    return `549${cleanPhone}`;
  }

  /**
   * Verifica el estado de un mensaje enviado
   */
  async getMessageStatus(messageId: string) {
    try {
      const response = await this.kapsoClient.get(`/messages/${messageId}/status`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get message status for ${messageId}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene información sobre la configuración de WhatsApp Business
   */
  async getBusinessInfo() {
    try {
      const response = await this.kapsoClient.get('/business/info');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get business info:', error);
      throw error;
    }
  }
}
