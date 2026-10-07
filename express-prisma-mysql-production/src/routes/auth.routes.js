import express from "express";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { authenticate } from "../middleware/auth.js";
import * as controller from "../controllers/auth.controller.js";
import { loginSchema, registrationSchema } from "../validators/auth.validator.js";

const router = express.Router();
router.post("/login", validate(loginSchema), asyncHandler(controller.login));
router.post("/register/customer", validate(registrationSchema), asyncHandler(controller.registerCustomer));
router.post("/register/business-owner", validate(registrationSchema), asyncHandler(controller.registerBusinessOwner));
router.post("/logout", authenticate, controller.logout);

export default router;
