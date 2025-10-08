import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkUsers() {
  console.log("📋 Verificando usuarios existentes...");

  const users = await prisma.user.findMany({
    where: {
      email: { in: ["cliente@test.com", "profesional@test.com"] },
    },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      password: true,
      deletedAt: true,
      profile: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  console.log("🔍 Usuarios encontrados:", users.length);
  users.forEach((user, i) => {
    console.log(`\n👤 Usuario ${i + 1}:`);
    console.log(`  ID: ${user.id}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Role: ${user.role}`);
    console.log(`  Status: ${user.status}`);
    console.log(`  Deleted: ${user.deletedAt ? "YES" : "NO"}`);
    console.log(`  Password Hash: ${user.password.substring(0, 20)}...`);
    console.log(
      `  Profile: ${user.profile?.firstName} ${user.profile?.lastName}`
    );
  });
}

checkUsers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
