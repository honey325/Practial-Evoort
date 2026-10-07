import { Prisma } from "@prisma/client";
import * as businessService from "../services/business.service.js";

function mapError(error) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    const conflict = new Error("Email or phone number is already in use");
    conflict.statusCode = 409;
    return conflict;
  }
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2034"
  ) {
    const conflict = new Error(
      "A plan limit check conflicted with another update. Refresh and try again.",
    );
    conflict.statusCode = 409;
    return conflict;
  }
  return error;
}

function handleError(error) {
  throw mapError(error);
}

async function listAllBusinesses(req, res) {
  const result = await businessService.listAllBusinesses(req.validated.query);
  return res.status(200).json({ success: true, ...result });
}

async function getAdminBusiness(req, res) {
  const data = await businessService.getAdminBusiness(
    req.validated.params.businessId,
  );
  return res.status(200).json({ success: true, data });
}

async function updateBusinessStatus(req, res) {
  const data = await businessService.setBusinessStatus(
    req.validated.params.businessId,
    req.validated.body.status,
  );
  return res.status(200).json({ success: true, data });
}

async function deleteBusiness(req, res) {
  await businessService.softDeleteBusiness(req.validated.params.businessId);
  return res.status(204).send();
}

async function listOwnerBusinesses(req, res) {
  const data = await businessService.listOwnerBusinesses(Number(req.auth.sub));
  return res.status(200).json({ success: true, data });
}

async function createBusiness(req, res) {
  try {
    const data = await businessService.createBusiness(
      Number(req.auth.sub),
      req.validated.body,
    );
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return handleError(error);
  }
}

async function getOwnerBusiness(req, res) {
  const data = await businessService.getOwnerBusiness(
    req.validated.params.businessId,
    Number(req.auth.sub),
  );
  return res.status(200).json({ success: true, data });
}

async function updateOwnerBusiness(req, res) {
  try {
    const data = await businessService.updateOwnerBusiness(
      req.validated.params.businessId,
      Number(req.auth.sub),
      req.validated.body,
    );
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return handleError(error);
  }
}

async function listServices(req, res) {
  const data = await businessService.listServices(
    req.validated.params.businessId,
    Number(req.auth.sub),
  );
  return res.status(200).json({ success: true, data });
}

async function createService(req, res) {
  try {
    const data = await businessService.createService(
      req.validated.params.businessId,
      Number(req.auth.sub),
      req.validated.body,
    );
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return handleError(error);
  }
}

async function updateService(req, res) {
  try {
    const { businessId, serviceId } = req.validated.params;
    const data = await businessService.updateService(
      businessId,
      serviceId,
      Number(req.auth.sub),
      req.validated.body,
    );
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return handleError(error);
  }
}

async function deleteService(req, res) {
  const { businessId, serviceId } = req.validated.params;
  await businessService.deleteService(
    businessId,
    serviceId,
    Number(req.auth.sub),
  );
  return res.status(204).send();
}

async function listStaff(req, res) {
  const data = await businessService.listStaff(
    req.validated.params.businessId,
    Number(req.auth.sub),
  );
  return res.status(200).json({ success: true, data });
}

async function createStaff(req, res) {
  try {
    const data = await businessService.createStaff(
      req.validated.params.businessId,
      Number(req.auth.sub),
      req.validated.body,
    );
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return handleError(error);
  }
}

async function updateStaff(req, res) {
  try {
    const { businessId, staffId } = req.validated.params;
    const data = await businessService.updateStaff(
      businessId,
      staffId,
      Number(req.auth.sub),
      req.validated.body,
    );
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return handleError(error);
  }
}

async function deleteStaff(req, res) {
  const { businessId, staffId } = req.validated.params;
  await businessService.deleteStaff(businessId, staffId, Number(req.auth.sub));
  return res.status(204).send();
}

async function listCategories(req, res) {
  const data = await businessService.listCategories();
  return res.status(200).json({ success: true, data });
}

async function createCategory(req, res) {
  const data = await businessService.createCategory(req.validated.body);
  return res.status(201).json({ success: true, data });
}

async function updateCategory(req, res) {
  const data = await businessService.updateCategory(
    req.validated.params.categoryId,
    req.validated.body,
  );
  return res.status(200).json({ success: true, data });
}

async function deleteCategory(req, res) {
  await businessService.deleteCategory(req.validated.params.categoryId);
  return res.status(204).send();
}

async function listWorkingHours(req, res) {
  const data = await businessService.listWorkingHours(
    req.validated.params.businessId,
    Number(req.auth.sub),
  );
  return res.status(200).json({ success: true, data });
}

async function replaceWorkingHours(req, res) {
  const data = await businessService.replaceWorkingHours(
    req.validated.params.businessId,
    Number(req.auth.sub),
    req.validated.body.hours,
  );
  return res.status(200).json({ success: true, data });
}

async function listHolidays(req, res) {
  const data = await businessService.listHolidays(
    req.validated.params.businessId,
    Number(req.auth.sub),
  );
  return res.status(200).json({ success: true, data });
}

async function createHoliday(req, res) {
  const data = await businessService.createHoliday(
    req.validated.params.businessId,
    Number(req.auth.sub),
    req.validated.body,
  );
  return res.status(201).json({ success: true, data });
}

async function deleteHoliday(req, res) {
  const { businessId, holidayId } = req.validated.params;
  await businessService.deleteHoliday(
    businessId,
    holidayId,
    Number(req.auth.sub),
  );
  return res.status(204).send();
}

async function listStaffAvailability(req, res) {
  const { businessId, staffId } = req.validated.params;
  const data = await businessService.listStaffAvailability(
    businessId,
    staffId,
    Number(req.auth.sub),
  );
  return res.status(200).json({ success: true, data });
}

async function replaceStaffAvailability(req, res) {
  const { businessId, staffId } = req.validated.params;
  const data = await businessService.replaceStaffAvailability(
    businessId,
    staffId,
    Number(req.auth.sub),
    req.validated.body.hours,
  );
  return res.status(200).json({ success: true, data });
}

async function getMyStaffAvailability(req, res) {
  return res
    .status(200)
    .json({
      success: true,
      data: await businessService.getMyStaffAvailability(Number(req.auth.sub)),
    });
}

async function replaceMyStaffAvailability(req, res) {
  return res
    .status(200)
    .json({
      success: true,
      data: await businessService.replaceMyStaffAvailability(
        Number(req.auth.sub),
        req.validated.body.hours,
      ),
    });
}

async function listBookingRules(req, res) {
  const data = await businessService.listBookingRules(
    req.validated.params.businessId,
    Number(req.auth.sub),
  );
  return res.status(200).json({ success: true, data });
}

async function replaceBookingRules(req, res) {
  const data = await businessService.replaceBookingRules(
    req.validated.params.businessId,
    Number(req.auth.sub),
    req.validated.body.rules,
  );
  return res.status(200).json({ success: true, data });
}

async function listPricingRules(req, res) {
  const data = await businessService.listPricingRules(
    req.validated.params.businessId,
    Number(req.auth.sub),
  );
  return res.status(200).json({ success: true, data });
}

async function createPricingRule(req, res) {
  const data = await businessService.createPricingRule(
    req.validated.params.businessId,
    Number(req.auth.sub),
    req.validated.body,
  );
  return res.status(201).json({ success: true, data });
}

async function updatePricingRule(req, res) {
  const { businessId, ruleId } = req.validated.params;
  const data = await businessService.updatePricingRule(
    businessId,
    ruleId,
    Number(req.auth.sub),
    req.validated.body,
  );
  return res.status(200).json({ success: true, data });
}

async function deletePricingRule(req, res) {
  const { businessId, ruleId } = req.validated.params;
  await businessService.deletePricingRule(
    businessId,
    ruleId,
    Number(req.auth.sub),
  );
  return res.status(204).send();
}

export {
  listAllBusinesses,
  getAdminBusiness,
  updateBusinessStatus,
  deleteBusiness,
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
  deletePricingRule,
};
