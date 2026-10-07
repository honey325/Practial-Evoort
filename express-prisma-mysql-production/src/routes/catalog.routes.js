import express from "express";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import * as controller from "../controllers/catalog.controller.js";
import * as schemas from "../validators/catalog.validator.js";

const router = express.Router();
router.get("/businesses", validate(schemas.listCatalogSchema), asyncHandler(controller.listBusinesses));
router.get("/businesses/:businessId", validate(schemas.businessIdSchema), asyncHandler(controller.getBusiness));

export default router;
