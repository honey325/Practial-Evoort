import express from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import * as controller from "../controllers/booking.controller.js";
import * as schemas from "../validators/booking.validator.js";

const router = express.Router();
router.use(authenticate, authorize("CUSTOMER"));
router.get("/mine", validate(schemas.bookingListSchema), asyncHandler(controller.listMine));
router.post("/availability", validate(schemas.createBookingSchema), asyncHandler(controller.previewBooking));
router.post("/", validate(schemas.createBookingSchema), asyncHandler(controller.createBooking));
router.get("/:bookingId", validate(schemas.bookingIdSchema), asyncHandler(controller.getMine));
router.post("/:bookingId/cancel", validate(schemas.bookingIdSchema), asyncHandler(controller.cancelMine));
router.post("/:bookingId/reschedule", validate(schemas.rescheduleBookingSchema), asyncHandler(controller.rescheduleMine));

export default router;
