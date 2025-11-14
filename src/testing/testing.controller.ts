import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationAlertService } from '../notifications/notification-alert.service';
import { WebsocketService } from '../websocket/websocket.service';

@ApiTags('testing')
@Controller('testing')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TestingController {
  constructor(
    private readonly notificationAlertService: NotificationAlertService,
    private readonly websocketService: WebsocketService,
  ) {}

  @Post('booking-alert')
  @ApiOperation({
    summary: 'Test booking alert system',
    description: 'Simula una alerta de booking pagado para testing',
  })
  async testBookingAlert(@Body() body: any, @Req() req: any) {
    const userId = req.user.userId;

    // Datos de prueba
    const testAlertData = {
      bookingId: `test-${Date.now()}`,
      professionalUserId: userId,
      professionalEmail: req.user.email,
      professionalPhone: body.phone || '+5491123456789',
      clientName: body.clientName || 'Juan Pérez (Test)',
      clientEmail: 'test@example.com',
      serviceDescription: body.serviceDescription || 'Consulta de prueba',
      amount: body.amount || 5000,
      currency: 'ARS',
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Mañana
      duration: 60,
    };

    try {
      // Enviar alertas de prueba
      await this.notificationAlertService.sendBookingPaidAlerts(testAlertData);

      return {
        success: true,
        message: 'Test booking alert sent successfully',
        data: testAlertData,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to send test alert',
        error: error.message,
      };
    }
  }

  @Post('websocket-ping')
  @ApiOperation({
    summary: 'Test WebSocket connection',
    description: 'Envía un ping directo via WebSocket',
  })
  async testWebSocketPing(@Req() req: any) {
    const userId = req.user.userId;

    try {
      // Enviar notificación de prueba via WebSocket
      this.websocketService.emitNotification(userId, {
        id: `test-${Date.now()}`,
        type: 'test',
        title: '🧪 Test WebSocket',
        message: 'Esta es una notificación de prueba via WebSocket',
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        message: 'WebSocket test notification sent',
        userId,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to send WebSocket test',
        error: error.message,
      };
    }
  }

  @Post('booking-alert-direct')
  @ApiOperation({
    summary: 'Test direct booking alert via WebSocket',
    description: 'Envía una alerta de booking directamente via WebSocket',
  })
  async testDirectBookingAlert(@Body() body: any, @Req() req: any) {
    const userId = req.user.userId;

    const alertData = {
      bookingId: `test-${Date.now()}`,
      clientName: body.clientName || 'Cliente de Prueba',
      clientEmail: 'test@example.com',
      serviceDescription: body.serviceDescription || 'Consulta de prueba',
      amount: body.amount || 7500,
      currency: 'ARS',
      scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // En 2 horas
      duration: 60,
      paymentId: `test-payment-${Date.now()}`,
      timestamp: new Date().toISOString(),
      urgency: 'high' as const,
    };

    try {
      this.websocketService.emitBookingAlert(userId, alertData);

      return {
        success: true,
        message: 'Direct booking alert sent via WebSocket',
        data: alertData,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to send direct booking alert',
        error: error.message,
      };
    }
  }

  @Post('connection-stats')
  @ApiOperation({
    summary: 'Get WebSocket connection stats',
    description: 'Obtiene estadísticas de conexiones WebSocket activas',
  })
  getConnectionStats() {
    return this.websocketService.getConnectionStats();
  }
}
