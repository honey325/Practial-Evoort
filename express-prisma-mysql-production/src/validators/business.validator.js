import { z } from "zod";

const businessId = z.coerce.number().int().positive();
const email = z.string().trim().toLowerCase().email().max(191).optional();
const phone = z
  .string()
  .trim()
  .regex(/^\+?[0-9]{7,15}$/)
  .optional();
const empty = z.any();

const businessFields = {
  name: z.string().trim().min(2).max(150),
  categoryId: z.coerce.number().int().positive(),
  description: z.string().trim().max(5000).optional(),
  email,
  phone,
  address: z.string().trim().max(2000).optional(),
  city: z.string().trim().max(100).optional(),
  state: z.string().trim().max(100).optional(),
  country: z.string().trim().max(100).optional(),
  timezone: z.string().trim().min(1).max(100).optional(),
};

const createBusinessSchema = z.object({
  body: z.object({ ...businessFields, timezone: businessFields.timezone }),
  params: empty,
  query: empty,
});

const updateBusinessSchema = z.object({
  body: z
    .object({
      name: businessFields.name.optional(),
      categoryId: businessFields.categoryId.optional(),
      description: businessFields.description,
      email: z.union([email, z.literal(null)]).optional(),
      phone: z.union([phone, z.literal(null)]).optional(),
      address: z.string().trim().max(2000).nullable().optional(),
      city: z.string().trim().max(100).nullable().optional(),
      state: z.string().trim().max(100).nullable().optional(),
      country: z.string().trim().max(100).nullable().optional(),
      timezone: businessFields.timezone,
    })
    .refine(
      (body) => Object.keys(body).length > 0,
      "At least one field is required",
    ),
  params: z.object({ businessId }),
  query: empty,
});

const adminBusinessIdSchema = z.object({
  body: empty,
  params: z.object({ businessId }),
  query: empty,
});
const adminBusinessListSchema = z.object({
  body: empty,
  params: empty,
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(100).optional(),
    status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
  }),
});
const adminBusinessStatusSchema = z.object({
  body: z.object({ status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]) }),
  params: z.object({ businessId }),
  query: empty,
});

const serviceIdParams = z.object({
  businessId,
  serviceId: z.coerce.number().int().positive(),
});
const serviceFields = {
  name: z.string().trim().min(2).max(150),
  description: z.string().trim().max(5000).nullable().optional(),
  durationMinutes: z.coerce.number().int().min(1).max(1440),
  basePrice: z.coerce.number().finite().min(0).max(99999999.99),
  capacity: z.coerce.number().int().min(1).max(1000).default(1),
  categoryId: z.coerce.number().int().positive().nullable().optional(),
};
const createServiceSchema = z.object({
  body: z.object(serviceFields),
  params: z.object({ businessId }),
  query: empty,
});
const updateServiceSchema = z.object({
  body: z
    .object({
      name: serviceFields.name.optional(),
      description: serviceFields.description,
      durationMinutes: serviceFields.durationMinutes.optional(),
      basePrice: serviceFields.basePrice.optional(),
      capacity: serviceFields.capacity.optional(),
      categoryId: serviceFields.categoryId,
      status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
    })
    .refine(
      (body) => Object.keys(body).length > 0,
      "At least one field is required",
    ),
  params: serviceIdParams,
  query: empty,
});
const serviceIdSchema = z.object({
  body: empty,
  params: serviceIdParams,
  query: empty,
});
const businessCollectionSchema = z.object({
  body: empty,
  params: z.object({ businessId }),
  query: empty,
});

const staffIdParams = z.object({
  businessId,
  staffId: z.coerce.number().int().positive(),
});
const createStaffSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().toLowerCase().email().max(191),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[0-9]{7,15}$/)
      .optional(),
    password: z.string().min(8).max(128),
    employeeCode: z.string().trim().max(50).optional(),
    designation: z.string().trim().max(100).optional(),
    serviceIds: z
      .array(z.coerce.number().int().positive())
      .max(100)
      .default([]),
  }),
  params: z.object({ businessId }),
  query: empty,
});
const updateStaffSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(2).max(100).optional(),
      phone: z
        .union([
          z
            .string()
            .trim()
            .regex(/^\+?[0-9]{7,15}$/),
          z.literal(null),
        ])
        .optional(),
      employeeCode: z.string().trim().max(50).nullable().optional(),
      designation: z.string().trim().max(100).nullable().optional(),
      status: z.enum(["ACTIVE", "INACTIVE", "ON_LEAVE"]).optional(),
      serviceIds: z
        .array(z.coerce.number().int().positive())
        .max(100)
        .optional(),
    })
    .refine(
      (body) => Object.keys(body).length > 0,
      "At least one field is required",
    ),
  params: staffIdParams,
  query: empty,
});
const staffIdSchema = z.object({
  body: empty,
  params: staffIdParams,
  query: empty,
});
const categoryIdParams = z.object({
  categoryId: z.coerce.number().int().positive(),
});
const createCategorySchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100),
    description: z.string().trim().max(5000).optional(),
  }),
  params: empty,
  query: empty,
});
const updateCategorySchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(2).max(100).optional(),
      description: z.string().trim().max(5000).nullable().optional(),
    })
    .refine(
      (body) => Object.keys(body).length > 0,
      "At least one field is required",
    ),
  params: categoryIdParams,
  query: empty,
});
const categoryIdSchema = z.object({
  body: empty,
  params: categoryIdParams,
  query: empty,
});
const time = z.string().regex(/^([01][0-9]|2[0-3]):[0-5][0-9]$/);
const hourEntries = z
  .array(
    z
      .object({
        dayOfWeek: z.coerce.number().int().min(0).max(6),
        startTime: time,
        endTime: time,
        isActive: z.boolean().default(true),
      })
      .refine(
        (entry) => entry.startTime < entry.endTime,
        "endTime must be after startTime",
      ),
  )
  .max(14)
  .refine((entries) => {
    for (let i = 0; i < entries.length; i += 1) {
      for (let j = i + 1; j < entries.length; j += 1) {
        if (
          entries[i].dayOfWeek === entries[j].dayOfWeek &&
          entries[i].startTime < entries[j].endTime &&
          entries[i].endTime > entries[j].startTime
        )
          return false;
      }
    }
    return true;
  }, "Working hour intervals must not overlap");
const workingHoursSchema = z.object({
  body: z.object({ hours: hourEntries }),
  params: z.object({ businessId }),
  query: empty,
});
const holidayIdParams = z.object({
  businessId,
  holidayId: z.coerce.number().int().positive(),
});
const createHolidaySchema = z.object({
  body: z
    .object({
      holidayDate: z.iso.date(),
      name: z.string().trim().min(2).max(150),
      isFullDay: z.boolean().default(true),
      startTime: time.optional(),
      endTime: time.optional(),
    })
    .refine(
      (holiday) =>
        holiday.isFullDay ||
        (holiday.startTime &&
          holiday.endTime &&
          holiday.startTime < holiday.endTime),
      "Partial holidays require a valid startTime and endTime",
    ),
  params: z.object({ businessId }),
  query: empty,
});
const holidayIdSchema = z.object({
  body: empty,
  params: holidayIdParams,
  query: empty,
});
const availabilitySchema = z.object({
  body: z.object({ hours: hourEntries }),
  params: z.object({ businessId, staffId: z.coerce.number().int().positive() }),
  query: empty,
});
const selfAvailabilitySchema = z.object({
  body: z.object({ hours: hourEntries }),
  params: empty,
  query: empty,
});
const selfAvailabilityReadSchema = z.object({
  body: empty,
  params: empty,
  query: empty,
});
const ruleKeys = [
  "MAX_DAILY_BOOKINGS",
  "MIN_ADVANCE_MINUTES",
  "MAX_ADVANCE_DAYS",
  "CANCELLATION_WINDOW_MINUTES",
  "RESCHEDULE_WINDOW_MINUTES",
  "CUSTOMER_CANCELLATION_ALLOWED",
  "CUSTOMER_RESCHEDULE_ALLOWED",
  "AUTO_CONFIRM_BOOKINGS",
  "MAX_SERVICES_PER_BOOKING",
  "TIME_SLOT_CAPACITY",
];
const bookingRulesSchema = z.object({
  body: z
    .object({
      rules: z
        .array(
          z.object({
            ruleKey: z.enum(ruleKeys),
            ruleName: z.string().trim().min(2).max(150),
            ruleValue: z.string().max(100),
          }),
        )
        .max(ruleKeys.length),
    })
    .refine(
      ({ rules }) =>
        new Set(rules.map((rule) => rule.ruleKey)).size === rules.length,
      "ruleKey values must be unique",
    ),
  params: z.object({ businessId }),
  query: empty,
});
const pricingRuleIdParams = z.object({
  businessId,
  ruleId: z.coerce.number().int().positive(),
});
const pricingRuleFields = {
  name: z.string().trim().min(2).max(150),
  ruleType: z.enum(["PEAK", "OFF_PEAK", "COMBINATION", "CUSTOM"]),
  priority: z.coerce.number().int().min(0).max(10000).default(0),
  adjustmentType: z.enum(["PERCENTAGE", "FIXED"]),
  adjustmentValue: z.coerce
    .number()
    .finite()
    .min(-99999999.99)
    .max(99999999.99),
  serviceId: z.coerce.number().int().positive().nullable().optional(),
  staffId: z.coerce.number().int().positive().nullable().optional(),
  conditionsJson: z.record(z.string(), z.unknown()).nullable().optional(),
  isActive: z.boolean().default(true),
  startDate: z.iso.datetime({ offset: true }).nullable().optional(),
  endDate: z.iso.datetime({ offset: true }).nullable().optional(),
};
const createPricingRuleSchema = z.object({
  body: z.object(pricingRuleFields),
  params: z.object({ businessId }),
  query: empty,
});
const updatePricingRuleSchema = z.object({
  body: z
    .object({
      name: pricingRuleFields.name.optional(),
      ruleType: pricingRuleFields.ruleType.optional(),
      priority: pricingRuleFields.priority.optional(),
      adjustmentType: pricingRuleFields.adjustmentType.optional(),
      adjustmentValue: pricingRuleFields.adjustmentValue.optional(),
      serviceId: pricingRuleFields.serviceId,
      staffId: pricingRuleFields.staffId,
      conditionsJson: pricingRuleFields.conditionsJson,
      isActive: pricingRuleFields.isActive.optional(),
      startDate: pricingRuleFields.startDate,
      endDate: pricingRuleFields.endDate,
    })
    .refine(
      (body) => Object.keys(body).length > 0,
      "At least one field is required",
    ),
  params: pricingRuleIdParams,
  query: empty,
});
const pricingRuleIdSchema = z.object({
  body: empty,
  params: pricingRuleIdParams,
  query: empty,
});

export {
  createBusinessSchema,
  updateBusinessSchema,
  adminBusinessIdSchema,
  adminBusinessListSchema,
  adminBusinessStatusSchema,
  createServiceSchema,
  updateServiceSchema,
  serviceIdSchema,
  businessCollectionSchema,
  createStaffSchema,
  updateStaffSchema,
  staffIdSchema,
  createCategorySchema,
  updateCategorySchema,
  categoryIdSchema,
  workingHoursSchema,
  createHolidaySchema,
  holidayIdSchema,
  availabilitySchema,
  selfAvailabilitySchema,
  selfAvailabilityReadSchema,
  bookingRulesSchema,
  createPricingRuleSchema,
  updatePricingRuleSchema,
  pricingRuleIdSchema,
};
