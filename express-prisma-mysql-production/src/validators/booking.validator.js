import { z } from "zod";

const empty = z.any();
const bookingId = z.coerce.number().int().positive();
const createBookingSchema = z.object({
  body: z.object({
    businessId: z.coerce.number().int().positive(),
    startAt: z.iso.datetime({ offset: true }),
    serviceIds: z.array(z.coerce.number().int().positive()).min(1).max(100)
  }).refine(({ serviceIds }) => new Set(serviceIds).size === serviceIds.length, {
    path: ["serviceIds"],
    message: "A service can only be added once per booking"
  }),
  params: empty,
  query: empty
});
const bookingIdSchema = z.object({ body: empty, params: z.object({ bookingId }), query: empty });
const bookingListSchema = z.object({
  body: empty,
  params: empty,
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "RESCHEDULED", "NO_SHOW"]).optional(),
    from: z.iso.datetime({ offset: true }).optional(),
    to: z.iso.datetime({ offset: true }).optional()
  })
});
const rescheduleBookingSchema = z.object({
  body: z.object({ startAt: z.iso.datetime({ offset: true }) }),
  params: z.object({ bookingId }),
  query: empty
});
const updateBookingStatusSchema = z.object({
  body: z.object({ status: z.enum(["CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"]) }),
  params: z.object({ bookingId }),
  query: empty
});
const staffUpdateBookingStatusSchema = z.object({
  body: z.object({ status: z.enum(["CONFIRMED", "COMPLETED", "NO_SHOW"]) }),
  params: z.object({ bookingId }),
  query: empty
});
const ownerBookingListSchema = z.object({
  body: empty,
  params: z.object({ businessId: z.coerce.number().int().positive() }),
  query: bookingListSchema.shape.query
});
const ownerUpdateBookingStatusSchema = z.object({
  body: updateBookingStatusSchema.shape.body,
  params: z.object({ businessId: z.coerce.number().int().positive(), bookingId }),
  query: empty
});

export {
  createBookingSchema,
  bookingIdSchema,
  bookingListSchema,
  rescheduleBookingSchema,
  updateBookingStatusSchema,
  staffUpdateBookingStatusSchema,
  ownerBookingListSchema,
  ownerUpdateBookingStatusSchema
};
