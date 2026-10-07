import { z } from "zod";
const empty = z.any();
const publicPlansSchema = z.object({ body: empty, params: empty, query: empty });
const businessParams = z.object({ businessId: z.coerce.number().int().positive() });
const planFields = {
  name: z.string().trim().min(2).max(100), description: z.string().trim().max(5000).nullable().optional(),
  price: z.coerce.number().finite().min(0).max(99999999.99), billingCycle: z.enum(["MONTHLY", "YEARLY"]),
  maxStaff: z.coerce.number().int().positive().nullable().optional(), maxServices: z.coerce.number().int().positive().nullable().optional(), maxMonthlyBookings: z.coerce.number().int().positive().nullable().optional()
};
const createPlanSchema = z.object({ body: z.object(planFields), params: empty, query: empty });
const updatePlanSchema = z.object({ body: z.object({ ...planFields, name: planFields.name.optional(), price: planFields.price.optional(), billingCycle: planFields.billingCycle.optional(), status: z.boolean().optional() }).refine((x) => Object.keys(x).length > 0), params: z.object({ planId: z.coerce.number().int().positive() }), query: empty });
const idSchema = z.object({ body: empty, params: z.object({ planId: z.coerce.number().int().positive() }), query: empty });
const subscribeSchema = z.object({ body: z.object({ planId: z.coerce.number().int().positive() }), params: businessParams, query: empty });
const businessSubscriptionSchema = z.object({ body: empty, params: businessParams, query: empty });
const statusSchema = z.object({ body: z.object({ status: z.enum(["ACTIVE", "EXPIRED", "CANCELLED", "SUSPENDED", "PENDING"]) }), params: z.object({ subscriptionId: z.coerce.number().int().positive() }), query: empty });
const listSubscriptionsSchema = z.object({ body: empty, params: empty, query: z.object({ page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(20), status: z.enum(["ACTIVE", "EXPIRED", "CANCELLED", "SUSPENDED", "PENDING"]).optional() }) });
export { publicPlansSchema, createPlanSchema, updatePlanSchema, idSchema, subscribeSchema, businessSubscriptionSchema, statusSchema, listSubscriptionsSchema };
