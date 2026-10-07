import { prisma } from "../lib/prisma.js";
function httpError(message, statusCode) { const e = new Error(message); e.statusCode = statusCode; return e; }
async function listPlans(includeInactive = false) { return prisma.subscriptionPlan.findMany({ where: { deletedAt: null, ...(includeInactive ? {} : { status: true }) }, orderBy: { price: "asc" } }); }
async function createPlan(data) { return prisma.subscriptionPlan.create({ data }); }
async function updatePlan(id, data) { const r = await prisma.subscriptionPlan.updateMany({ where: { id, deletedAt: null }, data }); if (!r.count) throw httpError("Subscription plan not found", 404); return prisma.subscriptionPlan.findUnique({ where: { id } }); }
async function deletePlan(id) { const r = await prisma.subscriptionPlan.updateMany({ where: { id, deletedAt: null }, data: { status: false, deletedAt: new Date() } }); if (!r.count) throw httpError("Subscription plan not found", 404); }
async function listSubscriptions({ page, limit, status }) {
  const where = { deletedAt: null, ...(status ? { status } : {}) };
  const [data, total] = await prisma.$transaction([prisma.businessSubscription.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: "desc" }, include: { business: { select: { id: true, name: true, ownerId: true } }, plan: true } }), prisma.businessSubscription.count({ where })]);
  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}
async function updateSubscriptionStatus(id, status) { const r = await prisma.businessSubscription.updateMany({ where: { id, deletedAt: null }, data: { status } }); if (!r.count) throw httpError("Subscription not found", 404); return prisma.businessSubscription.findUnique({ where: { id }, include: { business: { select: { id: true, name: true } }, plan: true } }); }
async function assertOwnedBusiness(businessId, ownerId) { const b = await prisma.business.findFirst({ where: { id: businessId, ownerId, deletedAt: null }, select: { id: true } }); if (!b) throw httpError("Business not found", 404); }
async function getBusinessSubscription(businessId, ownerId) { await assertOwnedBusiness(businessId, ownerId); return prisma.businessSubscription.findMany({ where: { businessId, deletedAt: null }, include: { plan: true, payments: { select: { id: true, amount: true, currency: true, paymentStatus: true, paidAt: true, createdAt: true } } }, orderBy: { createdAt: "desc" } }); }
async function subscribe(businessId, ownerId, planId) {
  await assertOwnedBusiness(businessId, ownerId);
  const plan = await prisma.subscriptionPlan.findFirst({ where: { id: planId, status: true, deletedAt: null } });
  if (!plan) throw httpError("Subscription plan not found or inactive", 404);
  const existing = await prisma.businessSubscription.findFirst({ where: { businessId, status: { in: ["ACTIVE", "PENDING"] }, deletedAt: null }, select: { id: true } });
  if (existing) throw httpError("Business already has an active or pending subscription", 409);
  return prisma.businessSubscription.create({ data: { businessId, planId, startDate: new Date(), status: Number(plan.price) === 0 ? "ACTIVE" : "PENDING" }, include: { plan: true } });
}
export { listPlans, createPlan, updatePlan, deletePlan, listSubscriptions, updateSubscriptionStatus, getBusinessSubscription, subscribe };
