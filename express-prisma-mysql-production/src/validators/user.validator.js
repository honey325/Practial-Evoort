import { z } from "zod";

const idSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive()
  })
});

const createUserSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().toLowerCase().email().max(191),
    password: z.string().min(8).max(128),
    role: z.enum(["SUPER_ADMIN", "BUSINESS_OWNER", "STAFF", "CUSTOMER"]),
    phone: z.string().trim().regex(/^\+?[0-9]{7,15}$/).optional()
  }),
  params: z.any(),
  query: z.any()
});

const updateUserSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(2).max(100).optional(),
      email: z.string().trim().toLowerCase().email().max(191).optional()
    })
    .refine((body) => Object.keys(body).length > 0, {
      message: "At least one field is required"
    }),
  params: z.object({
    id: z.coerce.number().int().positive()
  }),
  query: z.any()
});

const listUserSchema = z.object({
  body: z.any(),
  params: z.any(),
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().trim().max(100).optional()
  })
});

export {
  idSchema,
  createUserSchema,
  updateUserSchema,
  listUserSchema
};
