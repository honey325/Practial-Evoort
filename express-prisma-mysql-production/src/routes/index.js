import express from "express";
import userRoutes from "./user.routes.js";
import authRoutes from "./auth.routes.js";
import businessRoutes from "./business.routes.js";
import adminBusinessRoutes from "./admin.business.routes.js";
import categoryRoutes from "./category.routes.js";
import bookingRoutes from "./booking.routes.js";
import staffBookingRoutes from "./staff.booking.routes.js";
import catalogRoutes from "./catalog.routes.js";
import subscriptionRoutes from "./subscription.routes.js";
import reportRoutes from "./report.routes.js";
import staffAvailabilityRoutes from "./staff.availability.routes.js";
import { health } from "../controllers/health.controller.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = express.Router();

router.get("/health", asyncHandler(health));
router.use("/api/v1/auth", authRoutes);
router.use("/api/v1/catalog", catalogRoutes);
router.use("/api/v1/subscriptions", subscriptionRoutes);
router.use("/api/v1", reportRoutes);
router.use("/api/v1/bookings", bookingRoutes);
router.use("/api/v1/staff/bookings", staffBookingRoutes);
router.use("/api/v1/staff", staffAvailabilityRoutes);
router.use("/api/v1/businesses", businessRoutes);
router.use("/api/v1/admin/businesses", adminBusinessRoutes);
router.use("/api/v1/categories", categoryRoutes);
router.use("/api/v1/users", userRoutes);

export default router;
