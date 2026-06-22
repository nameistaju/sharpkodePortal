import { z } from 'zod';
import { CLIENT_STATUS } from '../constants/index.js';
import { objectId, paginationQuerySchema } from './commonValidator.js';

export const clientIdParamsSchema = z.object({
  clientId: objectId
});

const contactPersonSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(30).optional(),
  email: z.string().trim().toLowerCase().email().optional(),
  designation: z.string().trim().max(120).optional()
});

export const clientSchema = z.object({
  clientName: z.string().trim().min(2).max(180),
  status: z.enum(Object.values(CLIENT_STATUS)).optional(),
  services: z.array(z.string().trim().min(1)).optional(),
  driveLink: z.string().trim().url().optional(),
  notes: z.string().trim().max(3000).optional(),
  contactPerson: contactPersonSchema.optional(),
  assignedEmployees: z.array(objectId).optional()
});

export const updateClientSchema = clientSchema.partial();

export const clientQuerySchema = paginationQuerySchema.extend({
  status: z.enum(Object.values(CLIENT_STATUS)).optional(),
  service: z.string().trim().optional(),
  assignedEmployee: objectId.optional()
});
