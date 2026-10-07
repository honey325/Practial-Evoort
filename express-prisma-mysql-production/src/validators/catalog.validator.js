import { z } from "zod";

const empty = z.any();
const listCatalogSchema = z.object({
  body: empty,
  params: empty,
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(100).optional(),
    categoryId: z.coerce.number().int().positive().optional(),
    city: z.string().trim().max(100).optional()
  })
});
const businessIdSchema = z.object({ body: empty, params: z.object({ businessId: z.coerce.number().int().positive() }), query: empty });

export { listCatalogSchema, businessIdSchema };
