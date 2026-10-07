import express from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import * as controller from "../controllers/business.controller.js";
import * as schemas from "../validators/business.validator.js";

const router = express.Router();
router.get("/", asyncHandler(controller.listCategories));
router.post("/", authenticate, authorize("SUPER_ADMIN"), validate(schemas.createCategorySchema), asyncHandler(controller.createCategory));
router.patch("/:categoryId", authenticate, authorize("SUPER_ADMIN"), validate(schemas.updateCategorySchema), asyncHandler(controller.updateCategory));
router.delete("/:categoryId", authenticate, authorize("SUPER_ADMIN"), validate(schemas.categoryIdSchema), asyncHandler(controller.deleteCategory));

export default router;
