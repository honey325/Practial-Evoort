import express from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import * as controller from "../controllers/business.controller.js";
import * as schemas from "../validators/business.validator.js";

const router = express.Router();
router.use(authenticate, authorize("SUPER_ADMIN"));

router.get("/", validate(schemas.adminBusinessListSchema), asyncHandler(controller.listAllBusinesses));
router.get("/:businessId", validate(schemas.adminBusinessIdSchema), asyncHandler(controller.getAdminBusiness));
router.patch("/:businessId/status", validate(schemas.adminBusinessStatusSchema), asyncHandler(controller.updateBusinessStatus));
router.delete("/:businessId", validate(schemas.adminBusinessIdSchema), asyncHandler(controller.deleteBusiness));

export default router;
