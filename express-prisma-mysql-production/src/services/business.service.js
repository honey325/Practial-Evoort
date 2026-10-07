import { prisma } from "../lib/prisma.js";
import { hashPassword } from "../lib/password.js";
import { assertCanAddResource } from "./plan-limits.service.js";

function httpError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function assertOwnedBusiness(businessId, ownerId) {
  const business = await prisma.business.findFirst({
    where: { id: businessId, ownerId, deletedAt: null },
    select: { id: true }
  });
  if (!business) throw httpError("Business not found", 404);
  return business;
}

async function assertCategoryExists(categoryId) {
  if (categoryId == null) return;
  const category = await prisma.category.findFirst({ where: { id: categoryId, status: true, deletedAt: null }, select: { id: true } });
  if (!category) throw httpError("Category not found or inactive", 404);
}

async function listCategories() {
  return prisma.category.findMany({ where: { status: true, deletedAt: null }, orderBy: { name: "asc" }, select: { id: true, name: true, description: true } });
}

async function createCategory(data) {
  return prisma.category.create({ data, select: { id: true, name: true, description: true, status: true, createdAt: true } });
}

async function updateCategory(categoryId, data) {
  const result = await prisma.category.updateMany({ where: { id: categoryId, deletedAt: null }, data });
  if (!result.count) throw httpError("Category not found", 404);
  return prisma.category.findUnique({ where: { id: categoryId }, select: { id: true, name: true, description: true, status: true, updatedAt: true } });
}

async function deleteCategory(categoryId) {
  const result = await prisma.category.updateMany({ where: { id: categoryId, deletedAt: null }, data: { status: false, deletedAt: new Date() } });
  if (!result.count) throw httpError("Category not found", 404);
}

async function listWorkingHours(businessId, ownerId) {
  await assertOwnedBusiness(businessId, ownerId);
  return prisma.workingHour.findMany({ where: { businessId, deletedAt: null }, orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }] });
}

async function replaceWorkingHours(businessId, ownerId, hours) {
  await assertOwnedBusiness(businessId, ownerId);
  return prisma.$transaction(async (tx) => {
    await tx.workingHour.deleteMany({ where: { businessId } });
    if (hours.length) await tx.workingHour.createMany({ data: hours.map((hour) => ({ ...hour, businessId })) });
    return tx.workingHour.findMany({ where: { businessId, deletedAt: null }, orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }] });
  });
}

async function listHolidays(businessId, ownerId) {
  await assertOwnedBusiness(businessId, ownerId);
  return prisma.holiday.findMany({ where: { businessId, deletedAt: null }, orderBy: { holidayDate: "asc" } });
}

async function createHoliday(businessId, ownerId, holiday) {
  await assertOwnedBusiness(businessId, ownerId);
  try {
    return await prisma.holiday.create({ data: { ...holiday, businessId, holidayDate: new Date(`${holiday.holidayDate}T00:00:00.000Z`) } });
  } catch (error) {
    if (error.code === "P2002") throw httpError("A holiday is already registered for that date", 409);
    throw error;
  }
}

async function deleteHoliday(businessId, holidayId, ownerId) {
  await assertOwnedBusiness(businessId, ownerId);
  const result = await prisma.holiday.updateMany({ where: { id: holidayId, businessId, deletedAt: null }, data: { deletedAt: new Date() } });
  if (!result.count) throw httpError("Holiday not found", 404);
}

async function listStaffAvailability(businessId, staffId, ownerId) {
  await assertOwnedBusiness(businessId, ownerId);
  const staff = await prisma.staffProfile.findFirst({ where: { id: staffId, businessId, deletedAt: null }, select: { id: true } });
  if (!staff) throw httpError("Staff member not found", 404);
  return prisma.staffAvailability.findMany({ where: { staffId, deletedAt: null }, orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }] });
}

async function replaceStaffAvailability(businessId, staffId, ownerId, hours) {
  await assertOwnedBusiness(businessId, ownerId);
  const staff = await prisma.staffProfile.findFirst({ where: { id: staffId, businessId, deletedAt: null }, select: { id: true } });
  if (!staff) throw httpError("Staff member not found", 404);
  return prisma.$transaction(async (tx) => {
    await tx.staffAvailability.deleteMany({ where: { staffId } });
    if (hours.length) await tx.staffAvailability.createMany({ data: hours.map((hour) => ({ ...hour, staffId })) });
    return tx.staffAvailability.findMany({ where: { staffId, deletedAt: null }, orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }] });
  });
}

async function getMyStaffAvailability(userId) {
  const staff = await prisma.staffProfile.findFirst({ where: { userId, deletedAt: null }, select: { id: true } });
  if (!staff) throw httpError("Staff profile not found", 404);
  return prisma.staffAvailability.findMany({ where: { staffId: staff.id, deletedAt: null }, orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }] });
}

async function replaceMyStaffAvailability(userId, hours) {
  const staff = await prisma.staffProfile.findFirst({ where: { userId, deletedAt: null, status: "ACTIVE" }, select: { id: true } });
  if (!staff) throw httpError("Active staff profile not found", 404);
  return prisma.$transaction(async (tx) => {
    await tx.staffAvailability.deleteMany({ where: { staffId: staff.id } });
    if (hours.length) await tx.staffAvailability.createMany({ data: hours.map((hour) => ({ ...hour, staffId: staff.id })) });
    return tx.staffAvailability.findMany({ where: { staffId: staff.id, deletedAt: null }, orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }] });
  });
}

const bookingRuleTypes = {
  MAX_DAILY_BOOKINGS: "NUMBER",
  MIN_ADVANCE_MINUTES: "NUMBER",
  MAX_ADVANCE_DAYS: "NUMBER",
  CANCELLATION_WINDOW_MINUTES: "NUMBER",
  RESCHEDULE_WINDOW_MINUTES: "NUMBER",
  CUSTOMER_CANCELLATION_ALLOWED: "BOOLEAN",
  CUSTOMER_RESCHEDULE_ALLOWED: "BOOLEAN",
  AUTO_CONFIRM_BOOKINGS: "BOOLEAN",
  MAX_SERVICES_PER_BOOKING: "NUMBER",
  TIME_SLOT_CAPACITY: "NUMBER"
};

async function listBookingRules(businessId, ownerId) {
  await assertOwnedBusiness(businessId, ownerId);
  return prisma.bookingRule.findMany({ where: { businessId, deletedAt: null }, orderBy: { ruleKey: "asc" } });
}

async function replaceBookingRules(businessId, ownerId, rules) {
  await assertOwnedBusiness(businessId, ownerId);
  const data = rules.map(({ ruleKey, ruleName, ruleValue }) => {
    const ruleType = bookingRuleTypes[ruleKey];
    if (ruleType === "BOOLEAN" && !["true", "false"].includes(ruleValue.toLowerCase())) throw httpError(`${ruleKey} must be "true" or "false"`, 400);
    if (ruleType === "NUMBER") {
      const number = Number(ruleValue);
      const minimum = ["MIN_ADVANCE_MINUTES", "CANCELLATION_WINDOW_MINUTES", "RESCHEDULE_WINDOW_MINUTES"].includes(ruleKey) ? 0 : 1;
      if (!Number.isFinite(number) || number < minimum) throw httpError(`${ruleKey} must be a number greater than or equal to ${minimum}`, 400);
    }
    return { businessId, ruleKey, ruleName, ruleType, ruleValue };
  });
  return prisma.$transaction(async (tx) => {
    await tx.bookingRule.deleteMany({ where: { businessId } });
    if (data.length) await tx.bookingRule.createMany({ data });
    return tx.bookingRule.findMany({ where: { businessId, deletedAt: null }, orderBy: { ruleKey: "asc" } });
  });
}

async function validatePricingRuleLinks(businessId, data) {
  if (data.serviceId != null) {
    const service = await prisma.businessService.findFirst({ where: { id: data.serviceId, businessId, deletedAt: null }, select: { id: true } });
    if (!service) throw httpError("Pricing rule service does not belong to this business", 400);
  }
  if (data.staffId != null) {
    const staff = await prisma.staffProfile.findFirst({ where: { id: data.staffId, businessId, deletedAt: null }, select: { id: true } });
    if (!staff) throw httpError("Pricing rule staff member does not belong to this business", 400);
  }
  if (data.startDate && data.endDate && new Date(data.startDate) > new Date(data.endDate)) throw httpError("startDate must be before endDate", 400);
  const conditions = data.conditionsJson;
  if (conditions) {
    const timePattern = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;
    if ((conditions.startTime != null && !timePattern.test(conditions.startTime)) || (conditions.endTime != null && !timePattern.test(conditions.endTime))) {
      throw httpError("Pricing rule conditions use an invalid time. Use HH:mm.", 400);
    }
    if ((conditions.startTime && !conditions.endTime) || (!conditions.startTime && conditions.endTime) || (conditions.startTime && conditions.startTime >= conditions.endTime)) {
      throw httpError("Pricing rule time conditions require startTime before endTime", 400);
    }
    for (const key of ["daysOfWeek", "serviceIds", "staffIds"]) {
      if (conditions[key] !== undefined && (!Array.isArray(conditions[key]) || conditions[key].some((value) => !Number.isInteger(value) || value < (key === "daysOfWeek" ? 0 : 1) || value > (key === "daysOfWeek" ? 6 : Number.MAX_SAFE_INTEGER)))) {
        throw httpError(`Pricing rule ${key} must be an array of valid numeric IDs/values`, 400);
      }
    }
    if (Array.isArray(conditions.serviceIds)) {
      if (new Set(conditions.serviceIds).size !== conditions.serviceIds.length) throw httpError("Pricing rule serviceIds cannot contain duplicates", 400);
      const count = await prisma.businessService.count({ where: { businessId, id: { in: conditions.serviceIds }, deletedAt: null } });
      if (count !== conditions.serviceIds.length) throw httpError("Pricing rule serviceIds must belong to this business", 400);
    }
    if (Array.isArray(conditions.staffIds)) {
      if (new Set(conditions.staffIds).size !== conditions.staffIds.length) throw httpError("Pricing rule staffIds cannot contain duplicates", 400);
      const count = await prisma.staffProfile.count({ where: { businessId, id: { in: conditions.staffIds }, deletedAt: null } });
      if (count !== conditions.staffIds.length) throw httpError("Pricing rule staffIds must belong to this business", 400);
    }
    if (conditions.startDate && Number.isNaN(Date.parse(conditions.startDate))) throw httpError("Pricing rule conditions startDate is invalid", 400);
    if (conditions.endDate && Number.isNaN(Date.parse(conditions.endDate))) throw httpError("Pricing rule conditions endDate is invalid", 400);
    if (conditions.startDate && conditions.endDate && conditions.startDate > conditions.endDate) throw httpError("Pricing rule conditions startDate must be before endDate", 400);
  }
}

async function listPricingRules(businessId, ownerId) {
  await assertOwnedBusiness(businessId, ownerId);
  return prisma.pricingRule.findMany({ where: { businessId, deletedAt: null }, orderBy: [{ priority: "desc" }, { id: "asc" }] });
}

async function createPricingRule(businessId, ownerId, rule) {
  await assertOwnedBusiness(businessId, ownerId);
  await validatePricingRuleLinks(businessId, rule);
  return prisma.pricingRule.create({ data: { ...rule, businessId, startDate: rule.startDate ? new Date(rule.startDate) : rule.startDate, endDate: rule.endDate ? new Date(rule.endDate) : rule.endDate } });
}

async function updatePricingRule(businessId, ruleId, ownerId, rule) {
  await assertOwnedBusiness(businessId, ownerId);
  const current = await prisma.pricingRule.findFirst({ where: { id: ruleId, businessId, deletedAt: null } });
  if (!current) throw httpError("Pricing rule not found", 404);
  await validatePricingRuleLinks(businessId, { ...current, ...rule });
  await prisma.pricingRule.update({ where: { id: ruleId }, data: { ...rule, startDate: rule.startDate ? new Date(rule.startDate) : rule.startDate, endDate: rule.endDate ? new Date(rule.endDate) : rule.endDate } });
  return prisma.pricingRule.findUnique({ where: { id: ruleId } });
}

async function deletePricingRule(businessId, ruleId, ownerId) {
  await assertOwnedBusiness(businessId, ownerId);
  const result = await prisma.pricingRule.updateMany({ where: { id: ruleId, businessId, deletedAt: null }, data: { deletedAt: new Date(), isActive: false } });
  if (!result.count) throw httpError("Pricing rule not found", 404);
}

async function listAllBusinesses({ page, limit, search, status }) {
  const where = {
    deletedAt: null,
    ...(status ? { status } : {}),
    ...(search ? { OR: [{ name: { contains: search } }, { email: { contains: search } }, { city: { contains: search } }] } : {})
  };
  const [data, total] = await prisma.$transaction([
    prisma.business.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { services: true, staff: true, bookings: true } }
      }
    }),
    prisma.business.count({ where })
  ]);
  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

async function getAdminBusiness(businessId) {
  const business = await prisma.business.findFirst({
    where: { id: businessId, deletedAt: null },
    include: {
      category: { select: { id: true, name: true } },
      owner: { select: { id: true, name: true, email: true, phone: true } },
      _count: { select: { services: true, staff: true, bookings: true } }
    }
  });
  if (!business) throw httpError("Business not found", 404);
  return business;
}

async function setBusinessStatus(businessId, status) {
  const business = await prisma.business.updateMany({ where: { id: businessId, deletedAt: null }, data: { status } });
  if (!business.count) throw httpError("Business not found", 404);
  return getAdminBusiness(businessId);
}

async function softDeleteBusiness(businessId) {
  const result = await prisma.business.updateMany({
    where: { id: businessId, deletedAt: null },
    data: { deletedAt: new Date(), status: "INACTIVE" }
  });
  if (!result.count) throw httpError("Business not found", 404);
}

async function listOwnerBusinesses(ownerId) {
  return prisma.business.findMany({
    where: { ownerId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: { category: { select: { id: true, name: true } }, _count: { select: { services: true, staff: true } } }
  });
}

async function createBusiness(ownerId, data) {
  await assertCategoryExists(data.categoryId);
  return prisma.business.create({
    data: { ...data, ownerId },
    include: { category: { select: { id: true, name: true } } }
  });
}

async function getOwnerBusiness(businessId, ownerId) {
  await assertOwnedBusiness(businessId, ownerId);
  return prisma.business.findUnique({
    where: { id: businessId },
    include: {
      category: { select: { id: true, name: true } },
      _count: { select: { services: true, staff: true } }
    }
  });
}

async function updateOwnerBusiness(businessId, ownerId, data) {
  await assertOwnedBusiness(businessId, ownerId);
  if (data.categoryId) await assertCategoryExists(data.categoryId);
  await prisma.business.update({ where: { id: businessId }, data });
  return getOwnerBusiness(businessId, ownerId);
}

async function listServices(businessId, ownerId) {
  await assertOwnedBusiness(businessId, ownerId);
  return prisma.businessService.findMany({
    where: { businessId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: { category: { select: { id: true, name: true } } }
  });
}

async function createService(businessId, ownerId, data) {
  await assertOwnedBusiness(businessId, ownerId);
  if (data.categoryId) await assertCategoryExists(data.categoryId);
  return prisma.$transaction(async (tx) => {
    await assertCanAddResource(tx, businessId, "services");
    return tx.businessService.create({
      data: { ...data, businessId },
      include: { category: { select: { id: true, name: true } } }
    });
  }, { isolationLevel: "Serializable" });
}

async function updateService(businessId, serviceId, ownerId, data) {
  await assertOwnedBusiness(businessId, ownerId);
  if (data.categoryId) await assertCategoryExists(data.categoryId);
  const result = await prisma.businessService.updateMany({
    where: { id: serviceId, businessId, deletedAt: null },
    data
  });
  if (!result.count) throw httpError("Service not found", 404);
  return prisma.businessService.findUnique({ where: { id: serviceId }, include: { category: { select: { id: true, name: true } } } });
}

async function deleteService(businessId, serviceId, ownerId) {
  await assertOwnedBusiness(businessId, ownerId);
  const result = await prisma.businessService.updateMany({
    where: { id: serviceId, businessId, deletedAt: null },
    data: { deletedAt: new Date(), status: "INACTIVE" }
  });
  if (!result.count) throw httpError("Service not found", 404);
}

async function listStaff(businessId, ownerId) {
  await assertOwnedBusiness(businessId, ownerId);
  return prisma.staffProfile.findMany({
    where: { businessId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, status: true } },
      services: { where: { deletedAt: null }, include: { service: { select: { id: true, name: true, status: true } } } }
    }
  });
}

async function validateServiceAssignments(businessId, serviceIds) {
  const uniqueServiceIds = [...new Set(serviceIds)];
  if (uniqueServiceIds.length !== serviceIds.length) throw httpError("serviceIds must not contain duplicates", 400);
  if (!uniqueServiceIds.length) return uniqueServiceIds;
  const count = await prisma.businessService.count({ where: { id: { in: uniqueServiceIds }, businessId, deletedAt: null, status: "ACTIVE" } });
  if (count !== uniqueServiceIds.length) throw httpError("One or more services are invalid for this business", 400);
  return uniqueServiceIds;
}

async function createStaff(businessId, ownerId, data) {
  await assertOwnedBusiness(businessId, ownerId);
  const serviceIds = await validateServiceAssignments(businessId, data.serviceIds);
  const { password, serviceIds: ignoredServiceIds, ...staffData } = data;
  return prisma.$transaction(async (tx) => {
    await assertCanAddResource(tx, businessId, "staff");
    const user = await tx.user.create({
      data: {
        name: staffData.name,
        email: staffData.email,
        phone: staffData.phone,
        passwordHash: await hashPassword(password),
        role: "STAFF"
      },
      select: { id: true, name: true, email: true, phone: true, status: true }
    });
    const staff = await tx.staffProfile.create({
      data: {
        userId: user.id,
        businessId,
        employeeCode: staffData.employeeCode,
        designation: staffData.designation,
        services: { create: serviceIds.map((serviceId) => ({ serviceId })) }
      },
      select: { id: true, businessId: true, employeeCode: true, designation: true, status: true }
    });
    return { ...staff, user, serviceIds };
  }, { isolationLevel: "Serializable" });
}

async function updateStaff(businessId, staffId, ownerId, data) {
  await assertOwnedBusiness(businessId, ownerId);
  const staff = await prisma.staffProfile.findFirst({ where: { id: staffId, businessId, deletedAt: null }, include: { user: true } });
  if (!staff) throw httpError("Staff member not found", 404);
  const { serviceIds, name, phone, ...profileData } = data;
  const uniqueServiceIds = serviceIds === undefined ? undefined : await validateServiceAssignments(businessId, serviceIds);
  return prisma.$transaction(async (tx) => {
    if (name !== undefined || phone !== undefined) {
      await tx.user.update({ where: { id: staff.userId }, data: { ...(name !== undefined ? { name } : {}), ...(phone !== undefined ? { phone } : {}) } });
    }
    if (profileData.status === "ACTIVE" || profileData.status === "INACTIVE") {
      await tx.user.update({ where: { id: staff.userId }, data: { status: profileData.status } });
    }
    await tx.staffProfile.update({ where: { id: staffId }, data: profileData });
    if (uniqueServiceIds !== undefined) {
      await tx.staffService.deleteMany({ where: { staffId } });
      if (uniqueServiceIds.length) {
        await tx.staffService.createMany({ data: uniqueServiceIds.map((serviceId) => ({ staffId, serviceId })) });
      }
    }
    return tx.staffProfile.findUnique({
      where: { id: staffId },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, status: true } },
        services: { where: { deletedAt: null }, include: { service: { select: { id: true, name: true, status: true } } } }
      }
    });
  });
}

async function deleteStaff(businessId, staffId, ownerId) {
  await assertOwnedBusiness(businessId, ownerId);
  const staff = await prisma.staffProfile.findFirst({ where: { id: staffId, businessId, deletedAt: null }, select: { id: true, userId: true } });
  if (!staff) throw httpError("Staff member not found", 404);
  await prisma.$transaction([
    prisma.staffProfile.update({ where: { id: staffId }, data: { deletedAt: new Date(), status: "INACTIVE" } }),
    prisma.user.update({ where: { id: staff.userId }, data: { status: "INACTIVE" } })
  ]);
}

export {
  listAllBusinesses,
  getAdminBusiness,
  setBusinessStatus,
  softDeleteBusiness,
  listOwnerBusinesses,
  createBusiness,
  getOwnerBusiness,
  updateOwnerBusiness,
  listServices,
  createService,
  updateService,
  deleteService,
  listStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listWorkingHours,
  replaceWorkingHours,
  listHolidays,
  createHoliday,
  deleteHoliday,
  listStaffAvailability,
  replaceStaffAvailability,
  getMyStaffAvailability,
  replaceMyStaffAvailability,
  listBookingRules,
  replaceBookingRules,
  listPricingRules,
  createPricingRule,
  updatePricingRule,
  deletePricingRule
};
