import { z } from "zod";

const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().email().max(191),
    password: z.string().min(1).max(128)
  }),
  params: z.any(),
  query: z.any()
});

const registrationSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().toLowerCase().email().max(191),
    phone: z.string().trim().regex(/^\+?[0-9]{7,15}$/).optional(),
    password: z.string().min(8).max(128)
  }),
  params: z.any(),
  query: z.any()
});

export { loginSchema, registrationSchema };
