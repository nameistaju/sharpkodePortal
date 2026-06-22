import { Router } from 'express';
import * as correctionController from '../controllers/correctionController.js';
import { ROLES } from '../constants/index.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { validate } from '../middleware/validate.js';
import { writeLimiter } from '../middleware/rateLimiters.js';
import {
  correctionIdParamsSchema,
  correctionQuerySchema,
  createCorrectionSchema,
  reviewCorrectionSchema
} from '../validators/correctionValidator.js';

const router = Router();

router.use(protect);

router
  .route('/')
  .post(writeLimiter, validate({ body: createCorrectionSchema }), correctionController.createRequest)
  .get(validate({ query: correctionQuerySchema }), correctionController.history);

router.post(
  '/:correctionId/approve',
  authorizeRoles(ROLES.ADMIN),
  writeLimiter,
  validate({ params: correctionIdParamsSchema, body: reviewCorrectionSchema }),
  correctionController.approve
);
router.post(
  '/:correctionId/reject',
  authorizeRoles(ROLES.ADMIN),
  writeLimiter,
  validate({ params: correctionIdParamsSchema, body: reviewCorrectionSchema }),
  correctionController.reject
);

export default router;
