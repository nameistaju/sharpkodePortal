import { z } from 'zod';
import { objectId, paginationQuerySchema } from './commonValidator.js';

const coordinateSchema = z.object({
  latitude: z.any().optional(),
  longitude: z.any().optional(),
  notes: z.string().trim().max(500).optional()
});

export const attendanceSettingSchema = z.object({
  officeLatitude: z.coerce.number().min(-90).max(90),
  officeLongitude: z.coerce.number().min(-180).max(180),
  allowedRadiusMeters: z.coerce.number().int().min(1).max(5000)
});

export const punchSchema = coordinateSchema;

export const attendanceHistoryQuerySchema = paginationQuerySchema.extend({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  employeeId: objectId.optional()
});

export const monthlySummaryQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
  employeeId: objectId.optional()
});
