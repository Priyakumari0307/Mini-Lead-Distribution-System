import { Router } from 'express';
import { LogController } from '../controllers/log.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, LogController.getAll);

export default router;
