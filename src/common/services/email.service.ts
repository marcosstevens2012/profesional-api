import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { EmailConfig } from '../../config/email.config';

export interface SendEmailParams {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly emailConfig: EmailConfig;
  private readonly resend: Resend | null;

  constructor(configService: ConfigService) {
    this.emailConfig = configService.get<EmailConfig>('email')!;

    // Inicializar Resend solo si tenemos API key y no estamos en modo mock
    if (this.emailConfig.resendApiKey && !this.emailConfig.useMock) {
      this.resend = new Resend(this.emailConfig.resendApiKey);
      this.logger.log('✅ Resend email service initialized');
    } else {
      this.resend = null;
      this.logger.warn('⚠️  Using MOCK email service (set RESEND_API_KEY to use real emails)');
    }
  }

  /**
   * Send email using Resend or mock implementation
   */
  async sendEmail(params: SendEmailParams): Promise<void> {
    const { to, subject, html, text } = params;

    // Si estamos usando mock o no hay Resend configurado
    if (!this.resend || this.emailConfig.useMock) {
      return this.sendMockEmail(params);
    }

    try {
      // Preparar payload para Resend
      const emailPayload = {
        from: this.emailConfig.from,
        to: [to],
        subject,
        html: html || '',
        text: text || '',
      };

      const { data, error } = await this.resend.emails.send(emailPayload);

      if (error) {
        this.logger.error(`❌ Error sending email via Resend:`, error);
        throw new Error(`Failed to send email: ${error.message}`);
      }

      this.logger.log(`✅ Email sent successfully via Resend to ${to} (ID: ${data?.id})`);
    } catch (error) {
      this.logger.error(`❌ Failed to send email via Resend:`, error);
      throw error;
    }
  }

  /**
   * Mock email implementation for development
   */
  private async sendMockEmail(params: SendEmailParams): Promise<void> {
    const { to, subject, html, text } = params;

    this.logger.log(`📧 [MOCK EMAIL] Sending email:`);
    this.logger.log(`   To: ${to}`);
    this.logger.log(`   Subject: ${subject}`);
    this.logger.log(`   From: ${this.emailConfig.from}`);
    if (html) {
      this.logger.log(`   HTML Content: ${html.substring(0, 200)}...`);
    }
    if (text) {
      this.logger.log(`   Text Content: ${text.substring(0, 200)}...`);
    }

    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  /**
   * Send email verification
   */
  async sendEmailVerification(email: string, token: string, userRole?: string): Promise<void> {
    const verificationUrl = `${this.emailConfig.baseUrl}/verificar-email?token=${token}`;

    const isProfessional = userRole?.toUpperCase() === 'PROFESSIONAL';
    const greeting = isProfessional
      ? '¡Bienvenido/a a Profesional!'
      : '¡Bienvenido/a a Profesional!';
    const message = isProfessional
      ? 'Gracias por registrarte como profesional. Para comenzar a ofrecer tus servicios, primero necesitamos verificar tu dirección de email.'
      : 'Gracias por registrarte. Para completar tu registro, necesitamos verificar tu dirección de email.';

    await this.sendEmail({
      to: email,
      subject: 'Verificá tu email - Profesional',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #007bff; margin-bottom: 20px;">${greeting}</h1>
            <p style="font-size: 16px; color: #333; line-height: 1.6;">${message}</p>
            <div style="text-align: center; margin: 40px 0;">
              <a href="${verificationUrl}"
                 style="background-color: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">
                Verificar Email
              </a>
            </div>
            <div style="background-color: #f0f8ff; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; color: #555;">
                <strong>Importante:</strong> Este enlace expira en 24 horas.
              </p>
            </div>
            <p style="font-size: 14px; color: #666;">Si no podés hacer click en el botón, copiá y pegá este enlace en tu navegador:</p>
            <p style="word-break: break-all; font-size: 12px; color: #007bff;"><a href="${verificationUrl}">${verificationUrl}</a></p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="font-size: 12px; color: #999; text-align: center;">
              Si no creaste esta cuenta, podés ignorar este email.
            </p>
          </div>
        </div>
      `,
      text: `${greeting}

${message}

Para completar tu registro, verificá tu email haciendo click en este enlace: ${verificationUrl}

Este enlace expira en 24 horas.

Si no podés acceder al enlace, copiá y pegá la siguiente URL en tu navegador:
${verificationUrl}

Si no creaste esta cuenta, podés ignorar este email.`,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(email: string, token: string): Promise<void> {
    const resetUrl = `${this.emailConfig.baseUrl}/restablecer-password?token=${token}`;

    await this.sendEmail({
      to: email,
      subject: 'Restablece tu contraseña - Profesional',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>Restablecer contraseña</h1>
          <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}"
               style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Restablecer Contraseña
            </a>
          </div>
          <p>Si no podés hacer click en el botón, copiá y pegá este enlace en tu navegador:</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          <p>Este enlace expira en 1 hora.</p>
          <p>Si no solicitaste este cambio, podés ignorar este email.</p>
        </div>
      `,
      text: `Restablecer contraseña - Profesional

Recibimos una solicitud para restablecer la contraseña de tu cuenta.

Hace click en este enlace: ${resetUrl}

Este enlace expira en 1 hora. Si no solicitaste este cambio, podés ignorar este email.`,
    });
  }
}
