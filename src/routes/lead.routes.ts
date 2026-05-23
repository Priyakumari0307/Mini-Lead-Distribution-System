import { Router } from 'express';
import { LeadController } from '../controllers/lead.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateBody, validateQuery } from '../middleware/validation.middleware';
import { CreateLeadSchema, ReassignLeadSchema, QueryLeadSchema } from '../validations';

const router = Router();

// Public lead submission endpoint - no authentication required
router.post('/', validateBody(CreateLeadSchema), LeadController.create);

// Protected operations (ADMIN and SALES)
router.get('/', authenticate, validateQuery(QueryLeadSchema), LeadController.getAll);
router.get('/export', authenticate, validateQuery(QueryLeadSchema), LeadController.exportCsv);
router.get('/:id', authenticate, LeadController.getById);

router.patch(
  '/:id/reassign',
  authenticate,
  authorize('ADMIN', 'SALES'),
  validateBody(ReassignLeadSchema),
  LeadController.reassign
);

// Admin-only deletion
router.delete('/:id', authenticate, authorize('ADMIN'), LeadController.delete);

export default router;
