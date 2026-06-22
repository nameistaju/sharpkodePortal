import { z } from 'zod';
import { ACTIVITY_TYPES } from '../constants/index.js';
import { objectId, paginationQuerySchema } from './commonValidator.js';

export const activityIdParamsSchema = z.object({
  activityId: objectId
});

export const clientTimelineParamsSchema = z.object({
  clientId: objectId
});

export const createActivitySchema = z.object({
  client: objectId,
  activityType: z.enum(Object.values(ACTIVITY_TYPES)),
  description: z.string().trim().min(3).max(2000),
  driveLink: z.string().trim().url().optional()
});

export const activityQuerySchema = paginationQuerySchema.extend({
  clientId: objectId.optional(),
  employeeId: objectId.optional(),
  activityType: z.enum(Object.values(ACTIVITY_TYPES)).optional()
});
