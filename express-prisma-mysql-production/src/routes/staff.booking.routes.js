import express from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import * as controller from "../controllers/booking.controller.js";
import * as schemas from "../validators/booking.validator.js";

const router = express.Router();
router.use(authenticate, authorize("STAFF"));
router.get("/mine", validate(schemas.bookingListSchema), asyncHandler(controller.listStaff));
router.patch("/:bookingId/status", validate(schemas.staffUpdateBookingStatusSchema), asyncHandler(controller.updateStaffStatus));

export default router;
