import { Router } from 'express';
import authRoutes from './auth.routes';
import leadRoutes from './lead.routes';
import providerRoutes from './provider.routes';
import quotaRoutes from './quota.routes';
import logRoutes from './log.routes';
import duplicateRoutes from './duplicate.routes';
import reportRoutes from './report.routes';
import testingRoutes from './testing.routes';
import webhookRoutes from './webhook.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/leads', leadRoutes);
router.use('/providers', providerRoutes);
router.use('/quotas', quotaRoutes);
router.use('/logs', logRoutes);
router.use('/duplicates', duplicateRoutes);
router.use('/reports', reportRoutes);
router.use('/testing', testingRoutes);
router.use('/webhooks', webhookRoutes);

export default router;
