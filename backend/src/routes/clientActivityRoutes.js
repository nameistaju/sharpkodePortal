import { Router } from 'express';
import * as activityController from '../controllers/clientActivityController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { writeLimiter } from '../middleware/rateLimiters.js';
import {
  activityQuerySchema,
  clientTimelineParamsSchema,
  createActivitySchema
} from '../validators/clientActivityValidator.js';

const router = Router();

router.use(protect);

router.post('/', writeLimiter, validate({ body: createActivitySchema }), activityController.create);
router.get('/feed', validate({ query: activityQuerySchema }), activityController.feed);
router.get(
  '/client/:clientId/timeline',
  validate({ params: clientTimelineParamsSchema, query: activityQuerySchema }),
  activityController.timeline
);

export default router;
