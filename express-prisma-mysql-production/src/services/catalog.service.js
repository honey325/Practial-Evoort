import { prisma } from "../lib/prisma.js";

async function listBusinesses({ page, limit, search, categoryId, city }) {
  const where = {
    status: "ACTIVE", deletedAt: null,
    ...(categoryId ? { categoryId } : {}),
    ...(city ? { city: { contains: city } } : {}),
    ...(search ? { OR: [{ name: { contains: search } }, { description: { contains: search } }, { city: { contains: search } }] } : {})
  };
  const [data, total] = await prisma.$transaction([
    prisma.business.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { name: "asc" }, select: { id: true, name: true, description: true, category: { select: { id: true, name: true } }, city: true, state: true, country: true, timezone: true } }),
    prisma.business.count({ where })
  ]);
  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

async function getBusiness(businessId) {
  const data = await prisma.business.findFirst({ where: { id: businessId, status: "ACTIVE", deletedAt: null }, select: { id: true, name: true, description: true, email: true, phone: true, address: true, city: true, state: true, country: true, timezone: true, category: { select: { id: true, name: true } }, services: { where: { status: "ACTIVE", deletedAt: null }, select: { id: true, name: true, description: true, durationMinutes: true, basePrice: true, category: { select: { id: true, name: true } } }, orderBy: { name: "asc" } } } });
  if (!data) { const e = new Error("Business not found"); e.statusCode = 404; throw e; }
  return data;
}

export { listBusinesses, getBusiness };
