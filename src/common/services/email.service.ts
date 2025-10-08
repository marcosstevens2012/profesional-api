import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EmailConfig } from "../../config/email.config";

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

  constructor(configService: ConfigService) {
    this.emailConfig = configService.get<EmailConfig>("email")!;
  }

  /**
   * Send email (mock implementation for development)
   * In production, integrate with SendGrid, AWS SES, or similar service
   */
  async sendEmail(params: SendEmailParams): Promise<void> {
    const { to, subject, html, text } = params;

    // Mock implementation - log email details
    this.logger.log(`📧 [MOCK EMAIL] Sending email:`);
    this.logger.log(`   To: ${to}`);
    this.logger.log(`   Subject: ${subject}`);
    this.logger.log(`   From: ${this.emailConfig.from}`);
    if (html) {
      this.logger.log(`   HTML Content: ${html}`);
    }
    if (text) {
      this.logger.log(`   Text Content: ${text}`);
    }

    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Send email verification
   */
  async sendEmailVerification(email: string, token: string): Promise<void> {
    const verificationUrl = `${this.emailConfig.baseUrl}/verificar-email?token=${token}`;

    await this.sendEmail({
      to: email,
      subject: "Verificá tu email - Profesional",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>¡Bienvenido a Profesional!</h1>
          <p>Gracias por registrarte. Para completar tu registro, necesitamos verificar tu dirección de email.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}"
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Verificar Email
            </a>
          </div>
          <p>Si no podés hacer click en el botón, copiá y pegá este enlace en tu navegador:</p>
          <p><a href="${verificationUrl}">${verificationUrl}</a></p>
          <p>Este enlace expira en 24 horas.</p>
        </div>
      `,
      text: `¡Bienvenido a Profesional!

Para completar tu registro, verificá tu email haciendo click en este enlace: ${verificationUrl}

Este enlace expira en 24 horas.`,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(email: string, token: string): Promise<void> {
    const resetUrl = `${this.emailConfig.baseUrl}/restablecer-password?token=${token}`;

    await this.sendEmail({
      to: email,
      subject: "Restablece tu contraseña - Profesional",
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
