import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

export class ReportController {
  /**
   * Return high level dashboard overview stats
   */
  public static async getOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // 1. Get total lead count
      const totalLeads = await prisma.lead.count();

      // 2. Get leads count grouped by status
      const statusCounts = await prisma.lead.groupBy({
        by: ['status'],
        _count: { id: true },
      });

      const counts: Record<string, number> = {
        PENDING: 0,
        ALLOCATED: 0,
        DUPLICATE: 0,
        REJECTED: 0,
      };

      statusCounts.forEach((sc) => {
        counts[sc.status] = sc._count.id;
      });

      // 3. Get provider performance stats
      const providers = await prisma.provider.findMany({
        orderBy: { allocatedThisMonth: 'desc' },
      });

      const providerStats = providers.map((p) => {
        const remaining = Math.max(0, p.monthlyQuota - p.allocatedThisMonth);
        const utilizationPercent = p.monthlyQuota > 0
          ? parseFloat(((p.allocatedThisMonth / p.monthlyQuota) * 100).toFixed(2))
          : 0;

        return {
          id: p.id,
          name: p.name,
          category: p.category,
          monthlyQuota: p.monthlyQuota,
          allocatedThisMonth: p.allocatedThisMonth,
          remainingQuota: remaining,
          utilizationPercent,
          isActive: p.isActive,
        };
      });

      res.status(200).json({
        success: true,
        data: {
          totalLeads,
          statusDistribution: counts,
          providerPerformance: providerStats,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
