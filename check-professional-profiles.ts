import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkData() {
  console.log("📋 Verificando ProfessionalProfiles existentes...");

  const professionalProfiles = await prisma.professionalProfile.findMany({
    include: {
      user: {
        include: {
          profile: true,
        },
      },
      serviceCategory: true,
      location: true,
    },
  });

  console.log(
    `🔍 ProfessionalProfiles encontrados: ${professionalProfiles.length}`
  );

  professionalProfiles.forEach((prof, i) => {
    console.log(`\n👨‍💼 Profesional ${i + 1}:`);
    console.log(`  ID: ${prof.id}`);
    console.log(`  Nombre: ${prof.name}`);
    console.log(`  Email: ${prof.email}`);
    console.log(`  Bio: ${prof.bio}`);
    console.log(`  Precio: $${prof.pricePerSession}`);
    console.log(`  Rating: ${prof.rating}`);
    console.log(`  Categoría: ${prof.serviceCategory.name}`);
    console.log(
      `  Ubicación: ${prof.location.city}, ${prof.location.province}`
    );
    console.log(
      `  Usuario: ${prof.user.profile?.firstName} ${prof.user.profile?.lastName}`
    );
  });

  // También verificar cuántos hay en total
  const total = await prisma.professionalProfile.count();
  console.log(`\n📊 Total de ProfessionalProfiles: ${total}`);
}

checkData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
