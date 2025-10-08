import {
  BookingStatus,
  DayOfWeek,
  MeetingStatus,
  PaymentStatus,
  PrismaClient,
  SlotType,
  UserRole,
  UserStatus,
} from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting comprehensive database seed...");

  // Limpiar datos existentes en orden correcto (respetando foreign keys)
  console.log("🧹 Cleaning existing data...");
  await prisma.paymentEvent.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.review.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.availabilitySlot.deleteMany();
  await prisma.professionalProfile.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.serviceCategory.deleteMany();
  await prisma.location.deleteMany();
  await prisma.commissionRule.deleteMany();
  await prisma.globalConfig.deleteMany();

  console.log("✅ Cleared existing data");

  // 1. Configuración global
  console.log("🔧 Creating global configuration...");
  await prisma.globalConfig.createMany({
    data: [
      {
        key: "platform_commission",
        value: 15,
        description: "Comisión de la plataforma (%)",
      },
      {
        key: "min_session_price",
        value: 15000,
        description: "Precio mínimo por sesión (ARS)",
      },
      {
        key: "max_session_duration",
        value: 120,
        description: "Duración máxima de sesión (minutos)",
      },
      {
        key: "cancellation_hours",
        value: 24,
        description: "Horas mínimas para cancelar sin penalización",
      },
    ],
  });

  // 2. Reglas de comisión
  console.log("💰 Creating commission rules...");
  await prisma.commissionRule.create({
    data: {
      percentage: 15.0,
      fixedFee: 500.0,
      isActive: true,
    },
  });

  // 3. Crear ubicaciones realistas de Argentina
  console.log("📍 Creating locations...");
  const locations = await Promise.all([
    prisma.location.create({
      data: {
        province: "Ciudad Autónoma de Buenos Aires",
        city: "Palermo",
      },
    }),
    prisma.location.create({
      data: {
        province: "Ciudad Autónoma de Buenos Aires",
        city: "Recoleta",
      },
    }),
    prisma.location.create({
      data: {
        province: "Buenos Aires",
        city: "San Isidro",
      },
    }),
    prisma.location.create({
      data: {
        province: "Córdoba",
        city: "Córdoba Capital",
      },
    }),
    prisma.location.create({
      data: {
        province: "Santa Fe",
        city: "Rosario",
      },
    }),
    prisma.location.create({
      data: {
        province: "Mendoza",
        city: "Mendoza Capital",
      },
    }),
  ]);

  // 4. Crear categorías de servicio más detalladas
  console.log("🎯 Creating service categories...");
  const categories = await Promise.all([
    prisma.serviceCategory.create({
      data: {
        name: "Psicología Clínica",
        slug: "psicologia-clinica",
        description:
          "Terapia individual, de pareja y familiar. Tratamiento de ansiedad, depresión y trastornos del estado de ánimo.",
        order: 1,
      },
    }),
    prisma.serviceCategory.create({
      data: {
        name: "Nutrición y Dietética",
        slug: "nutricion-dietetica",
        description:
          "Planes nutricionales personalizados, asesoramiento dietético y educación alimentaria.",
        order: 2,
      },
    }),
    prisma.serviceCategory.create({
      data: {
        name: "Kinesiología",
        slug: "kinesiologia",
        description:
          "Rehabilitación física, fisioterapia y tratamiento de lesiones deportivas.",
        order: 3,
      },
    }),
    prisma.serviceCategory.create({
      data: {
        name: "Medicina General",
        slug: "medicina-general",
        description:
          "Consultas médicas generales, chequeos preventivos y seguimiento de salud.",
        order: 4,
      },
    }),
    prisma.serviceCategory.create({
      data: {
        name: "Dermatología",
        slug: "dermatologia",
        description:
          "Cuidado de la piel, tratamiento de acné y consultas dermatológicas.",
        order: 5,
      },
    }),
    prisma.serviceCategory.create({
      data: {
        name: "Cardiología",
        slug: "cardiologia",
        description:
          "Consultas cardiológicas, control de presión arterial y seguimiento cardiovascular.",
        order: 6,
      },
    }),
  ]);

  // 5. Crear usuarios realistas
  console.log("👥 Creating users...");
  const hashedPassword = await bcrypt.hash("123456", 10);

  // Admin
  const admin = await prisma.user.create({
    data: {
      email: "admin@profesional.com",
      password: hashedPassword,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      name: "Administrador Sistema",
    },
  });

  // Crear perfil para admin
  await prisma.profile.create({
    data: {
      userId: admin.id,
      firstName: "Administrador",
      lastName: "Sistema",
      phone: "+54 11 1234-5678",
    },
  });

  // Profesionales
  const professionals = await Promise.all([
    prisma.user.create({
      data: {
        email: "dra.martinez@psicologia.com",
        password: hashedPassword,
        role: UserRole.PROFESSIONAL,
        status: UserStatus.ACTIVE,
        name: "María Elena Martínez",
      },
    }),
    prisma.user.create({
      data: {
        email: "lic.rodriguez@nutricion.com",
        password: hashedPassword,
        role: UserRole.PROFESSIONAL,
        status: UserStatus.ACTIVE,
        name: "Carlos Rodríguez",
      },
    }),
    prisma.user.create({
      data: {
        email: "lic.gonzalez@kinesiologia.com",
        password: hashedPassword,
        role: UserRole.PROFESSIONAL,
        status: UserStatus.ACTIVE,
        name: "Ana González",
      },
    }),
    prisma.user.create({
      data: {
        email: "dr.lopez@medicina.com",
        password: hashedPassword,
        role: UserRole.PROFESSIONAL,
        status: UserStatus.ACTIVE,
        name: "Roberto López",
      },
    }),
    prisma.user.create({
      data: {
        email: "dra.fernandez@dermatologia.com",
        password: hashedPassword,
        role: UserRole.PROFESSIONAL,
        status: UserStatus.ACTIVE,
        name: "Laura Fernández",
      },
    }),
    prisma.user.create({
      data: {
        email: "dr.silva@cardiologia.com",
        password: hashedPassword,
        role: UserRole.PROFESSIONAL,
        status: UserStatus.ACTIVE,
        name: "Javier Silva",
      },
    }),
  ]);

  // Crear perfiles para profesionales
  const professionalProfilesData = [
    {
      firstName: "María Elena",
      lastName: "Martínez",
      phone: "+54 11 4567-8901",
    },
    { firstName: "Carlos", lastName: "Rodríguez", phone: "+54 11 4567-8902" },
    { firstName: "Ana", lastName: "González", phone: "+54 11 4567-8903" },
    { firstName: "Roberto", lastName: "López", phone: "+54 11 4567-8904" },
    { firstName: "Laura", lastName: "Fernández", phone: "+54 11 4567-8905" },
    { firstName: "Javier", lastName: "Silva", phone: "+54 11 4567-8906" },
  ];

  for (let i = 0; i < professionals.length; i++) {
    await prisma.profile.create({
      data: {
        userId: professionals[i].id,
        firstName: professionalProfilesData[i].firstName,
        lastName: professionalProfilesData[i].lastName,
        phone: professionalProfilesData[i].phone,
      },
    });
  }

  // Clientes
  const clients = await Promise.all([
    prisma.user.create({
      data: {
        email: "cliente1@email.com",
        password: hashedPassword,
        role: UserRole.CLIENT,
        status: UserStatus.ACTIVE,
        name: "Pedro Gómez",
      },
    }),
    prisma.user.create({
      data: {
        email: "cliente2@email.com",
        password: hashedPassword,
        role: UserRole.CLIENT,
        status: UserStatus.ACTIVE,
        name: "Sofia Ruiz",
      },
    }),
    prisma.user.create({
      data: {
        email: "cliente3@email.com",
        password: hashedPassword,
        role: UserRole.CLIENT,
        status: UserStatus.ACTIVE,
        name: "Diego Morales",
      },
    }),
    prisma.user.create({
      data: {
        email: "cliente4@email.com",
        password: hashedPassword,
        role: UserRole.CLIENT,
        status: UserStatus.ACTIVE,
        name: "Valentina Torres",
      },
    }),
    prisma.user.create({
      data: {
        email: "cliente5@email.com",
        password: hashedPassword,
        role: UserRole.CLIENT,
        status: UserStatus.ACTIVE,
        name: "Martín Herrera",
      },
    }),
  ]);

  // Crear perfiles para clientes
  const clientProfiles = [
    { firstName: "Pedro", lastName: "Gómez", phone: "+54 11 5678-9001" },
    { firstName: "Sofia", lastName: "Ruiz", phone: "+54 11 5678-9002" },
    { firstName: "Diego", lastName: "Morales", phone: "+54 11 5678-9003" },
    { firstName: "Valentina", lastName: "Torres", phone: "+54 11 5678-9004" },
    { firstName: "Martín", lastName: "Herrera", phone: "+54 11 5678-9005" },
  ];

  for (let i = 0; i < clients.length; i++) {
    await prisma.profile.create({
      data: {
        userId: clients[i].id,
        firstName: clientProfiles[i].firstName,
        lastName: clientProfiles[i].lastName,
        phone: clientProfiles[i].phone,
      },
    });
  }

  // 6. Crear perfiles profesionales detallados
  console.log("👨‍⚕️ Creating professional profiles...");
  const professionalProfiles = await Promise.all([
    // Psicóloga
    prisma.professionalProfile.create({
      data: {
        userId: professionals[0].id,
        email: professionals[0].email,
        name: "Dra. María Elena Martínez",
        bio: "Psicóloga clínica especializada en terapia cognitivo-conductual",
        description:
          "Licenciada en Psicología con 15 años de experiencia. Especialista en tratamiento de ansiedad, depresión, trastornos del estado de ánimo y terapia de pareja. Enfoque integrador combinando técnicas cognitivo-conductuales y humanísticas.",
        pricePerSession: 28000.0,
        standardDuration: 60,
        serviceCategoryId: categories[0].id,
        tags: [
          "ansiedad",
          "depresión",
          "terapia de pareja",
          "autoestima",
          "estrés",
        ],
        locationId: locations[0].id,
        rating: 4.8,
        reviewCount: 124,
        isVerified: true,
        isActive: true,
      },
    }),
    // Nutricionista
    prisma.professionalProfile.create({
      data: {
        userId: professionals[1].id,
        email: professionals[1].email,
        name: "Lic. Carlos Rodríguez",
        bio: "Nutricionista especializado en planes de alimentación saludable",
        description:
          "Licenciado en Nutrición con 12 años de experiencia. Especialista en nutrición deportiva, pérdida de peso saludable, planes alimentarios para diabetes e hipertensión. Enfoque personalizado basado en evidencia científica.",
        pricePerSession: 25000.0,
        standardDuration: 45,
        serviceCategoryId: categories[1].id,
        tags: [
          "pérdida de peso",
          "nutrición deportiva",
          "diabetes",
          "hipertensión",
          "alimentación saludable",
        ],
        locationId: locations[1].id,
        rating: 4.7,
        reviewCount: 89,
        isVerified: true,
        isActive: true,
      },
    }),
    // Kinesióloga
    prisma.professionalProfile.create({
      data: {
        userId: professionals[2].id,
        email: professionals[2].email,
        name: "Lic. Ana González",
        bio: "Kinesióloga especializada en rehabilitación y fisioterapia",
        description:
          "Licenciada en Kinesiología y Fisiatría con 10 años de experiencia. Especialista en rehabilitación post-quirúrgica, lesiones deportivas, dolor de espalda y cuello. Tratamientos personalizados con técnicas manuales y ejercicios terapéuticos.",
        pricePerSession: 30000.0,
        standardDuration: 60,
        serviceCategoryId: categories[2].id,
        tags: [
          "rehabilitación",
          "lesiones deportivas",
          "dolor de espalda",
          "fisioterapia",
          "ejercicios terapéuticos",
        ],
        locationId: locations[2].id,
        rating: 4.9,
        reviewCount: 156,
        isVerified: true,
        isActive: true,
      },
    }),
    // Médico General
    prisma.professionalProfile.create({
      data: {
        userId: professionals[3].id,
        email: professionals[3].email,
        name: "Dr. Roberto López",
        bio: "Médico general con amplia experiencia en medicina preventiva",
        description:
          "Médico con 20 años de experiencia en medicina general y familiar. Especializado en medicina preventiva, chequeos médicos, control de enfermedades crónicas y medicina del trabajo. Atención integral para toda la familia.",
        pricePerSession: 35000.0,
        standardDuration: 30,
        serviceCategoryId: categories[3].id,
        tags: [
          "chequeos médicos",
          "medicina preventiva",
          "hipertensión",
          "diabetes",
          "medicina familiar",
        ],
        locationId: locations[3].id,
        rating: 4.6,
        reviewCount: 203,
        isVerified: true,
        isActive: true,
      },
    }),
    // Dermatóloga
    prisma.professionalProfile.create({
      data: {
        userId: professionals[4].id,
        email: professionals[4].email,
        name: "Dra. Laura Fernández",
        bio: "Dermatóloga especializada en cuidado integral de la piel",
        description:
          "Médica dermatóloga con 8 años de experiencia. Especialista en tratamiento de acné, dermatitis, control de lunares, tratamientos anti-edad y cuidado integral de la piel. Enfoque en prevención y tratamientos personalizados.",
        pricePerSession: 40000.0,
        standardDuration: 30,
        serviceCategoryId: categories[4].id,
        tags: [
          "acné",
          "dermatitis",
          "control de lunares",
          "anti-edad",
          "cuidado de la piel",
        ],
        locationId: locations[4].id,
        rating: 4.8,
        reviewCount: 95,
        isVerified: true,
        isActive: true,
      },
    }),
    // Cardiólogo
    prisma.professionalProfile.create({
      data: {
        userId: professionals[5].id,
        email: professionals[5].email,
        name: "Dr. Javier Silva",
        bio: "Cardiólogo especializado en prevención cardiovascular",
        description:
          "Médico cardiólogo con 18 años de experiencia. Especialista en prevención de enfermedades cardiovasculares, control de hipertensión arterial, arritmias y rehabilitación cardiaca. Enfoque en medicina preventiva y estilo de vida saludable.",
        pricePerSession: 45000.0,
        standardDuration: 45,
        serviceCategoryId: categories[5].id,
        tags: [
          "hipertensión",
          "arritmias",
          "prevención cardiovascular",
          "rehabilitación cardiaca",
          "electrocardiograma",
        ],
        locationId: locations[5].id,
        rating: 4.9,
        reviewCount: 178,
        isVerified: true,
        isActive: true,
      },
    }),
  ]);

  // 7. Crear horarios de disponibilidad para profesionales
  console.log("📅 Creating availability slots...");
  for (let i = 0; i < professionalProfiles.length; i++) {
    const profile = professionalProfiles[i];

    // Crear slots recurrentes para cada profesional (Lunes a Viernes)
    const daysOfWeek = [
      DayOfWeek.MONDAY,
      DayOfWeek.TUESDAY,
      DayOfWeek.WEDNESDAY,
      DayOfWeek.THURSDAY,
      DayOfWeek.FRIDAY,
    ];

    for (const day of daysOfWeek) {
      await prisma.availabilitySlot.create({
        data: {
          professionalId: profile.id,
          type: SlotType.RECURRING,
          dayOfWeek: day,
          startTime: "09:00",
          endTime: "17:00",
          isActive: true,
        },
      });
    }

    // Algunos profesionales también trabajan sábados
    if (i % 2 === 0) {
      await prisma.availabilitySlot.create({
        data: {
          professionalId: profile.id,
          type: SlotType.RECURRING,
          dayOfWeek: DayOfWeek.SATURDAY,
          startTime: "09:00",
          endTime: "13:00",
          isActive: true,
        },
      });
    }
  }

  // 8. Crear reservas realistas
  console.log("📝 Creating bookings...");
  const now = new Date();
  const bookings = [];

  for (let i = 0; i < 15; i++) {
    const client = clients[i % clients.length];
    const professional = professionalProfiles[i % professionalProfiles.length];

    // Fechas variadas: algunas pasadas, algunas futuras
    const daysFromNow = (i % 10) - 5; // -5 a +4 días
    const scheduledDate = new Date(now);
    scheduledDate.setDate(scheduledDate.getDate() + daysFromNow);
    scheduledDate.setHours(9 + (i % 8), 0, 0, 0); // Horas entre 9:00 y 16:00

    const booking = await prisma.booking.create({
      data: {
        clientId: client.id,
        professionalId: professional.id,
        scheduledAt: scheduledDate,
        duration: professional.standardDuration,
        price: professional.pricePerSession,
        notes: `Consulta programada para Cliente ${i + 1}`,
        status:
          daysFromNow < 0
            ? BookingStatus.COMPLETED
            : daysFromNow === 0
              ? BookingStatus.CONFIRMED
              : BookingStatus.PENDING,
        meetingStatus:
          daysFromNow < 0
            ? MeetingStatus.COMPLETED
            : daysFromNow === 0
              ? MeetingStatus.ACTIVE
              : MeetingStatus.PENDING,
        jitsiRoom: `session-${Date.now()}-${i}`,
      },
    });

    bookings.push(booking);
  }

  // 9. Crear pagos para las reservas
  console.log("💳 Creating payments...");
  for (let i = 0; i < bookings.length; i++) {
    const booking = bookings[i];

    if (booking.status !== BookingStatus.PENDING) {
      const priceAsNumber = Number(booking.price);

      const payment = await prisma.payment.create({
        data: {
          provider: "MERCADOPAGO",
          preferenceId: `pref_${Date.now()}_${i}`,
          paymentId: `pay_${Date.now()}_${i}`,
          gatewayPaymentId: `mp_${Date.now()}_${i}`,
          status: PaymentStatus.APPROVED,
          amount: booking.price,
          fee: parseFloat((priceAsNumber * 0.03).toFixed(2)), // 3% de fee
          gatewayFees: parseFloat((priceAsNumber * 0.029).toFixed(2)), // 2.9% fee de MP
          platformFee: parseFloat((priceAsNumber * 0.15).toFixed(2)), // 15% fee de plataforma
          netAmount: parseFloat((priceAsNumber * 0.821).toFixed(2)), // Monto neto para el profesional
          currency: "ARS",
          paidAt: new Date(booking.createdAt.getTime() + 60000), // 1 minuto después de crear la reserva
          metadata: {
            bookingId: booking.id,
            clientName: `Cliente ${i + 1}`,
          },
        },
      });

      // Actualizar booking con el ID del Payment creado
      await prisma.booking.update({
        where: { id: booking.id },
        data: { paymentId: payment.id },
      });
    }
  }

  // 10. Crear reseñas para reservas completadas
  console.log("⭐ Creating reviews...");
  const completedBookings = bookings.filter(
    b => b.status === BookingStatus.COMPLETED
  );

  for (let i = 0; i < completedBookings.length; i++) {
    const booking = completedBookings[i];
    const rating = 4 + Math.random(); // Rating entre 4.0 y 5.0

    const comments = [
      "Excelente profesional, muy recomendable.",
      "Muy buena atención, resolvió todas mis dudas.",
      "Profesional muy preparado y empático.",
      "Consulta muy útil, quedé muy conforme.",
      "Tratamiento efectivo, volveré a consultar.",
      "Muy profesional y dedicado, excelente servicio.",
    ];

    await prisma.review.create({
      data: {
        bookingId: booking.id,
        clientId: booking.clientId,
        professionalId: booking.professionalId,
        rating: Math.round(rating * 10) / 10, // Redondear a 1 decimal
        comment: comments[i % comments.length],
        visible: true,
      },
    });
  }

  // 11. Crear notificaciones
  console.log("🔔 Creating notifications...");
  const allUsers = [...professionals, ...clients, admin];

  for (let i = 0; i < 20; i++) {
    const user = allUsers[i % allUsers.length];
    const notifications = [
      {
        title: "Nueva reserva confirmada",
        message: "Tu reserva ha sido confirmada exitosamente",
      },
      {
        title: "Recordatorio de sesión",
        message: "Tienes una sesión programada para mañana",
      },
      {
        title: "Pago procesado",
        message: "Tu pago ha sido procesado correctamente",
      },
      {
        title: "Nueva reseña recibida",
        message: "Has recibido una nueva reseña de 5 estrellas",
      },
      {
        title: "Actualización de perfil",
        message: "Tu perfil ha sido actualizado",
      },
    ];

    const notification = notifications[i % notifications.length];

    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "SYSTEM_NOTIFICATION",
        title: notification.title,
        message: notification.message,
        payload: { timestamp: new Date().toISOString() },
        readAt: Math.random() > 0.5 ? new Date() : null, // 50% leídas
      },
    });
  }

  console.log("✅ Database seeded successfully!");
  console.log("\n📊 Summary:");
  console.log(
    `👥 Users: ${allUsers.length} (1 admin, ${professionals.length} professionals, ${clients.length} clients)`
  );
  console.log(`🎯 Service Categories: ${categories.length}`);
  console.log(`📍 Locations: ${locations.length}`);
  console.log(`👨‍⚕️ Professional Profiles: ${professionalProfiles.length}`);
  console.log(`📝 Bookings: ${bookings.length}`);
  console.log(`⭐ Reviews: ${completedBookings.length}`);
  console.log(
    `💳 Payments: ${
      bookings.filter(b => b.status !== BookingStatus.PENDING).length
    }`
  );
  console.log(`🔔 Notifications: 20`);

  console.log("\n🔑 Test Credentials:");
  console.log("Admin: admin@profesional.com / 123456");
  console.log("Professional: dra.martinez@psicologia.com / 123456");
  console.log("Client: cliente1@email.com / 123456");
}

main()
  .catch(e => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
