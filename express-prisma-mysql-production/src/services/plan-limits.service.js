function httpError(message, statusCode = 403) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function getActivePlan(tx, businessId) {
  const now = new Date();
  const subscriptions = await tx.businessSubscription.findMany({
    where: { businessId, status: "ACTIVE", deletedAt: null, startDate: { lte: now } },
    include: { plan: true },
    orderBy: { createdAt: "desc" }
  });
  const subscription = subscriptions.find(({ endDate, plan }) =>
    (!endDate || endDate > now) && plan.status && !plan.deletedAt
  );
  if (!subscription) {
    throw httpError("This business has no active subscription. Choose or renew a plan to continue.");
  }
  return subscription.plan;
}

const resourceLimits = {
  staff: { field: "maxStaff", model: "staffProfile", label: "staff member" },
  services: { field: "maxServices", model: "businessService", label: "service" }
};

async function assertCanAddResource(tx, businessId, resource) {
  const definition = resourceLimits[resource];
  const plan = await getActivePlan(tx, businessId);
  const limit = plan[definition.field];
  if (limit == null) return;

  const currentCount = await tx[definition.model].count({ where: { businessId, deletedAt: null } });
  if (currentCount >= limit) {
    throw httpError(`Your ${plan.name} plan allows up to ${limit} ${definition.label}${limit === 1 ? "" : "s"}. You have reached this limit. Upgrade your plan to add another ${definition.label}.`);
  }
}

async function assertMonthlyBookingCapacity(tx, businessId) {
  const plan = await getActivePlan(tx, businessId);
  const limit = plan.maxMonthlyBookings;
  if (limit == null) return;

  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const nextMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const currentCount = await tx.booking.count({
    where: { businessId, deletedAt: null, createdAt: { gte: monthStart, lt: nextMonthStart } }
  });
  if (currentCount >= limit) {
    throw httpError(`Your ${plan.name} plan allows up to ${limit} bookings this month. You have reached this limit. Upgrade your plan to accept more bookings.`);
  }
}

export { assertCanAddResource, assertMonthlyBookingCapacity };
