import { Router } from 'express';
import { TestingController } from '../controllers/testing.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.post('/generate-leads', authenticate, authorize('ADMIN'), TestingController.generateLeads);
router.post('/concurrent-allocation', authenticate, authorize('ADMIN'), TestingController.simulateConcurrentAllocation);
router.post('/reset-quotas', authenticate, authorize('ADMIN'), TestingController.resetQuotas);

export default router;
