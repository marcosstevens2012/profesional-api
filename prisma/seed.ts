import {
  BookingStatus,
  DayOfWeek,
  MeetingStatus,
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
        country: "Argentina",
        province: "Ciudad Autónoma de Buenos Aires",
        city: "Palermo",
        postalCode: "C1425",
      },
    }),
    prisma.location.create({
      data: {
        country: "Argentina",
        province: "Ciudad Autónoma de Buenos Aires",
        city: "Recoleta",
        postalCode: "C1113",
      },
    }),
    prisma.location.create({
      data: {
        country: "Argentina",
        province: "Buenos Aires",
        city: "San Isidro",
        postalCode: "B1642",
      },
    }),
    prisma.location.create({
      data: {
        country: "Argentina",
        province: "Córdoba",
        city: "Córdoba Capital",
        postalCode: "X5000",
      },
    }),
    prisma.location.create({
      data: {
        country: "Argentina",
        province: "Santa Fe",
        city: "Rosario",
        postalCode: "S2000",
      },
    }),
    prisma.location.create({
      data: {
        country: "Argentina",
        province: "Mendoza",
        city: "Mendoza Capital",
        postalCode: "M5500",
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
      firstName: "Administrador",
      lastName: "Sistema",
      phone: "+54 11 1234-5678",
      birthDate: new Date("1985-01-01"),
      isEmailVerified: true,
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
        firstName: "María Elena",
        lastName: "Martínez",
        phone: "+54 11 4567-8901",
        birthDate: new Date("1980-03-15"),
        isEmailVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: "lic.rodriguez@nutricion.com",
        password: hashedPassword,
        role: UserRole.PROFESSIONAL,
        status: UserStatus.ACTIVE,
        firstName: "Carlos",
        lastName: "Rodríguez",
        phone: "+54 11 4567-8902",
        birthDate: new Date("1978-07-22"),
        isEmailVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: "lic.gonzalez@kinesiologia.com",
        password: hashedPassword,
        role: UserRole.PROFESSIONAL,
        status: UserStatus.ACTIVE,
        firstName: "Ana",
        lastName: "González",
        phone: "+54 11 4567-8903",
        birthDate: new Date("1985-11-08"),
        isEmailVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: "dr.lopez@medicina.com",
        password: hashedPassword,
        role: UserRole.PROFESSIONAL,
        status: UserStatus.ACTIVE,
        firstName: "Roberto",
        lastName: "López",
        phone: "+54 11 4567-8904",
        birthDate: new Date("1975-09-12"),
        isEmailVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: "dra.fernandez@dermatologia.com",
        password: hashedPassword,
        role: UserRole.PROFESSIONAL,
        status: UserStatus.ACTIVE,
        firstName: "Laura",
        lastName: "Fernández",
        phone: "+54 11 4567-8905",
        birthDate: new Date("1982-05-30"),
        isEmailVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: "dr.silva@cardiologia.com",
        password: hashedPassword,
        role: UserRole.PROFESSIONAL,
        status: UserStatus.ACTIVE,
        firstName: "Javier",
        lastName: "Silva",
        phone: "+54 11 4567-8906",
        birthDate: new Date("1977-12-03"),
        isEmailVerified: true,
      },
    }),
  ]);

  // Clientes
  const clients = await Promise.all([
    prisma.user.create({
      data: {
        email: "cliente1@email.com",
        password: hashedPassword,
        role: UserRole.CLIENT,
        status: UserStatus.ACTIVE,
        firstName: "Pedro",
        lastName: "Gómez",
        phone: "+54 11 5678-9001",
        birthDate: new Date("1990-06-15"),
        isEmailVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: "cliente2@email.com",
        password: hashedPassword,
        role: UserRole.CLIENT,
        status: UserStatus.ACTIVE,
        firstName: "Sofia",
        lastName: "Ruiz",
        phone: "+54 11 5678-9002",
        birthDate: new Date("1992-08-25"),
        isEmailVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: "cliente3@email.com",
        password: hashedPassword,
        role: UserRole.CLIENT,
        status: UserStatus.ACTIVE,
        firstName: "Diego",
        lastName: "Morales",
        phone: "+54 11 5678-9003",
        birthDate: new Date("1988-04-10"),
        isEmailVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: "cliente4@email.com",
        password: hashedPassword,
        role: UserRole.CLIENT,
        status: UserStatus.ACTIVE,
        firstName: "Valentina",
        lastName: "Torres",
        phone: "+54 11 5678-9004",
        birthDate: new Date("1995-02-18"),
        isEmailVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: "cliente5@email.com",
        password: hashedPassword,
        role: UserRole.CLIENT,
        status: UserStatus.ACTIVE,
        firstName: "Martín",
        lastName: "Herrera",
        phone: "+54 11 5678-9005",
        birthDate: new Date("1987-11-22"),
        isEmailVerified: true,
      },
    }),
  ]);

  console.log("✅ Created users:", users.length);

  // 2. Crear ubicaciones
  const locations = await Promise.all([
    prisma.location.create({
      data: {
        province: "Buenos Aires",
        city: "CABA",
        latitude: -34.6118,
        longitude: -58.396,
      },
    }),
    prisma.location.create({
      data: {
        province: "Buenos Aires",
        city: "La Plata",
        latitude: -34.9205,
        longitude: -57.9536,
      },
    }),
    prisma.location.create({
      data: {
        province: "Córdoba",
        city: "Córdoba",
        latitude: -31.4201,
        longitude: -64.1888,
      },
    }),
  ]);

  console.log("✅ Created locations:", locations.length);

  // 3. Hash para passwords
  const hashPassword = (password: string) => bcrypt.hashSync(password, 10);

  // 4. Crear usuarios cliente
  const clientUser = await prisma.user.create({
    data: {
      email: "cliente@ejemplo.com",
      password: hashPassword("password123"),
      role: UserRole.CLIENT,
      status: UserStatus.ACTIVE,
      profile: {
        create: {
          firstName: "Juan",
          lastName: "Pérez",
          phone: "+5491123456789",
        },
      },
    },
  });

  console.log("✅ Created client user");

  // 5. Crear usuarios profesionales
  await prisma.user.create({
    data: {
      email: "psicologo@ejemplo.com",
      password: hashPassword("password123"),
      role: UserRole.PROFESSIONAL,
      status: UserStatus.ACTIVE,
      profile: {
        create: {
          firstName: "María",
          lastName: "González",
          phone: "+5491198765432",
          avatar:
            "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400",
        },
      },
      professionalProfile: {
        create: {
          bio: "Psicóloga clínica especializada en terapia cognitivo-conductual",
          description: `Psicóloga clínica con más de 8 años de experiencia en el tratamiento de ansiedad, depresión y trastornos del estado del ánimo.

Especializada en terapia cognitivo-conductual (TCC) y mindfulness. Mi enfoque se centra en proporcionar herramientas prácticas para el manejo del estrés y la mejora del bienestar emocional.

Sesiones online y presenciales disponibles.`,
          pricePerSession: 15000,
          standardDuration: 50,
          serviceCategoryId: categories[0].id, // Psicología
          locationId: locations[0].id, // CABA
          tags: ["ansiedad", "depresión", "tcc", "mindfulness", "adultos"],
          rating: 4.8,
          reviewCount: 24,
          isVerified: true,
        },
      },
    },
  });

  await prisma.user.create({
    data: {
      email: "nutricionista@ejemplo.com",
      password: hashPassword("password123"),
      role: UserRole.PROFESSIONAL,
      status: UserStatus.ACTIVE,
      profile: {
        create: {
          firstName: "Carlos",
          lastName: "Rodríguez",
          phone: "+5491134567890",
          avatar:
            "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400",
        },
      },
      professionalProfile: {
        create: {
          bio: "Nutricionista especializado en planes personalizados y deportivo",
          description: `Licenciado en Nutrición con especialización en nutrición deportiva y clínica.

Trabajo con personas que buscan mejorar su composición corporal, rendir mejor en el deporte, o simplemente adoptar hábitos alimentarios más saludables.

Mis planes son 100% personalizados y se adaptan a tu estilo de vida, gustos y objetivos específicos.`,
          pricePerSession: 12000,
          standardDuration: 45,
          serviceCategoryId: categories[1].id, // Nutrición
          locationId: locations[1].id, // La Plata
          tags: [
            "planes-nutricionales",
            "deportivo",
            "pérdida-peso",
            "masa-muscular",
          ],
          rating: 4.9,
          reviewCount: 18,
          isVerified: true,
        },
      },
    },
  });

  await prisma.user.create({
    data: {
      email: "trainer@ejemplo.com",
      password: hashPassword("password123"),
      role: UserRole.PROFESSIONAL,
      status: UserStatus.ACTIVE,
      profile: {
        create: {
          firstName: "Ana",
          lastName: "Martínez",
          phone: "+5491145678901",
          avatar:
            "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
        },
      },
      professionalProfile: {
        create: {
          bio: "Personal Trainer especializada en funcional y fuerza",
          description: `Personal Trainer certificada con 5 años de experiencia en entrenamiento funcional, fuerza y acondicionamiento físico.

Especializada en:
• Entrenamiento funcional
• Desarrollo de fuerza
• Pérdida de peso
• Preparación física general

Sesiones presenciales y online. Planes de entrenamiento personalizados según tus objetivos.`,
          pricePerSession: 8000,
          standardDuration: 60,
          serviceCategoryId: categories[2].id, // Fitness
          locationId: locations[2].id, // Córdoba
          tags: [
            "funcional",
            "fuerza",
            "cardio",
            "peso-libre",
            "principiantes",
          ],
          rating: 4.7,
          reviewCount: 31,
          isVerified: false, // No verificado aún
        },
      },
    },
  });
  console.log("✅ Created professional users:", 3);

  // 6. Crear admin
  await prisma.user.create({
    data: {
      email: "admin@profesional.com",
      password: hashPassword("admin123"),
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      profile: {
        create: {
          firstName: "Admin",
          lastName: "Sistema",
        },
      },
    },
  });

  console.log("✅ Created admin user");

  // 7. Crear slots de disponibilidad para profesionales
  const professionalProfiles = await prisma.professionalProfile.findMany();

  for (const prof of professionalProfiles) {
    // Slots recurrentes de lunes a viernes
    const weekdaySlots = [
      DayOfWeek.MONDAY,
      DayOfWeek.TUESDAY,
      DayOfWeek.WEDNESDAY,
      DayOfWeek.THURSDAY,
      DayOfWeek.FRIDAY,
    ];

    for (const day of weekdaySlots) {
      await prisma.availabilitySlot.create({
        data: {
          professionalId: prof.id,
          type: SlotType.RECURRING,
          dayOfWeek: day,
          startTime: "09:00",
          endTime: "17:00",
          isActive: true,
        },
      });
    }

    // Algunos slots específicos para fines de semana
    const nextSaturday = new Date();
    nextSaturday.setDate(
      nextSaturday.getDate() + ((6 - nextSaturday.getDay()) % 7)
    );

    await prisma.availabilitySlot.create({
      data: {
        professionalId: prof.id,
        type: SlotType.ONE_TIME,
        specificDate: nextSaturday,
        specificStart: new Date(nextSaturday.getTime() + 10 * 60 * 60 * 1000), // 10:00
        specificEnd: new Date(nextSaturday.getTime() + 14 * 60 * 60 * 1000), // 14:00
        isActive: true,
      },
    });
  }

  console.log("✅ Created availability slots");

  // 8. Crear reglas de comisión
  await prisma.commissionRule.create({
    data: {
      percentage: 15.0, // 15% de comisión
      fixedFee: 100, // $100 fee fijo
      isActive: true,
    },
  });

  console.log("✅ Created commission rules");

  // 9. Crear algunas notificaciones para el cliente
  await prisma.notification.create({
    data: {
      userId: clientUser.id,
      type: "SYSTEM_NOTIFICATION",
      title: "Bienvenido a Profesional",
      message:
        "Tu cuenta ha sido creada exitosamente. ¡Explora y encuentra a tu profesional ideal!",
      payload: { welcome: true },
    },
  });

  console.log("✅ Created notifications");

  console.log("🎉 Database seed completed successfully!");
  console.log("📊 Summary:");
  console.log(`- Service Categories: ${categories.length}`);
  console.log(`- Locations: ${locations.length}`);
  console.log("- Users: 1 client + 3 professionals + 1 admin = 5 total");
  console.log("- Availability slots created for all professionals");
  console.log("- Commission rules configured");

  // ===== CITAS DE PRUEBA =====
  console.log("📅 Creating sample bookings...");

  // Obtener algunos usuarios y profesionales para crear citas
  const clients = await prisma.user.findMany({
    where: { role: UserRole.CLIENT },
    take: 3,
  });

  const professionals = await prisma.professionalProfile.findMany({
    include: { user: true },
    take: 3,
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(14, 0, 0, 0); // 14:00 mañana

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(10, 0, 0, 0); // 10:00 próxima semana

  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);
  lastWeek.setHours(16, 0, 0, 0); // 16:00 semana pasada

  // Cita completada (semana pasada)
  if (clients[0] && professionals[0]) {
    await prisma.booking.create({
      data: {
        clientId: clients[0].id,
        professionalId: professionals[0].id,
        scheduledAt: lastWeek,
        duration: 60,
        price: professionals[0].pricePerSession,
        status: BookingStatus.COMPLETED,
        meetingStatus: MeetingStatus.COMPLETED,
        notes: "Consulta inicial - muy satisfecho con el profesional",
        jitsiRoom: `room-${uuidv4().split("-")[0]}`,
      },
    });
  }

  // Cita confirmada para mañana
  if (clients[1] && professionals[1]) {
    await prisma.booking.create({
      data: {
        clientId: clients[1].id,
        professionalId: professionals[1].id,
        scheduledAt: tomorrow,
        duration: 50,
        price: professionals[1].pricePerSession,
        status: BookingStatus.CONFIRMED,
        meetingStatus: MeetingStatus.PENDING,
        notes: "Segunda sesión de seguimiento",
        jitsiRoom: `room-${uuidv4().split("-")[0]}`,
      },
    });
  }

  // Cita pendiente para próxima semana
  if (clients[2] && professionals[2]) {
    await prisma.booking.create({
      data: {
        clientId: clients[2].id,
        professionalId: professionals[2].id,
        scheduledAt: nextWeek,
        duration: 45,
        price: professionals[2].pricePerSession,
        status: BookingStatus.PENDING_PAYMENT,
        meetingStatus: MeetingStatus.PENDING,
        notes: "Primera consulta",
        jitsiRoom: `room-${uuidv4().split("-")[0]}`,
      },
    });
  }

  // Citas adicionales para tener más datos
  if (clients[0] && professionals[1]) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(11, 0, 0, 0);

    await prisma.booking.create({
      data: {
        clientId: clients[0].id,
        professionalId: professionals[1].id,
        scheduledAt: yesterday,
        duration: 60,
        price: professionals[1].pricePerSession,
        status: BookingStatus.COMPLETED,
        meetingStatus: MeetingStatus.COMPLETED,
        notes: "Excelente sesión de seguimiento",
        jitsiRoom: `room-${uuidv4().split("-")[0]}`,
      },
    });
  }

  if (clients[1] && professionals[0]) {
    const dayAfterTomorrow = new Date();
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    dayAfterTomorrow.setHours(15, 30, 0, 0);

    await prisma.booking.create({
      data: {
        clientId: clients[1].id,
        professionalId: professionals[0].id,
        scheduledAt: dayAfterTomorrow,
        duration: 50,
        price: professionals[0].pricePerSession,
        status: BookingStatus.CONFIRMED,
        meetingStatus: MeetingStatus.PENDING,
        notes: "Sesión de terapia grupal",
        jitsiRoom: `room-${uuidv4().split("-")[0]}`,
      },
    });
  }

  console.log("✅ Sample bookings created");

  console.log("\n🔐 Test credentials:");
  console.log("Client: cliente@ejemplo.com / password123");
  console.log("Professional 1: psicologo@ejemplo.com / password123");
  console.log("Professional 2: nutricionista@ejemplo.com / password123");
  console.log("Professional 3: trainer@ejemplo.com / password123");
  console.log("Admin: admin@profesional.com / admin123");
}

main()
  .catch(e => {
    console.error("❌ Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
