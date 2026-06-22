import { z } from 'zod';
import { ATTENDANCE_CORRECTION_TYPES } from '../constants/index.js';
import { objectId, paginationQuerySchema } from './commonValidator.js';

export const correctionIdParamsSchema = z.object({
  correctionId: objectId
});

export const createCorrectionSchema = z
  .object({
    attendance: objectId.optional(),
    date: z.coerce.date(),
    correctionType: z.enum(Object.values(ATTENDANCE_CORRECTION_TYPES)),
    requestedPunchIn: z.coerce.date().optional(),
    requestedPunchOut: z.coerce.date().optional(),
    reason: z.string().trim().min(5).max(1000)
  })
  .superRefine((data, ctx) => {
    if (
      [ATTENDANCE_CORRECTION_TYPES.PUNCH_IN, ATTENDANCE_CORRECTION_TYPES.BOTH].includes(
        data.correctionType
      ) &&
      !data.requestedPunchIn
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['requestedPunchIn'],
        message: 'requestedPunchIn is required for this correction type'
      });
    }

    if (
      [ATTENDANCE_CORRECTION_TYPES.PUNCH_OUT, ATTENDANCE_CORRECTION_TYPES.BOTH].includes(
        data.correctionType
      ) &&
      !data.requestedPunchOut
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['requestedPunchOut'],
        message: 'requestedPunchOut is required for this correction type'
      });
    }
  });

export const reviewCorrectionSchema = z.object({
  reviewRemarks: z.string().trim().max(1000).optional()
});

export const correctionQuerySchema = paginationQuerySchema.extend({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']).optional(),
  employeeId: objectId.optional()
});
