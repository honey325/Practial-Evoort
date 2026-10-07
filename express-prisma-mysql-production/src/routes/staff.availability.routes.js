import express from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import * as controller from "../controllers/business.controller.js";
import {
  selfAvailabilityReadSchema,
  selfAvailabilitySchema,
} from "../validators/business.validator.js";

const router = express.Router();
router.use(authenticate, authorize("STAFF"));
router.get("/availability", validate(selfAvailabilityReadSchema), asyncHandler(controller.getMyStaffAvailability));
router.put("/availability", validate(selfAvailabilitySchema), asyncHandler(controller.replaceMyStaffAvailability));
export default router;
