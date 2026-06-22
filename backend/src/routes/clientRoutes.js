import { Router } from 'express';
import * as clientController from '../controllers/clientController.js';
import { ROLES } from '../constants/index.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { validate } from '../middleware/validate.js';
import { writeLimiter } from '../middleware/rateLimiters.js';
import {
  clientIdParamsSchema,
  clientQuerySchema,
  clientSchema,
  updateClientSchema
} from '../validators/clientValidator.js';

const router = Router();

router.use(protect);

router
  .route('/')
  .get(validate({ query: clientQuerySchema }), clientController.list)
  .post(authorizeRoles(ROLES.ADMIN), writeLimiter, validate({ body: clientSchema }), clientController.create);

router
  .route('/:clientId')
  .get(validate({ params: clientIdParamsSchema }), clientController.getById)
  .patch(
    authorizeRoles(ROLES.ADMIN),
    writeLimiter,
    validate({ params: clientIdParamsSchema, body: updateClientSchema }),
    clientController.update
  )
  .delete(authorizeRoles(ROLES.ADMIN), writeLimiter, validate({ params: clientIdParamsSchema }), clientController.remove);

export default router;
