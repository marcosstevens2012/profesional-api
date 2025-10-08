import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function updatePasswords() {
  console.log("🔐 Actualizando contraseñas con hash correcto...");

  const correctHash =
    "$2y$10$JdthbplYTQTMh8WtUN.3ReIHPsINwqU22H5GenoRQmK/ucUyLhlJS"; // test123

  await prisma.user.updateMany({
    where: {
      email: { in: ["cliente@test.com", "profesional@test.com"] },
    },
    data: {
      password: correctHash,
    },
  });

  console.log("✅ Contraseñas actualizadas correctamente");
  console.log("🔑 Ahora puedes usar 'test123' para login");
}

updatePasswords()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
