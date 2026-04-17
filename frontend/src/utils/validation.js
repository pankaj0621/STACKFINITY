import { z } from "zod";

// This defines exactly what "good" data looks like
export const financialSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  industry: z.string(),
  revenue: z.coerce.number().min(0, "Revenue cannot be negative"),
  totalAssets: z.coerce.number().gt(0, "Total Assets must be greater than zero"),
  netProfit: z.coerce.number(),
  totalLiabilities: z.coerce.number().min(0),
  currentAssets: z.coerce.number().min(0),
  currentLiabilities: z.coerce.number().gt(0, "Current Liabilities must be at least 1"),
});