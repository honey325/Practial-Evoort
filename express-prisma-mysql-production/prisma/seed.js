import { UserRole } from "@prisma/client";
import { hashPassword } from "../src/lib/password.js";
import "dotenv/config";

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const plans = [
  { name: "Starter", description: "For a new business", price: "0.00", billingCycle: "MONTHLY", maxStaff: 2, maxServices: 10, maxMonthlyBookings: 100 },
  { name: "Growth", description: "For growing businesses", price: "999.00", billingCycle: "MONTHLY", maxStaff: 10, maxServices: 50, maxMonthlyBookings: 1000 },
  { name: "Pro", description: "For established businesses", price: "2499.00", billingCycle: "MONTHLY", maxStaff: null, maxServices: null, maxMonthlyBookings: null }
];

async function seedPlans() {
  for (const plan of plans) {
    const existing = await prisma.subscriptionPlan.findFirst({
      where: { name: plan.name, billingCycle: plan.billingCycle, deletedAt: null }
    });
    if (existing) {
      console.log(`Subscription plan already exists: ${plan.name}`);
      continue;
    }
    await prisma.subscriptionPlan.create({ data: plan });
    console.log(`Created subscription plan: ${plan.name}`);
  }
}

async function seedRoles() {
  
  const roles = ["SUPER_ADMIN", "BUSINESS_OWNER", "STAFF", "CUSTOMER"];
  for (const role of roles) {
    if (!Object.hasOwn(UserRole, role)) throw new Error(`UserRole enum is missing ${role}`);
  }
  console.log("Verified UserRole enum values (Prisma enums do not require database rows).");
}

async function seedUsers() {
  
  const users = [
    { name: "Super Admin", email: process.env.SEED_ADMIN_EMAIL || "admin@example.com", role: "SUPER_ADMIN", password: process.env.SEED_ADMIN_PASSWORD || "Admin@12345" },
    { name: "Sample Business Owner", email: "owner@example.com", role: "BUSINESS_OWNER", password: "Owner@12345" },
    { name: "Sample Staff", email: "staff@example.com", role: "STAFF", password: "Staff@12345" },
    { name: "Sample Customer", email: "customer@example.com", role: "CUSTOMER", password: "Customer@12345" }
  ];

  for (const { password, ...user } of users) {
    const existing = await prisma.user.findUnique({ where: { email: user.email } });
    if (existing) {
      console.log(`User already exists: ${user.email}`);
      continue;
    }
    await prisma.user.create({ data: { ...user, passwordHash: await hashPassword(password) } });
    console.log(`Created ${user.role} user: ${user.email}`);
  }
}

async function main() {
  const requested = process.argv[2];
  if (requested && !["--roles", "--plans", "--users"].includes(requested)) {
    throw new Error(`Unknown seed option: ${requested}`);
  }
  if (!requested) {
    await seedRoles();
    await seedPlans();
    await seedUsers();
  } else if (requested === "--roles") {
    await seedRoles();
  } else if (requested === "--plans") {
    await seedPlans();
  } else if (requested === "--users") {
    await seedRoles();
    await seedUsers();
  }
  console.log("Database seed completed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
