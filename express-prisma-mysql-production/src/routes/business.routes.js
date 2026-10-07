import express from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import * as controller from "../controllers/business.controller.js";
import * as schemas from "../validators/business.validator.js";
import * as bookingController from "../controllers/booking.controller.js";
import * as bookingSchemas from "../validators/booking.validator.js";

const router = express.Router();
router.use(authenticate, authorize("BUSINESS_OWNER"));

router.get("/mine", asyncHandler(controller.listOwnerBusinesses));
router.post("/", validate(schemas.createBusinessSchema), asyncHandler(controller.createBusiness));
router.get("/:businessId", validate(schemas.adminBusinessIdSchema), asyncHandler(controller.getOwnerBusiness));
router.patch("/:businessId", validate(schemas.updateBusinessSchema), asyncHandler(controller.updateOwnerBusiness));
router.get("/:businessId/working-hours", validate(schemas.businessCollectionSchema), asyncHandler(controller.listWorkingHours));
router.put("/:businessId/working-hours", validate(schemas.workingHoursSchema), asyncHandler(controller.replaceWorkingHours));
router.get("/:businessId/booking-rules", validate(schemas.businessCollectionSchema), asyncHandler(controller.listBookingRules));
router.put("/:businessId/booking-rules", validate(schemas.bookingRulesSchema), asyncHandler(controller.replaceBookingRules));
router.get("/:businessId/pricing-rules", validate(schemas.businessCollectionSchema), asyncHandler(controller.listPricingRules));
router.post("/:businessId/pricing-rules", validate(schemas.createPricingRuleSchema), asyncHandler(controller.createPricingRule));
router.patch("/:businessId/pricing-rules/:ruleId", validate(schemas.updatePricingRuleSchema), asyncHandler(controller.updatePricingRule));
router.delete("/:businessId/pricing-rules/:ruleId", validate(schemas.pricingRuleIdSchema), asyncHandler(controller.deletePricingRule));
router.get("/:businessId/holidays", validate(schemas.businessCollectionSchema), asyncHandler(controller.listHolidays));
router.post("/:businessId/holidays", validate(schemas.createHolidaySchema), asyncHandler(controller.createHoliday));
router.delete("/:businessId/holidays/:holidayId", validate(schemas.holidayIdSchema), asyncHandler(controller.deleteHoliday));
router.get("/:businessId/bookings", validate(bookingSchemas.ownerBookingListSchema), asyncHandler(bookingController.listBusiness));
router.patch("/:businessId/bookings/:bookingId/status", validate(bookingSchemas.ownerUpdateBookingStatusSchema), asyncHandler(bookingController.updateBusinessStatus));

router.get("/:businessId/services", validate(schemas.businessCollectionSchema), asyncHandler(controller.listServices));
router.post("/:businessId/services", validate(schemas.createServiceSchema), asyncHandler(controller.createService));
router.patch("/:businessId/services/:serviceId", validate(schemas.updateServiceSchema), asyncHandler(controller.updateService));
router.delete("/:businessId/services/:serviceId", validate(schemas.serviceIdSchema), asyncHandler(controller.deleteService));

router.get("/:businessId/staff", validate(schemas.businessCollectionSchema), asyncHandler(controller.listStaff));
router.post("/:businessId/staff", validate(schemas.createStaffSchema), asyncHandler(controller.createStaff));
router.patch("/:businessId/staff/:staffId", validate(schemas.updateStaffSchema), asyncHandler(controller.updateStaff));
router.delete("/:businessId/staff/:staffId", validate(schemas.staffIdSchema), asyncHandler(controller.deleteStaff));
router.get("/:businessId/staff/:staffId/availability", validate(schemas.staffIdSchema), asyncHandler(controller.listStaffAvailability));
router.put("/:businessId/staff/:staffId/availability", validate(schemas.availabilitySchema), asyncHandler(controller.replaceStaffAvailability));

export default router;
