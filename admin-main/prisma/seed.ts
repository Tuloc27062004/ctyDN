import { Role, UserStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/password";

async function upsertAdminByEmail(data: {
  email: string;
  fullName: string;
  phone: string;
  country?: string | null;
  companyName?: string | null;
  companyAddress?: string | null;
  password: string;
}) {
  return prisma.user.upsert({
    where: { email: data.email },
    update: {
      fullName: data.fullName,
      phone: data.phone,
      country: data.country ?? null,
      companyName: data.companyName ?? null,
      companyAddress: data.companyAddress ?? null,
      password: data.password,
      role: Role.ADMIN,
      status: UserStatus.ACCEPTED,
      isActive: true,
      verifyToken: null,
      verifyTokenExp: null,
    },
    create: {
      email: data.email,
      fullName: data.fullName,
      phone: data.phone,
      country: data.country ?? null,
      companyName: data.companyName ?? null,
      companyAddress: data.companyAddress ?? null,
      password: data.password,
      role: Role.ADMIN,
      status: UserStatus.ACCEPTED,
      isActive: true,
    },
  });
}

async function main() {
  const adminPassword = await hashPassword(
    process.env.ADMIN_SEED_PASSWORD || "Admin@123"
  );

  const admin = await upsertAdminByEmail({
    email: process.env.ADMIN_SEED_EMAIL || "admin@demo.com",
    fullName: process.env.ADMIN_SEED_NAME || "Demo Admin",
    phone: process.env.ADMIN_SEED_PHONE || "0900000001",
    country: process.env.ADMIN_SEED_COUNTRY || "Vietnam",
    companyName: process.env.ADMIN_SEED_COMPANY || "Demo Inc",
    companyAddress:
      process.env.ADMIN_SEED_COMPANY_ADDRESS || "Ho Chi Minh City",
    password: adminPassword,
  });

  console.log("Admin seed complete.");
  console.log({
    adminId: admin.id,
    email: admin.email,
    role: admin.role,
    status: admin.status,
  });
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });