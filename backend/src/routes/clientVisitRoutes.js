import { Router } from 'express';
import * as visitController from '../controllers/clientVisitController.js';
import { ROLES } from '../constants/index.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { validate } from '../middleware/validate.js';
import { writeLimiter } from '../middleware/rateLimiters.js';
import { createVisitSchema, visitQuerySchema } from '../validators/clientVisitValidator.js';

const router = Router();

router.use(protect);

router
  .route('/')
  .post(writeLimiter, validate({ body: createVisitSchema }), visitController.create)
  .get(validate({ query: visitQuerySchema }), visitController.history);

router.get('/reports', authorizeRoles(ROLES.ADMIN), validate({ query: visitQuerySchema }), visitController.adminReports);

export default router;
