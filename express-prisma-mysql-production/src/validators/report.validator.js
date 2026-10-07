import { z } from "zod";
const empty = z.any();
const reportQuery = z.object({ from: z.iso.date().optional(), to: z.iso.date().optional() }).refine((q) => !q.from || !q.to || q.from <= q.to, "from must be before or equal to to");
const adminReportSchema = z.object({ body: empty, params: empty, query: reportQuery });
const businessReportSchema = z.object({ body: empty, params: z.object({ businessId: z.coerce.number().int().positive() }), query: reportQuery });
export { adminReportSchema, businessReportSchema };
