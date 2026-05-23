import { Router } from 'express';
import { DuplicateController } from '../controllers/duplicate.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, DuplicateController.getAll);

export default router;
