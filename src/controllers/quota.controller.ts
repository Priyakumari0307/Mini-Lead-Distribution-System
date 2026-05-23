import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
type Provider = Awaited<ReturnType<typeof prisma.provider.findMany>>[number];

export class QuotaController {
  /**
   * Return monthly quota usage statistics
   */
  public static async getQuotas(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const providers = await prisma.provider.findMany({
        orderBy: { name: 'asc' },
      });

      const quotaData = providers.map((p: Provider) => {
        const monthlyQuota = p.monthlyQuota ?? 10;
        const allocatedThisMonth = p.allocatedThisMonth ?? 0;
        const remaining = Math.max(0, monthlyQuota - allocatedThisMonth);
        const utilizationPercent = monthlyQuota > 0
          ? parseFloat(((allocatedThisMonth / monthlyQuota) * 100).toFixed(2))
          : 0;

        return {
          providerId: p.id,
          providerName: p.name,
          category: p.category,
          monthlyQuota,
          allocatedThisMonth,
          remainingQuota: remaining,
          utilizationPercent,
          isActive: p.isActive ?? true,
        };
      });

      res.status(200).json({
        success: true,
        data: quotaData,
      });
    } catch (error) {
      next(error);
    }
  }
}
