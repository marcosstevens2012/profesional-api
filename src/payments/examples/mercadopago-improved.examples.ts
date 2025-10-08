// 📚 EJEMPLOS DE USO DE LA INTEGRACIÓN MEJORADA DE MERCADOPAGO
// Este archivo muestra cómo usar el nuevo método createImprovedPreference

import { MercadoPagoService } from "../mercadopago.service";

// ============================================================================
// EJEMPLO 1: Preferencia Básica (Mínimo Recomendado)
// ============================================================================
async function createBasicPreference(
  mercadoPagoService: MercadoPagoService,
  professionalSlug: string,
  amount: number,
  userEmail: string,
  bookingId: string
) {
  const preference = await mercadoPagoService.createImprovedPreference({
    // Item info
    serviceId: `service_${professionalSlug}`,
    title: "Consulta Profesional",
    description: `Consulta con ${professionalSlug}`,
    amount: amount,
    currencyId: "ARS",

    // Payer (pre-completa el checkout)
    payerEmail: userEmail,

    // URLs
    backUrls: {
      success: `${process.env.APP_URL}/profesionales/${professionalSlug}/pago/exito`,
      failure: `${process.env.APP_URL}/profesionales/${professionalSlug}/pago/error`,
      pending: `${process.env.APP_URL}/profesionales/${professionalSlug}/pago/pendiente`,
    },
    notificationUrl: `${process.env.APP_URL}/api/payments/webhook`,

    // Tracking
    externalReference: bookingId,
    metadata: {
      booking_id: bookingId,
      professional_slug: professionalSlug,
    },
  });

  return preference;
}

// ============================================================================
// EJEMPLO 2: Preferencia Completa (Datos del Usuario)
// ============================================================================
async function createFullPreference(
  mercadoPagoService: MercadoPagoService,
  data: {
    professionalSlug: string;
    professionalName: string;
    professionalImageUrl: string;
    amount: number;
    userEmail: string;
    userName: string;
    userSurname: string;
    userPhone: string;
    userDNI: string;
    bookingId: string;
    appointmentDate: string;
  }
) {
  const preference = await mercadoPagoService.createImprovedPreference({
    // Item detallado
    serviceId: `consultation_${data.bookingId}`,
    title: `Consulta con ${data.professionalName}`,
    description: `Consulta profesional online - ${new Date(
      data.appointmentDate
    ).toLocaleDateString()}`,
    pictureUrl: data.professionalImageUrl,
    categoryId: "health_services",
    amount: data.amount,
    currencyId: "ARS",

    // Datos completos del pagador (mejor UX)
    payerEmail: data.userEmail,
    payerName: data.userName,
    payerSurname: data.userSurname,
    payerPhone: data.userPhone,
    payerIdentificationType: "DNI",
    payerIdentificationNumber: data.userDNI,

    // URLs
    backUrls: {
      success: `${process.env.APP_URL}/profesionales/${data.professionalSlug}/pago/exito?booking=${data.bookingId}`,
      failure: `${process.env.APP_URL}/profesionales/${data.professionalSlug}/pago/error?booking=${data.bookingId}`,
      pending: `${process.env.APP_URL}/profesionales/${data.professionalSlug}/pago/pendiente?booking=${data.bookingId}`,
    },
    notificationUrl: `${process.env.APP_URL}/api/payments/webhook`,

    // Configuración de pagos
    maxInstallments: 12,
    defaultInstallments: 1,

    // Metadata rica para tracking
    externalReference: data.bookingId,
    metadata: {
      booking_id: data.bookingId,
      professional_slug: data.professionalSlug,
      service_type: "online_consultation",
      appointment_date: data.appointmentDate,
      platform: "web",
      created_at: new Date().toISOString(),
    },

    // Branding en extracto
    statementDescriptor: "PROFESIONAL",

    // Expiración (24 horas)
    expirationHours: 24,
  });

  return preference;
}

// ============================================================================
// EJEMPLO 3: Marketplace con Split de Pagos
// ============================================================================
async function createMarketplacePreference(
  mercadoPagoService: MercadoPagoService,
  data: {
    professionalSlug: string;
    professionalName: string;
    professionalMPUserId: number;
    amount: number;
    platformFeePercentage: number;
    userEmail: string;
    bookingId: string;
  }
) {
  const platformFee = data.amount * (data.platformFeePercentage / 100);
  const professionalAmount = data.amount - platformFee;

  const preference = await mercadoPagoService.createImprovedPreference({
    // Item
    serviceId: `marketplace_${data.bookingId}`,
    title: `Consulta - ${data.professionalName}`,
    amount: data.amount,
    currencyId: "ARS",

    // Payer
    payerEmail: data.userEmail,

    // URLs
    backUrls: {
      success: `${process.env.APP_URL}/bookings/${data.bookingId}/success`,
      failure: `${process.env.APP_URL}/bookings/${data.bookingId}/failure`,
      pending: `${process.env.APP_URL}/bookings/${data.bookingId}/pending`,
    },
    notificationUrl: `${process.env.APP_URL}/api/payments/webhook`,

    // Marketplace split
    marketplace: "PROFESIONAL-MARKETPLACE",
    marketplaceFee: platformFee,
    splitPayments: [
      {
        amount: professionalAmount,
        fee_amount: 0,
        collector: {
          id: data.professionalMPUserId,
        },
      },
    ],

    // Tracking
    externalReference: data.bookingId,
    metadata: {
      booking_id: data.bookingId,
      professional_slug: data.professionalSlug,
      marketplace_split: true,
      platform_fee: platformFee,
      professional_amount: professionalAmount,
    },
  });

  return preference;
}

// ============================================================================
// EJEMPLO 4: Preferencia con Restricciones de Pago
// ============================================================================
async function createRestrictedPreference(
  mercadoPagoService: MercadoPagoService,
  data: {
    professionalSlug: string;
    amount: number;
    userEmail: string;
    bookingId: string;
  }
) {
  const preference = await mercadoPagoService.createImprovedPreference({
    // Item
    serviceId: `service_${data.bookingId}`,
    title: "Consulta Profesional Premium",
    amount: data.amount,
    currencyId: "ARS",

    // Payer
    payerEmail: data.userEmail,

    // URLs
    backUrls: {
      success: `${process.env.APP_URL}/success`,
      failure: `${process.env.APP_URL}/failure`,
      pending: `${process.env.APP_URL}/pending`,
    },
    notificationUrl: `${process.env.APP_URL}/api/payments/webhook`,

    // Restricciones de pago
    maxInstallments: 3, // Máximo 3 cuotas
    defaultInstallments: 1, // Por defecto 1 cuota
    excludedPaymentTypes: ["ticket"], // No permitir pago en efectivo
    excludedPaymentMethods: ["master"], // No permitir Mastercard (ejemplo)

    // Tracking
    externalReference: data.bookingId,
  });

  return preference;
}

// ============================================================================
// EJEMPLO 5: Detección Automática de Moneda por País
// ============================================================================
const CURRENCY_BY_COUNTRY = {
  AR: "ARS",
  BR: "BRL",
  CL: "CLP",
  CO: "COP",
  MX: "MXN",
  PE: "PEN",
  UY: "UYU",
  VE: "VES",
};

async function createPreferenceWithAutoCurrency(
  mercadoPagoService: MercadoPagoService,
  data: {
    professionalSlug: string;
    professionalCountryCode: string;
    amount: number;
    userEmail: string;
    bookingId: string;
  }
) {
  const currencyId =
    CURRENCY_BY_COUNTRY[
      data.professionalCountryCode as keyof typeof CURRENCY_BY_COUNTRY
    ] || "ARS";

  const preference = await mercadoPagoService.createImprovedPreference({
    serviceId: `service_${data.bookingId}`,
    title: "Consulta Profesional",
    amount: data.amount,
    currencyId: currencyId, // Moneda automática según país

    payerEmail: data.userEmail,

    backUrls: {
      success: `${process.env.APP_URL}/success`,
      failure: `${process.env.APP_URL}/failure`,
      pending: `${process.env.APP_URL}/pending`,
    },
    notificationUrl: `${process.env.APP_URL}/api/payments/webhook`,

    externalReference: data.bookingId,
    metadata: {
      booking_id: data.bookingId,
      country: data.professionalCountryCode,
      currency: currencyId,
    },
  });

  return preference;
}

// ============================================================================
// EJEMPLO 6: Uso en Controller (Integración Completa)
// ============================================================================
/*
// En payments.controller.ts

@Post('create-preference-v2')
async createImprovedPreference(
  @Body() dto: CreateImprovedPreferenceDto,
  @Request() req: any
) {
  try {
    // Obtener datos del profesional
    const professional = await this.professionalsService.findBySlug(dto.professionalSlug);
    if (!professional) {
      throw new NotFoundException('Professional not found');
    }

    // Crear booking (opcional)
    const booking = await this.bookingsService.create({
      professionalId: professional.id,
      userId: req.user.id,
      amount: dto.amount,
      serviceType: dto.serviceType,
      appointmentDate: dto.appointmentDate,
    });

    // Crear preferencia mejorada
    const preference = await this.mercadoPagoService.createImprovedPreference({
      // Item
      serviceId: `consultation_${booking.id}`,
      title: dto.title || `Consulta con ${professional.name}`,
      description: dto.description || `Consulta profesional online`,
      pictureUrl: professional.profileImage,
      categoryId: 'health_services',
      amount: dto.amount,
      currencyId: dto.currencyId || 'ARS',

      // Payer (del usuario autenticado)
      payerEmail: dto.payerEmail || req.user.email,
      payerName: dto.payerName || req.user.name,
      payerSurname: dto.payerSurname || req.user.surname,
      payerPhone: dto.payerPhone || req.user.phone,
      payerIdentificationType: dto.payerIdentificationType,
      payerIdentificationNumber: dto.payerIdentificationNumber,

      // URLs
      backUrls: {
        success: `${process.env.APP_URL}/profesionales/${professional.slug}/pago/exito?booking=${booking.id}`,
        failure: `${process.env.APP_URL}/profesionales/${professional.slug}/pago/error?booking=${booking.id}`,
        pending: `${process.env.APP_URL}/profesionales/${professional.slug}/pago/pendiente?booking=${booking.id}`,
      },
      notificationUrl: `${process.env.APP_URL}/api/payments/webhook`,

      // Config
      maxInstallments: dto.maxInstallments || 12,
      defaultInstallments: dto.defaultInstallments || 1,

      // Tracking
      externalReference: booking.id,
      metadata: {
        booking_id: booking.id,
        professional_id: professional.id,
        user_id: req.user.id,
        service_type: dto.serviceType,
        appointment_date: dto.appointmentDate,
        created_at: new Date().toISOString(),
      },

      // Branding
      statementDescriptor: 'PROFESIONAL',

      // Expiración
      expirationHours: 24,
    });

    // Guardar preferenceId en booking
    await this.bookingsService.update(booking.id, {
      preferenceId: preference.id,
    });

    return {
      success: true,
      preference: {
        id: preference.id,
        init_point: preference.init_point,
        sandbox_init_point: preference.sandbox_init_point,
      },
      booking: {
        id: booking.id,
      },
    };
  } catch (error) {
    this.logger.error('Error creating improved preference', error);
    throw error;
  }
}
*/

export {
  createBasicPreference,
  createFullPreference,
  createMarketplacePreference,
  createPreferenceWithAutoCurrency,
  createRestrictedPreference,
};
