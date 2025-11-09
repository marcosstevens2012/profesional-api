import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus, MeetingStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../database/prisma.service';
import { MercadoPagoService } from '../payments/mercadopago.service';

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mercadoPagoService: MercadoPagoService,
  ) {}

  async create(createBookingDto: any) {
    // Generar jitsiRoom único: slug profesional + UUID
    const professional = await this.prisma.professionalProfile.findUnique({
      where: { id: createBookingDto.professionalId },
      select: { id: true },
    });

    if (!professional) {
      throw new NotFoundException('Professional not found');
    }

    const jitsiRoom = `${professional.id.slice(-8)}-${uuidv4().split('-')[0]}`;

    const booking = await this.prisma.booking.create({
      data: {
        ...createBookingDto,
        jitsiRoom,
        meetingStatus: MeetingStatus.PENDING,
        status: BookingStatus.PENDING_PAYMENT,
      },
      include: {
        client: { select: { id: true, email: true } },
        professional: {
          select: {
            id: true,
            name: true,
            email: true,
            user: { select: { email: true } },
          },
        },
      },
    });

    return booking;
  }

  async findAll() {
    return await this.prisma.booking.findMany({
      include: {
        client: { select: { id: true, email: true } },
        professional: { select: { id: true, name: true, email: true } },
        payment: true,
      },
    });
  }

  async findOne(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, email: true } },
        professional: {
          select: {
            id: true,
            name: true,
            email: true,
            user: { select: { id: true, email: true } },
          },
        },
        payment: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  async updateStatus(id: string, statusDto: any) {
    await this.findOne(id); // Verificar que existe

    return await this.prisma.booking.update({
      where: { id },
      data: { status: statusDto.status },
      include: {
        client: { select: { id: true, email: true } },
        professional: { select: { id: true, name: true, email: true } },
      },
    });
  }

  // Cuando se confirma el pago, poner en estado WAITING
  async markAsWaitingForProfessional(bookingId: string) {
    const booking = await this.findOne(bookingId);

    if (booking.status !== BookingStatus.PENDING_PAYMENT) {
      throw new BadRequestException('Booking is not in pending payment state');
    }

    const updatedBooking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.CONFIRMED,
        meetingStatus: MeetingStatus.WAITING,
        updatedAt: new Date(),
      },
      include: {
        client: { select: { id: true, email: true } },
        professional: {
          select: {
            id: true,
            name: true,
            email: true,
            user: { select: { email: true } },
          },
        },
      },
    });

    // TODO: Enviar email al profesional
    // await this.sendProfessionalNotification(updatedBooking);

    return updatedBooking;
  }

  // Profesional acepta la reunión (confirma que está listo)
  async acceptMeeting(bookingId: string, professionalUserId: string) {
    const booking = await this.findOne(bookingId);

    // Verificar que el profesional es el correcto
    if (booking.professional.user?.id !== professionalUserId) {
      throw new ForbiddenException('Not authorized to accept this meeting');
    }

    // Verificar que está en estado correcto
    if (booking.status !== BookingStatus.WAITING_FOR_PROFESSIONAL) {
      throw new BadRequestException(
        `Booking is not waiting for professional acceptance. Current status: ${booking.status}`,
      );
    }

    if (booking.meetingStatus !== MeetingStatus.WAITING) {
      throw new BadRequestException(
        `Meeting is not waiting for acceptance. Current status: ${booking.meetingStatus}`,
      );
    }

    // Verificar que el profesional no tenga más de 1 reunión activa + 1 en cola
    const professionalActiveMeetings = await this.getProfessionalActiveMeetings(
      booking.professionalId,
    );

    if (professionalActiveMeetings.active >= 1 && professionalActiveMeetings.waiting >= 1) {
      throw new BadRequestException('Professional already has maximum meetings');
    }

    const now = new Date();

    // Actualizar booking a CONFIRMED (listo para unirse, pero aún no iniciado)
    const updatedBooking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.CONFIRMED,
        meetingStatus: MeetingStatus.WAITING, // Se mantiene en WAITING hasta que alguien se una
        meetingAcceptedAt: now,
        updatedAt: now,
      },
      include: {
        client: { select: { id: true, email: true, name: true } },
        professional: { select: { id: true, name: true, email: true } },
      },
    });

    // Crear notificación para el CLIENTE
    await this.prisma.notification.create({
      data: {
        userId: booking.clientId,
        type: 'BOOKING_CONFIRMED',
        title: 'Consulta confirmada',
        message: `${booking.professional.name} ha aceptado tu solicitud de consulta. Ya puedes unirte a la videollamada.`,
        payload: {
          bookingId: booking.id,
          professionalName: booking.professional.name,
          jitsiRoom: booking.jitsiRoom,
          canJoinNow: true,
        },
      },
    });

    console.log('✅ Notification created for client', {
      client_id: booking.clientId,
      booking_id: bookingId,
    });

    // TODO: Enviar email al cliente notificando que puede unirse

    return {
      ...updatedBooking,
      canJoinMeeting: true,
      jitsiRoom: updatedBooking.jitsiRoom,
      message: 'Booking confirmed. Both parties can now join the meeting.',
    };
  }

  // Obtener estado de reunión
  async getMeetingStatus(bookingId: string) {
    const booking = await this.findOne(bookingId);

    return {
      bookingId: booking.id,
      jitsiRoom: booking.jitsiRoom,
      meetingStatus: booking.meetingStatus,
      meetingStartTime: booking.meetingStartTime,
      meetingEndTime: booking.meetingEndTime,
      remainingTime: booking.meetingEndTime
        ? Math.max(0, booking.meetingEndTime.getTime() - Date.now())
        : null,
    };
  }

  // Verificar si usuario puede unirse a la reunión
  async canUserJoinMeeting(bookingId: string, userId: string) {
    const booking = await this.findOne(bookingId);

    const isClient = booking.clientId === userId;
    const isProfessional = booking.professional.user?.id === userId;

    if (!isClient && !isProfessional) {
      throw new ForbiddenException('Not authorized to join this meeting');
    }

    // Permitir unirse si está CONFIRMED (profesional aceptó) o ya está ACTIVE
    if (
      booking.status !== BookingStatus.CONFIRMED &&
      booking.status !== BookingStatus.IN_PROGRESS
    ) {
      throw new BadRequestException(
        `Meeting is not ready to join. Current status: ${booking.status}`,
      );
    }

    return {
      canJoin: true,
      jitsiRoom: booking.jitsiRoom,
      role: isClient ? 'client' : 'professional',
      meetingStatus: booking.meetingStatus,
      bookingStatus: booking.status,
    };
  }

  // Nuevo método: Iniciar la reunión cuando alguien se une
  async startMeeting(bookingId: string, userId: string) {
    const booking = await this.findOne(bookingId);

    const isClient = booking.clientId === userId;
    const isProfessional = booking.professional.user?.id === userId;

    if (!isClient && !isProfessional) {
      throw new ForbiddenException('Not authorized to start this meeting');
    }

    // Solo permitir iniciar si está CONFIRMED
    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException(`Meeting cannot be started. Current status: ${booking.status}`);
    }

    const now = new Date();
    const meetingEndTime = new Date(now.getTime() + 18 * 60 * 1000); // 18 minutos después

    const updatedBooking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        meetingStatus: MeetingStatus.ACTIVE,
        status: BookingStatus.IN_PROGRESS,
        meetingStartTime: now,
        meetingEndTime: meetingEndTime,
        updatedAt: now,
      },
      include: {
        client: { select: { id: true, email: true, name: true } },
        professional: { select: { id: true, name: true, email: true } },
      },
    });

    console.log('✅ Meeting started', {
      booking_id: bookingId,
      started_by: isClient ? 'client' : 'professional',
      end_time: meetingEndTime,
    });

    // Programar finalización automática en 18 minutos
    setTimeout(
      () => {
        this.endMeetingAutomatically(bookingId);
      },
      18 * 60 * 1000,
    );

    return {
      ...updatedBooking,
      jitsiRoom: updatedBooking.jitsiRoom,
      meetingStartTime: updatedBooking.meetingStartTime,
      meetingEndTime: updatedBooking.meetingEndTime,
      remainingTime: 18 * 60 * 1000, // 18 minutos en ms
    };
  }

  // Finalizar reunión automáticamente
  async endMeetingAutomatically(bookingId: string) {
    try {
      await this.prisma.booking.update({
        where: {
          id: bookingId,
          meetingStatus: MeetingStatus.ACTIVE,
        },
        data: {
          meetingStatus: MeetingStatus.COMPLETED,
          status: BookingStatus.COMPLETED,
          meetingEndTime: new Date(),
        },
      });
    } catch (error) {
      console.error(`Error ending meeting automatically for booking ${bookingId}:`, error);
    }
  }

  // Obtener reuniones activas del profesional
  async getProfessionalActiveMeetings(professionalId: string) {
    const activeMeetings = await this.prisma.booking.count({
      where: {
        professionalId,
        meetingStatus: MeetingStatus.ACTIVE,
      },
    });

    const waitingMeetings = await this.prisma.booking.count({
      where: {
        professionalId,
        meetingStatus: MeetingStatus.WAITING,
      },
    });

    return {
      active: activeMeetings,
      waiting: waitingMeetings,
      total: activeMeetings + waitingMeetings,
    };
  }

  // Verificar si profesional está disponible para nuevos bookings
  async isProfessionalAvailable(professionalId: string): Promise<boolean> {
    const meetings = await this.getProfessionalActiveMeetings(professionalId);
    return meetings.active < 1 || meetings.waiting < 1;
  }

  async remove(id: string) {
    await this.findOne(id); // Verificar que existe

    return await this.prisma.booking.delete({
      where: { id },
    });
  }

  async getProfessionalPendingMeetings(professionalUserId: string) {
    // Primero obtenemos el professionalProfile basado en userId
    const professionalProfile = await this.prisma.professionalProfile.findUnique({
      where: { userId: professionalUserId },
      select: { id: true },
    });

    if (!professionalProfile) {
      throw new NotFoundException('Professional profile not found');
    }

    // Obtener solo reuniones CONFIRMADAS (pagadas y aceptadas) o ACTIVAS
    // NO incluir PENDING ni WAITING sin pago confirmado
    const meetings = await this.prisma.booking.findMany({
      where: {
        professionalId: professionalProfile.id,
        // Solo mostrar si están confirmadas o activas
        status: {
          in: [BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS],
        },
        meetingStatus: {
          in: [MeetingStatus.WAITING, MeetingStatus.ACTIVE],
        },
        // Asegurar que hay un pago aprobado
        payment: {
          status: 'APPROVED',
        },
      },
      include: {
        client: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        payment: {
          select: {
            id: true,
            amount: true,
            status: true,
            paidAt: true,
          },
        },
      },
      orderBy: {
        scheduledAt: 'asc', // Próximas reuniones primero
      },
    });

    return {
      meetings,
      count: meetings.length,
    };
  }

  // Nuevo método: Obtener bookings esperando aceptación del profesional
  async getWaitingBookings(professionalUserId: string) {
    const professionalProfile = await this.prisma.professionalProfile.findUnique({
      where: { userId: professionalUserId },
      select: { id: true },
    });

    if (!professionalProfile) {
      throw new NotFoundException('Professional profile not found');
    }

    const bookings = await this.prisma.booking.findMany({
      where: {
        professionalId: professionalProfile.id,
        status: BookingStatus.WAITING_FOR_PROFESSIONAL,
        meetingStatus: MeetingStatus.WAITING,
        // Asegurarse de que existe un pago y está aprobado
        payment: {
          status: 'APPROVED',
        },
      },
      include: {
        client: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        payment: {
          select: {
            id: true,
            amount: true,
            status: true,
            paidAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc', // Primero los más antiguos
      },
    });

    return {
      bookings,
      count: bookings.length,
      message: `${bookings.length} booking(s) waiting for your acceptance`,
    };
  }

  // Nuevo método: Obtener bookings del cliente
  async getClientBookings(clientId: string) {
    const bookings = await this.prisma.booking.findMany({
      where: {
        clientId,
      },
      include: {
        professional: {
          select: {
            id: true,
            email: true,
            bio: true,
            pricePerSession: true,
            userId: true,
            user: {
              select: {
                id: true,
                email: true,
                profile: {
                  select: {
                    firstName: true,
                    lastName: true,
                    avatar: true,
                  },
                },
              },
            },
            serviceCategory: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        payment: {
          select: {
            id: true,
            amount: true,
            status: true,
            paidAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc', // Más recientes primero
      },
    });

    // Agrupar por estado
    const grouped = {
      pending_payment: bookings.filter((b) => b.status === BookingStatus.PENDING_PAYMENT),
      waiting_acceptance: bookings.filter(
        (b) => b.status === BookingStatus.WAITING_FOR_PROFESSIONAL,
      ),
      confirmed: bookings.filter((b) => b.status === BookingStatus.CONFIRMED),
      in_progress: bookings.filter((b) => b.status === BookingStatus.IN_PROGRESS),
      completed: bookings.filter((b) => b.status === BookingStatus.COMPLETED),
      cancelled: bookings.filter((b) => b.status === BookingStatus.CANCELLED),
    };

    return {
      bookings,
      count: bookings.length,
      grouped,
    };
  }

  async getProfessionalBookings(professionalUserId: string) {
    const professionalProfile = await this.prisma.professionalProfile.findUnique({
      where: { userId: professionalUserId },
      select: { id: true },
    });

    if (!professionalProfile) {
      throw new NotFoundException('Professional profile not found');
    }

    // Primero obtener TODAS las bookings para debug
    const allBookings = await this.prisma.booking.findMany({
      where: {
        professionalId: professionalProfile.id,
      },
      include: {
        client: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
        payment: {
          select: {
            id: true,
            amount: true,
            status: true,
            paidAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log('🔍 DEBUG getProfessionalBookings:');
    console.log('Professional ID:', professionalProfile.id);
    console.log('Total bookings found:', allBookings.length);

    // Mostrar detalles de cada booking
    allBookings.forEach((b, i) => {
      console.log(`Booking ${i + 1}:`, {
        id: b.id.slice(-8),
        status: b.status,
        hasPayment: !!b.payment,
        paymentStatus: b.payment?.status,
      });
    });

    // Filtrar: Excluir solo las que están en PENDING_PAYMENT
    const paidBookings = allBookings.filter((b) => b.status !== BookingStatus.PENDING_PAYMENT);

    console.log('Bookings after filter (excluding PENDING_PAYMENT):', paidBookings.length);

    // Agrupar por estado (sin pending_payment)
    const grouped = {
      waiting_acceptance: paidBookings.filter(
        (b) => b.status === BookingStatus.WAITING_FOR_PROFESSIONAL,
      ),
      confirmed: paidBookings.filter((b) => b.status === BookingStatus.CONFIRMED),
      in_progress: paidBookings.filter((b) => b.status === BookingStatus.IN_PROGRESS),
      completed: paidBookings.filter((b) => b.status === BookingStatus.COMPLETED),
      cancelled: paidBookings.filter((b) => b.status === BookingStatus.CANCELLED),
    };

    console.log('Grouped counts:', {
      waiting_acceptance: grouped.waiting_acceptance.length,
      confirmed: grouped.confirmed.length,
      in_progress: grouped.in_progress.length,
      completed: grouped.completed.length,
      cancelled: grouped.cancelled.length,
    });

    return {
      bookings: paidBookings,
      count: paidBookings.length,
      grouped,
    };
  }

  /**
   * Crea un pago vinculado a una reserva específica
   */
  async createPaymentForBooking(bookingId: string, clientId: string) {
    // 1. Verificar que la booking existe y pertenece al cliente
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        professional: {
          select: {
            id: true,
            pricePerSession: true,
            user: {
              select: { name: true, email: true },
            },
          },
        },
        client: {
          select: { name: true, email: true },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Reserva no encontrada');
    }

    if (booking.clientId !== clientId) {
      throw new ForbiddenException('No tienes permiso para pagar esta reserva');
    }

    if (booking.status !== BookingStatus.PENDING_PAYMENT) {
      throw new BadRequestException(
        `Esta reserva ya no está pendiente de pago (estado actual: ${booking.status})`,
      );
    }

    // 2. Verificar que no exista ya un pago para esta booking
    if (booking.paymentId) {
      throw new BadRequestException('Ya existe un pago para esta reserva');
    }

    // 3. Obtener precio del profesional
    const amount = booking.professional.pricePerSession;

    // 4. Crear preference en MercadoPago (pago directo a plataforma, sin split)
    const preference = await this.mercadoPagoService.createPreference({
      items: [
        {
          title: `Consulta con ${booking.professional.user.name}`,
          description: `Consulta profesional - ${booking.scheduledAt.toLocaleDateString()}`,
          quantity: 1,
          unit_price: amount.toNumber(),
          currency_id: 'ARS',
        },
      ],
      external_reference: bookingId, // Vinculamos el bookingId
      payer: {
        email: booking.client.email,
        name: booking.client.name || undefined,
      },
      back_urls: {
        success: `${process.env.FRONTEND_URL}/bookings/${bookingId}/success`,
        failure: `${process.env.FRONTEND_URL}/bookings/${bookingId}/failure`,
        pending: `${process.env.FRONTEND_URL}/bookings/${bookingId}/pending`,
      },
      auto_return: 'approved',
      notification_url: `${process.env.APP_URL}/api/payments/webhook`,
      metadata: {
        bookingId,
        professionalId: booking.professional.id,
        clientId: booking.clientId,
      },
    });

    // 5. Crear Payment y vincularlo a la booking
    const payment = await this.prisma.payment.create({
      data: {
        amount: amount,
        netAmount: amount, // Por ahora sin comisión
        status: 'PENDING',
        preferenceId: preference.id,
        paymentId: null, // Se actualizará cuando MP envíe el webhook
        gatewayPaymentId: null,
        metadata: {
          bookingId,
          professionalId: booking.professional.id,
          clientId: booking.clientId,
        },
      },
    });

    // 6. Actualizar booking con el paymentId
    await this.prisma.booking.update({
      where: { id: bookingId },
      data: { paymentId: payment.id },
    });

    // 7. Retornar init_point para redirección a checkout
    return {
      paymentId: payment.id,
      preferenceId: preference.id,
      init_point: preference.init_point,
      amount: payment.amount,
      bookingId: booking.id,
    };
  }
}
