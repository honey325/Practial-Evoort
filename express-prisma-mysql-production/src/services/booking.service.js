import { randomBytes } from "node:crypto";
import { prisma } from "../lib/prisma.js";
import { assertMonthlyBookingCapacity } from "./plan-limits.service.js";

const activeBookingStatuses = ["PENDING", "CONFIRMED", "RESCHEDULED"];
const activeItemStatuses = ["PENDING", "CONFIRMED", "RESCHEDULED"];
const slotOccupyingItemStatuses = ["PENDING", "CONFIRMED", "RESCHEDULED", "COMPLETED", "NO_SHOW"];
const weekdayNumbers = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function httpError(message, statusCode = 400, details) {
  const error = new Error(message);
  error.statusCode = statusCode;
  if (details) error.details = details;
  return error;
}

function localParts(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return {
    date: `${values.year}-${values.month}-${values.day}`,
    weekday: weekdayNumbers[values.weekday],
    minuteOfDay: Number(values.hour) * 60 + Number(values.minute),
    time: `${values.hour}:${values.minute}`
  };
}

function minutes(time) {
  const [hours, mins] = time.split(":").map(Number);
  return hours * 60 + mins;
}

function dateKey(date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function matchesConditions(rule, context) {
  const conditions = rule.conditionsJson && typeof rule.conditionsJson === "object" ? rule.conditionsJson : {};
  if (Array.isArray(conditions.daysOfWeek) && !conditions.daysOfWeek.includes(context.weekday)) return false;
  if (Array.isArray(conditions.serviceIds) && !conditions.serviceIds.includes(context.serviceId)) return false;
  if (Array.isArray(conditions.staffIds) && !conditions.staffIds.includes(context.staffId)) return false;
  if (conditions.startTime && context.startMinute < minutes(conditions.startTime)) return false;
  if (conditions.endTime && context.endMinute > minutes(conditions.endTime)) return false;
  if (conditions.startDate && context.date < conditions.startDate) return false;
  if (conditions.endDate && context.date > conditions.endDate) return false;
  if (rule.ruleType === "COMBINATION") {
    const hasService = rule.serviceId != null || Array.isArray(conditions.serviceIds);
    const hasStaff = rule.staffId != null || Array.isArray(conditions.staffIds);
    const hasTime = Boolean(conditions.startTime && conditions.endTime);
    if (!hasService || !hasStaff || !hasTime) return false;
  }
  if (["PEAK", "OFF_PEAK"].includes(rule.ruleType) && !(conditions.startTime && conditions.endTime)) return false;
  return true;
}

function applyPricing(basePrice, rules, context) {
  let price = basePrice;
  const explanations = [];
  for (const rule of rules) {
    if (rule.serviceId && rule.serviceId !== context.serviceId) continue;
    if (rule.staffId && rule.staffId !== context.staffId) continue;
    if (rule.startDate && context.startAt < rule.startDate) continue;
    if (rule.endDate && context.startAt > rule.endDate) continue;
    if (!matchesConditions(rule, context)) continue;

    const value = Number(rule.adjustmentValue);
    const adjustment = rule.adjustmentType === "PERCENTAGE" ? price * value / 100 : value;
    const before = price;
    price = Math.max(0, Math.round((price + adjustment) * 100) / 100);
    explanations.push(`${rule.name}: ${rule.adjustmentType === "PERCENTAGE" ? `${value}%` : `${value.toFixed(2)} INR`} ${adjustment >= 0 ? "added" : "deducted"} (${before.toFixed(2)} → ${price.toFixed(2)} INR)`);
  }
  if (!explanations.length) explanations.push("Base service price; no active pricing rules matched.");
  return { price, explanation: explanations.join(" ") };
}

function ruleValue(rules, key, fallback) {
  const rule = rules.find((entry) => entry.ruleKey === key && entry.isActive);
  if (!rule) return fallback;
  if (rule.ruleType === "BOOLEAN") return String(rule.ruleValue).toLowerCase() === "true";
  if (rule.ruleType === "NUMBER") {
    const value = Number(rule.ruleValue);
    return Number.isFinite(value) ? value : fallback;
  }
  return rule.ruleValue ?? fallback;
}

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && aEnd > bStart;
}

async function validateBusinessHours(tx, business, startAt, endAt, rules) {
  let localStart;
  let localEnd;
  try {
    localStart = localParts(startAt, business.timezone);
    localEnd = localParts(endAt, business.timezone);
  } catch {
    throw httpError("Business timezone is invalid; ask the owner to update it", 400);
  }
  if (localStart.date !== localEnd.date) throw httpError("The requested services must finish on the same local business day", 409);
  if (startAt <= new Date()) throw httpError("Booking start time must be in the future", 400);

  const minAdvance = Number(ruleValue(rules, "MIN_ADVANCE_MINUTES", 0));
  const maxAdvance = ruleValue(rules, "MAX_ADVANCE_DAYS", null);
  if (startAt.getTime() - Date.now() < minAdvance * 60000) throw httpError("Booking does not meet the configured minimum advance time", 409);
  if (maxAdvance != null && startAt.getTime() - Date.now() > Number(maxAdvance) * 86400000) throw httpError("Booking is outside the configured booking window", 409);

  const hours = await tx.workingHour.findMany({ where: { businessId: business.id, dayOfWeek: localStart.weekday, isActive: true, deletedAt: null } });
  const starts = localStart.minuteOfDay;
  const ends = localEnd.minuteOfDay;
  const withinHours = hours.some((hour) => starts >= minutes(hour.startTime) && ends <= minutes(hour.endTime));
  if (!withinHours) throw httpError("Requested time is outside the business working hours", 409);

  const holidays = await tx.holiday.findMany({ where: { businessId: business.id, deletedAt: null } });
  for (const holiday of holidays) {
    if (dateKey(holiday.holidayDate) !== localStart.date) continue;
    if (holiday.isFullDay || !holiday.startTime || !holiday.endTime || overlaps(starts, ends, minutes(holiday.startTime), minutes(holiday.endTime))) {
      throw httpError(`Business is unavailable during this time (${holiday.name})`, 409);
    }
  }
  return localStart;
}

async function countDailyBookings(tx, businessId, localDate, timeZone, excludeBookingId) {
  const bookingItems = await tx.bookingItem.findMany({
    where: {
      deletedAt: null,
      status: { in: activeItemStatuses },
      booking: { businessId, deletedAt: null, status: { in: activeBookingStatuses }, ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}) }
    },
    select: { bookingId: true, startTime: true }
  });
  return new Set(bookingItems.filter((item) => localParts(item.startTime, timeZone).date === localDate).map((item) => item.bookingId)).size;
}

async function planBooking(tx, { businessId, serviceIds, startAt, excludeBookingId }) {
  const business = await tx.business.findFirst({ where: { id: businessId, status: "ACTIVE", deletedAt: null } });
  if (!business) throw httpError("Business not found or not accepting bookings", 404);

  const [services, rules, pricingRules] = await Promise.all([
    tx.businessService.findMany({ where: { businessId, id: { in: serviceIds }, status: "ACTIVE", deletedAt: null } }),
    tx.bookingRule.findMany({ where: { businessId, isActive: true, deletedAt: null } }),
    tx.pricingRule.findMany({ where: { businessId, isActive: true, deletedAt: null }, orderBy: [{ priority: "desc" }, { id: "asc" }] })
  ]);
  const servicesById = new Map(services.map((service) => [service.id, service]));
  if (services.length !== serviceIds.length) throw httpError("One or more services are unavailable for this business", 400);

  const maxItems = Number(ruleValue(rules, "MAX_SERVICES_PER_BOOKING", Number.MAX_SAFE_INTEGER));
  if (serviceIds.length > maxItems) throw httpError("Booking exceeds the configured maximum services per booking", 400);

  const start = new Date(startAt);
  const totalDuration = serviceIds.reduce((sum, id) => sum + servicesById.get(id).durationMinutes, 0);
  const finalEnd = new Date(start.getTime() + totalDuration * 60000);
  const localStart = await validateBusinessHours(tx, business, start, finalEnd, rules);

  const dailyLimit = ruleValue(rules, "MAX_DAILY_BOOKINGS", null);
  if (dailyLimit != null) {
    const existingCount = await countDailyBookings(tx, businessId, localStart.date, business.timezone, excludeBookingId);
    if (existingCount >= Number(dailyLimit)) throw httpError("Business reached its configured daily booking limit", 409);
  }

  const items = [];
  const bookingStatus = ruleValue(rules, "AUTO_CONFIRM_BOOKINGS", false) ? "CONFIRMED" : "PENDING";
  let cursor = start;
  for (const serviceId of serviceIds) {
    const service = servicesById.get(serviceId);
    const end = new Date(cursor.getTime() + service.durationMinutes * 60000);
    const localItemStart = localParts(cursor, business.timezone);
    const localItemEnd = localParts(end, business.timezone);
    const candidateStaff = await tx.staffProfile.findMany({
      where: {
        businessId,
        status: "ACTIVE",
        deletedAt: null,
        user: { status: "ACTIVE", deletedAt: null },
        services: { some: { serviceId, deletedAt: null } }
      },
      orderBy: { id: "asc" },
      include: { user: { select: { name: true } } }
    });

    let selectedStaff;
    for (const staff of candidateStaff) {
      const [availability, leave, busy, concurrentCapacity] = await Promise.all([
        tx.staffAvailability.findMany({ where: { staffId: staff.id, dayOfWeek: localItemStart.weekday, isActive: true, deletedAt: null } }),
        tx.staffLeave.findMany({ where: { staffId: staff.id, status: "APPROVED", deletedAt: null } }),
        tx.bookingItem.findMany({
          where: {
            staffId: staff.id,
            deletedAt: null,
            status: { in: slotOccupyingItemStatuses },
            startTime: { lt: end },
            endTime: { gt: cursor },
            booking: { deletedAt: null, status: { not: "CANCELLED" }, ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}) }
          },
          select: { id: true }
        }),
        tx.bookingItem.count({
          where: {
            serviceId,
            deletedAt: null,
            status: { in: slotOccupyingItemStatuses },
            startTime: { lt: end },
            endTime: { gt: cursor },
            booking: { deletedAt: null, status: { not: "CANCELLED" }, ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}) }
          }
        })
      ]);
      const available = availability.some((row) => localItemStart.minuteOfDay >= minutes(row.startTime) && localItemEnd.minuteOfDay <= minutes(row.endTime));
      const onLeave = leave.some((row) => dateKey(row.leaveDate) === localItemStart.date && (!row.startTime || !row.endTime || overlaps(localItemStart.minuteOfDay, localItemEnd.minuteOfDay, minutes(row.startTime), minutes(row.endTime))));
      const serviceCapacity = Number(ruleValue(rules, "TIME_SLOT_CAPACITY", service.capacity));
      if (available && !onLeave && busy.length === 0 && concurrentCapacity < serviceCapacity) {
        selectedStaff = staff;
        break;
      }
    }
    if (!selectedStaff) throw httpError(`No available staff member for service "${service.name}" at the requested time`, 409);

    const priceContext = {
      serviceId,
      staffId: selectedStaff.id,
      weekday: localItemStart.weekday,
      date: localItemStart.date,
      startMinute: localItemStart.minuteOfDay,
      endMinute: localItemEnd.minuteOfDay,
      startAt: cursor
    };
    const pricing = applyPricing(Number(service.basePrice), pricingRules, priceContext);
    items.push({
      serviceId,
      staffId: selectedStaff.id,
      startTime: cursor,
      endTime: end,
      durationMinutes: service.durationMinutes,
      basePrice: service.basePrice,
      finalPrice: pricing.price,
      status: bookingStatus,
      pricingExplanation: pricing.explanation,
      assignmentExplanation: `Automatically assigned to ${selectedStaff.user.name}; staff is active, qualified for this service, available during the interval, and has no overlapping appointment.`
    });
    cursor = end;
  }

  const baseTotal = items.reduce((sum, item) => sum + Number(item.basePrice), 0);
  const totalPrice = Math.round(items.reduce((sum, item) => sum + item.finalPrice, 0) * 100) / 100;
  return {
    business,
    status: bookingStatus,
    items,
    subtotal: Math.round(baseTotal * 100) / 100,
    discount: Math.max(0, Math.round((baseTotal - totalPrice) * 100) / 100),
    totalPrice
  };
}

function bookingInclude() {
  return {
    business: { select: { id: true, name: true, timezone: true } },
    items: {
      where: { deletedAt: null },
      orderBy: { startTime: "asc" },
      include: {
        service: { select: { id: true, name: true } },
        staff: { include: { user: { select: { id: true, name: true } } } }
      }
    }
  };
}

function bookingNumber() {
  return `BK-${Date.now().toString(36).toUpperCase()}-${randomBytes(4).toString("hex").toUpperCase()}`;
}

async function createBooking(customerId, input) {
  try {
    return await prisma.$transaction(async (tx) => {
      const plan = await planBooking(tx, { ...input, startAt: new Date(input.startAt) });
      await assertMonthlyBookingCapacity(tx, input.businessId);
      const booking = await tx.booking.create({
        data: {
          bookingNumber: bookingNumber(),
          businessId: input.businessId,
          customerId,
          status: plan.status,
          subtotal: plan.subtotal,
          discount: plan.discount,
          totalPrice: plan.totalPrice,
          currency: "INR",
          items: { create: plan.items }
        },
        include: bookingInclude()
      });
      await tx.bookingStatusHistory.create({ data: { bookingId: booking.id, changedById: customerId, newStatus: plan.status, reason: `Multi-service booking created; staff assigned automatically. Status: ${plan.status}.` } });
      return booking;
    }, { isolationLevel: "Serializable" });
  } catch (error) {
    if (error.code === "P2034") throw httpError("This time was booked by another customer. Please choose another time.", 409);
    throw error;
  }
}

async function previewBooking(input) {
  const plan = await prisma.$transaction(async (tx) => {
    const bookingPlan = await planBooking(tx, { ...input, startAt: new Date(input.startAt) });
    await assertMonthlyBookingCapacity(tx, input.businessId);
    const serviceIds = bookingPlan.items.map((item) => item.serviceId);
    const staffIds = bookingPlan.items.map((item) => item.staffId);
    const [services, staff] = await Promise.all([
      tx.businessService.findMany({ where: { id: { in: serviceIds } }, select: { id: true, name: true } }),
      tx.staffProfile.findMany({ where: { id: { in: staffIds } }, select: { id: true, userId: true, user: { select: { id: true, name: true } } } })
    ]);
    const serviceById = new Map(services.map((service) => [service.id, service]));
    const staffById = new Map(staff.map((member) => [member.id, member]));
    return {
      ...bookingPlan,
      items: bookingPlan.items.map((item) => ({
        ...item,
        service: serviceById.get(item.serviceId),
        staff: staffById.get(item.staffId)
      }))
    };
  });
  return {
    business: { id: plan.business.id, name: plan.business.name, timezone: plan.business.timezone },
    status: plan.status,
    startAt: plan.items[0]?.startTime,
    endAt: plan.items.at(-1)?.endTime,
    durationMinutes: plan.items.reduce((sum, item) => sum + item.durationMinutes, 0),
    items: plan.items,
    subtotal: plan.subtotal,
    discount: plan.discount,
    totalPrice: plan.totalPrice,
    currency: "INR"
  };
}

async function listCustomerBookings(customerId, query) {
  const startTime = {};
  if (query.from) startTime.gte = new Date(query.from);
  if (query.to) startTime.lte = new Date(query.to);
  const where = {
    customerId,
    deletedAt: null,
    ...(query.status ? { status: query.status } : {}),
    ...(query.from || query.to ? { items: { some: { startTime } } } : {})
  };
  const [data, total] = await prisma.$transaction([
    prisma.booking.findMany({ where, skip: (query.page - 1) * query.limit, take: query.limit, orderBy: { createdAt: "desc" }, include: bookingInclude() }),
    prisma.booking.count({ where })
  ]);
  return { data, pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) } };
}

async function getCustomerBooking(bookingId, customerId) {
  const booking = await prisma.booking.findFirst({ where: { id: bookingId, customerId, deletedAt: null }, include: bookingInclude() });
  if (!booking) throw httpError("Booking not found", 404);
  return booking;
}

async function cancellationAllowed(tx, booking) {
  const rules = await tx.bookingRule.findMany({ where: { businessId: booking.businessId, isActive: true, deletedAt: null } });
  if (!ruleValue(rules, "CUSTOMER_CANCELLATION_ALLOWED", true)) throw httpError("Customer cancellation is disabled for this business", 409);
  const windowMinutes = Number(ruleValue(rules, "CANCELLATION_WINDOW_MINUTES", 0));
  const firstItem = await tx.bookingItem.findFirst({ where: { bookingId: booking.id, deletedAt: null }, orderBy: { startTime: "asc" } });
  if (!firstItem || firstItem.startTime.getTime() - Date.now() < windowMinutes * 60000) throw httpError("Booking is inside the configured cancellation window", 409);
}

async function cancelCustomerBooking(bookingId, customerId) {
  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findFirst({ where: { id: bookingId, customerId, deletedAt: null } });
    if (!booking) throw httpError("Booking not found", 404);
    if (!["PENDING", "CONFIRMED", "RESCHEDULED"].includes(booking.status)) throw httpError("Booking cannot be cancelled in its current status", 409);
    await cancellationAllowed(tx, booking);
    await tx.booking.update({ where: { id: bookingId }, data: { status: "CANCELLED" } });
    await tx.bookingItem.updateMany({ where: { bookingId, deletedAt: null }, data: { status: "CANCELLED" } });
    await tx.bookingStatusHistory.create({ data: { bookingId, changedById: customerId, oldStatus: booking.status, newStatus: "CANCELLED", reason: "Cancelled by customer." } });
    return tx.booking.findUnique({ where: { id: bookingId }, include: bookingInclude() });
  });
}

async function rescheduleCustomerBooking(bookingId, customerId, startAt) {
  try {
    return await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findFirst({ where: { id: bookingId, customerId, deletedAt: null }, include: { items: { where: { deletedAt: null }, orderBy: { startTime: "asc" } } } });
      if (!booking) throw httpError("Booking not found", 404);
      if (!["PENDING", "CONFIRMED", "RESCHEDULED"].includes(booking.status)) throw httpError("Booking cannot be rescheduled in its current status", 409);
      const rules = await tx.bookingRule.findMany({ where: { businessId: booking.businessId, isActive: true, deletedAt: null } });
      if (!ruleValue(rules, "CUSTOMER_RESCHEDULE_ALLOWED", true)) throw httpError("Customer rescheduling is disabled for this business", 409);
      const earliest = booking.items[0]?.startTime;
      const windowMinutes = Number(ruleValue(rules, "RESCHEDULE_WINDOW_MINUTES", 0));
      if (earliest && earliest.getTime() - Date.now() < windowMinutes * 60000) throw httpError("Booking is inside the configured reschedule window", 409);
      const serviceIds = booking.items.map((item) => item.serviceId);
      const plan = await planBooking(tx, { businessId: booking.businessId, serviceIds, startAt: new Date(startAt), excludeBookingId: bookingId });
      await tx.bookingItem.updateMany({ where: { bookingId, deletedAt: null }, data: { status: "RESCHEDULED", deletedAt: new Date() } });
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: "RESCHEDULED",
          subtotal: plan.subtotal,
          discount: plan.discount,
          totalPrice: plan.totalPrice,
          items: { create: plan.items }
        }
      });
      await tx.bookingStatusHistory.create({ data: { bookingId, changedById: customerId, oldStatus: booking.status, newStatus: "RESCHEDULED", reason: "Rescheduled; staff was reassigned automatically." } });
      return tx.booking.findUnique({ where: { id: bookingId }, include: bookingInclude() });
    }, { isolationLevel: "Serializable" });
  } catch (error) {
    if (error.code === "P2034") throw httpError("This time was booked by another customer. Please choose another time.", 409);
    throw error;
  }
}

async function listBusinessBookings(businessId, ownerId, query) {
  const owned = await prisma.business.findFirst({ where: { id: businessId, ownerId, deletedAt: null }, select: { id: true } });
  if (!owned) throw httpError("Business not found", 404);
  return listBookings({ businessId, query });
}

async function listBookings({ businessId, query, staffId }) {
  const itemWhere = { ...(staffId ? { staffId } : {}), deletedAt: null };
  if (query.from || query.to) {
    itemWhere.startTime = {};
    if (query.from) itemWhere.startTime.gte = new Date(query.from);
    if (query.to) itemWhere.startTime.lte = new Date(query.to);
  }
  const where = {
    deletedAt: null,
    ...(businessId ? { businessId } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(staffId || query.from || query.to ? { items: { some: itemWhere } } : {})
  };
  const [data, total] = await prisma.$transaction([
    prisma.booking.findMany({
      where,
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      orderBy: { createdAt: "desc" },
      include: {
        ...bookingInclude(),
        ...(staffId ? { items: { where: { deletedAt: null, staffId }, orderBy: { startTime: "asc" }, include: { service: { select: { id: true, name: true } }, staff: { include: { user: { select: { id: true, name: true } } } } } } } : {}),
        customer: { select: { id: true, name: true, email: true, phone: true } }
      }
    }),
    prisma.booking.count({ where })
  ]);
  return { data, pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) } };
}

async function updateBookingStatus(bookingId, status, actorId, scope) {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, deletedAt: null, ...(scope.businessId ? { businessId: scope.businessId } : {}), ...(scope.customerId ? { customerId: scope.customerId } : {}) },
    include: { items: { where: { deletedAt: null } } }
  });
  if (!booking) throw httpError("Booking not found", 404);
  if (booking.status === "CANCELLED" || booking.status === "COMPLETED" || booking.status === "NO_SHOW") throw httpError("Booking cannot be changed from its current status", 409);
  if (scope.staffId && !booking.items.some((item) => item.staffId === scope.staffId)) throw httpError("Booking not found", 404);
  if (status === "CONFIRMED" && booking.items.some((item) => ["COMPLETED", "CANCELLED", "NO_SHOW"].includes(item.status))) {
    throw httpError("A booking with completed or terminal items cannot be reconfirmed", 409);
  }
  if (status === "CANCELLED" && booking.items.some((item) => item.status === "COMPLETED")) {
    throw httpError("A booking with completed items cannot be cancelled", 409);
  }
  return prisma.$transaction(async (tx) => {
    await tx.booking.update({ where: { id: bookingId }, data: { status } });
    await tx.bookingItem.updateMany({ where: { bookingId, deletedAt: null, status: { in: activeItemStatuses } }, data: { status } });
    await tx.bookingStatusHistory.create({ data: { bookingId, changedById: actorId, oldStatus: booking.status, newStatus: status } });
    return tx.booking.findUnique({ where: { id: bookingId }, include: bookingInclude() });
  });
}

async function listStaffBookings(staffUserId, query) {
  const staff = await prisma.staffProfile.findFirst({ where: { userId: staffUserId, status: { in: ["ACTIVE", "ON_LEAVE"] }, deletedAt: null }, select: { id: true } });
  if (!staff) throw httpError("Staff profile not found", 404);
  return listBookings({ query, staffId: staff.id });
}

async function staffUpdateStatus(bookingId, status, staffUserId) {
  const staff = await prisma.staffProfile.findFirst({ where: { userId: staffUserId, deletedAt: null }, select: { id: true } });
  if (!staff) throw httpError("Staff profile not found", 404);
  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findFirst({
      where: { id: bookingId, deletedAt: null, items: { some: { staffId: staff.id, deletedAt: null } } },
      include: { items: { where: { staffId: staff.id, deletedAt: null } } }
    });
    if (!booking) throw httpError("Booking not found", 404);
    if (["CANCELLED", "COMPLETED", "NO_SHOW"].includes(booking.status)) throw httpError("Booking cannot be changed from its current status", 409);
    const assignedItems = booking.items;
    if (status === "CONFIRMED" && assignedItems.some((item) => ["COMPLETED", "CANCELLED", "NO_SHOW"].includes(item.status))) {
      throw httpError("An appointment item cannot be reconfirmed after a terminal status", 409);
    }
    if (assignedItems.every((item) => item.status === status)) throw httpError("Appointment items already have this status", 409);
    await tx.bookingItem.updateMany({ where: { bookingId, staffId: staff.id, deletedAt: null }, data: { status } });
    const allItems = await tx.bookingItem.findMany({ where: { bookingId, deletedAt: null }, select: { status: true } });
    let nextBookingStatus = booking.status;
    if (allItems.length && allItems.every((item) => item.status === "COMPLETED")) nextBookingStatus = "COMPLETED";
    if (allItems.length && allItems.every((item) => item.status === "NO_SHOW")) nextBookingStatus = "NO_SHOW";
    if (nextBookingStatus !== booking.status) {
      await tx.booking.update({ where: { id: bookingId }, data: { status: nextBookingStatus } });
      await tx.bookingStatusHistory.create({ data: { bookingId, changedById: staffUserId, oldStatus: booking.status, newStatus: nextBookingStatus } });
    }
    return tx.booking.findUnique({
      where: { id: bookingId },
      include: {
        ...bookingInclude(),
        items: { where: { staffId: staff.id, deletedAt: null }, orderBy: { startTime: "asc" }, include: { service: { select: { id: true, name: true } }, staff: { include: { user: { select: { id: true, name: true } } } } } }
      }
    });
  });
}

export {
  createBooking,
  previewBooking,
  listCustomerBookings,
  getCustomerBooking,
  cancelCustomerBooking,
  rescheduleCustomerBooking,
  listBusinessBookings,
  listStaffBookings,
  updateBookingStatus,
  staffUpdateStatus
};
