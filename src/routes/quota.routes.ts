import { Router } from 'express';
import { QuotaController } from '../controllers/quota.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, QuotaController.getQuotas);

export default router;
