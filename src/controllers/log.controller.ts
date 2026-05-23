import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

export class LogController {
  /**
   * Get allocation logs history
   */
  public static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;
      const skip = (page - 1) * limit;

      const [logs, total] = await Promise.all([
        prisma.allocationLog.findMany({
          include: {
            lead: true,
            provider: true,
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.allocationLog.count(),
      ]);

      res.status(200).json({
        success: true,
        data: {
          logs,
          meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
