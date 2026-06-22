import { z } from 'zod';
import { VISIT_OUTCOMES } from '../constants/index.js';
import { objectId, paginationQuerySchema } from './commonValidator.js';

export const visitIdParamsSchema = z.object({
  visitId: objectId
});

const locationSchema = z.object({
  address: z.string().trim().max(500).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional()
});

export const createVisitSchema = z.object({
  client: objectId,
  visitDate: z.coerce.date(),
  meetingNotes: z.string().trim().min(5).max(3000),
  outcome: z.enum(Object.values(VISIT_OUTCOMES)),
  followUpDate: z.coerce.date().optional(),
  location: locationSchema.optional()
});

export const visitQuerySchema = paginationQuerySchema.extend({
  clientId: objectId.optional(),
  employeeId: objectId.optional(),
  outcome: z.enum(Object.values(VISIT_OUTCOMES)).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional()
});
