import { prisma } from "../lib/prisma.js";
function rangeFilter({ from, to }) {
  return from || to ? { gte: from ? new Date(`${from}T00:00:00.000Z`) : undefined, lte: to ? new Date(`${to}T23:59:59.999Z`) : undefined } : undefined;
}
async function summary({ from, to }, businessId) {
  const dateRange = rangeFilter({ from, to });
  const bookingWhere = { deletedAt: null, ...(businessId ? { businessId } : {}), ...(dateRange ? { createdAt: dateRange } : {}) };
  const [bookingCount, byStatus, bookings, usersByRole, businessCount, totalRevenue] = await Promise.all([
    prisma.booking.count({ where: bookingWhere }),
    prisma.booking.groupBy({ by: ["status"], where: bookingWhere, _count: { _all: true } }),
    prisma.booking.findMany({ where: bookingWhere, select: { createdAt: true, totalPrice: true, status: true } }),
    businessId ? Promise.resolve([]) : prisma.user.groupBy({ by: ["role"], where: { deletedAt: null }, _count: { _all: true } }),
    businessId ? Promise.resolve(undefined) : prisma.business.count({ where: { deletedAt: null } }),
    prisma.booking.aggregate({ where: { ...bookingWhere, status: { in: ["CONFIRMED", "COMPLETED"] } }, _sum: { totalPrice: true } })
  ]);
  const buckets = new Map();
  for (const booking of bookings) {
    const key = booking.createdAt.toISOString().slice(0, 10);
    const current = buckets.get(key) || { date: key, bookings: 0, revenue: 0 };
    current.bookings += 1;
    if (["CONFIRMED", "COMPLETED"].includes(booking.status)) current.revenue += Number(booking.totalPrice);
    buckets.set(key, current);
  }
  return { filters: { from: from ?? null, to: to ?? null }, totals: { bookings: bookingCount, revenue: Number(totalRevenue._sum.totalPrice ?? 0), ...(businessId ? {} : { businesses: businessCount }) }, bookingsByStatus: Object.fromEntries(byStatus.map((item) => [item.status, item._count._all])), ...(businessId ? {} : { usersByRole: Object.fromEntries(usersByRole.map((item) => [item.role, item._count._all])) }), daily: [...buckets.values()].sort((a, b) => a.date.localeCompare(b.date)) };
}
async function businessSummary(filters, businessId, ownerId) {
  const business = await prisma.business.findFirst({ where: { id: businessId, ownerId, deletedAt: null }, select: { id: true } });
  if (!business) { const e = new Error("Business not found"); e.statusCode = 404; throw e; }
  return summary(filters, businessId);
}
export { summary, businessSummary };
