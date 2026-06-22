import { z } from 'zod';
import { DEPARTMENTS, EMPLOYEE_STATUS, ROLES } from '../constants/index.js';
import { objectId, paginationQuerySchema } from './commonValidator.js';

const profilePhotoSchema = z
  .object({
    url: z.string().url().optional(),
    publicId: z.string().trim().optional()
  })
  .optional();

export const employeeIdParamsSchema = z.object({
  employeeId: objectId
});

export const employeeQuerySchema = paginationQuerySchema.extend({
  department: z.enum(Object.values(DEPARTMENTS)).optional(),
  status: z.enum(Object.values(EMPLOYEE_STATUS)).optional(),
  role: z.enum(Object.values(ROLES)).optional()
});

export const createEmployeeSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(7).max(20),
  email: z.string().trim().toLowerCase().email(),
  department: z.enum(Object.values(DEPARTMENTS)),
  dob: z.coerce.date(),
  joinDate: z.coerce.date().optional(),
  role: z.enum(Object.values(ROLES)).default(ROLES.EMPLOYEE),
  status: z.enum(Object.values(EMPLOYEE_STATUS)).optional(),
  profilePhoto: profilePhotoSchema,
  assignedClients: z.array(objectId).optional()
});

export const updateEmployeeSchema = createEmployeeSchema
  .partial()
  .omit({ email: true })
  .extend({
    assignedClients: z.array(objectId).optional()
  });

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  phone: z.string().trim().min(7).max(20).optional(),
  profilePhoto: profilePhotoSchema
});
