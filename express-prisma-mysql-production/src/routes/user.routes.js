import express from "express";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { authenticate, authorize } from "../middleware/auth.js";
import * as controller from "../controllers/user.controller.js";
import * as schemas from "../validators/user.validator.js";

const router = express.Router();
router.use(authenticate, authorize("SUPER_ADMIN"));

router.get(
  "/",
  validate(schemas.listUserSchema),
  asyncHandler(controller.listUsers)
);

router.get(
  "/:id",
  validate(schemas.idSchema),
  asyncHandler(controller.getUser)
);

router.post(
  "/",
  validate(schemas.createUserSchema),
  asyncHandler(controller.createUser)
);

router.patch(
  "/:id",
  validate(schemas.updateUserSchema),
  asyncHandler(controller.updateUser)
);

router.delete(
  "/:id",
  validate(schemas.idSchema),
  asyncHandler(controller.deleteUser)
);

export default router;
