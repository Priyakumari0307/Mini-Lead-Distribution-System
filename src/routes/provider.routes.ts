import { Router } from 'express';
import { ProviderController } from '../controllers/provider.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { CreateProviderSchema, UpdateProviderSchema } from '../validations';

const router = Router();

// Retrieve operations allowed for authenticated users (ADMIN and SALES)
router.get('/', authenticate, ProviderController.getAll);
router.get('/:id', authenticate, ProviderController.getById);

// Admin-only management operations
router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  validateBody(CreateProviderSchema),
  ProviderController.create
);

router.patch(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validateBody(UpdateProviderSchema),
  ProviderController.update
);

router.delete('/:id', authenticate, authorize('ADMIN'), ProviderController.delete);

export default router;
