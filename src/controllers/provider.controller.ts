import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { NotFoundError } from '../utils/errors';
import { emitProviderUpdated } from '../sockets/socket';

export class ProviderController {
  /**
   * Get all providers
   */
  public static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { category, isActive } = req.query;
      const filter: any = {};

      if (category) {
        filter.category = String(category);
      }
      if (isActive !== undefined) {
        filter.isActive = isActive === 'true';
      }

      const providers = await prisma.provider.findMany({
        where: filter,
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json({
        success: true,
        data: providers,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a provider by ID
   */
  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const provider = await prisma.provider.findUnique({ where: { id } });

      if (!provider) {
        throw new NotFoundError('Provider not found');
      }

      res.status(200).json({
        success: true,
        data: provider,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new provider
   */
  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const provider = await prisma.provider.create({
        data: req.body,
      });

      res.status(201).json({
        success: true,
        message: 'Provider created successfully',
        data: provider,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update an existing provider
   */
  public static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const existing = await prisma.provider.findUnique({ where: { id } });

      if (!existing) {
        throw new NotFoundError('Provider not found');
      }

      const updated = await prisma.provider.update({
        where: { id },
        data: req.body,
      });

      emitProviderUpdated(updated);

      res.status(200).json({
        success: true,
        message: 'Provider updated successfully',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a provider
   */
  public static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const existing = await prisma.provider.findUnique({ where: { id } });

      if (!existing) {
        throw new NotFoundError('Provider not found');
      }

      await prisma.provider.delete({ where: { id } });

      res.status(200).json({
        success: true,
        message: 'Provider deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
