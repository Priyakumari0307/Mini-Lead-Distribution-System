import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

export class DuplicateController {
  /**
   * Get duplicate leads log
   */
  public static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;
      const skip = (page - 1) * limit;

      const [duplicates, total] = await Promise.all([
        prisma.duplicateLead.findMany({
          include: {
            lead: true,
            duplicateOfLead: true,
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.duplicateLead.count(),
      ]);

      res.status(200).json({
        success: true,
        data: {
          duplicates,
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
