import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { LeadService } from '../services/lead.service';
import { AllocationEngine } from '../services/allocation.service';
import { NotFoundError } from '../utils/errors';

export class LeadController {
  /**
   * Helper to build filter query for prisma from request parameters
   */
  private static buildFilter(query: any): any {
    const { search, category, status, startDate, endDate } = query;
    const filter: any = {};

    if (category) {
      filter.category = String(category);
    }
    if (status) {
      filter.status = String(status);
    }

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        const start = new Date(String(startDate));
        if (!isNaN(start.getTime())) {
          filter.createdAt.gte = start;
        }
      }
      if (endDate) {
        const end = new Date(String(endDate));
        if (!isNaN(end.getTime())) {
          filter.createdAt.lte = end;
        }
      }
      if (Object.keys(filter.createdAt).length === 0) {
        delete filter.createdAt;
      }
    }

    // Search filter across customerName, email, phone, description
    if (search) {
      filter.OR = [
        { customerName: { contains: String(search), mode: 'insensitive' } },
        { email: { contains: String(search), mode: 'insensitive' } },
        { phone: { contains: String(search), mode: 'insensitive' } },
        { description: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    return filter;
  }

  /**
   * Get paginated, filtered leads
   */
  public static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 10;
      
      const allowedSortFields = ['createdAt', 'leadNumber', 'customerName', 'email', 'phone', 'category', 'location', 'status'];
      const sortByInput = req.query.sortBy ? String(req.query.sortBy) : 'createdAt';
      const sortBy = allowedSortFields.includes(sortByInput) ? sortByInput : 'createdAt';
      
      const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc';

      const filter = LeadController.buildFilter(req.query);

      const skip = (page - 1) * limit;

      const [leads, total] = await Promise.all([
        prisma.lead.findMany({
          where: filter,
          include: { providers: true },
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit,
        }),
        prisma.lead.count({ where: filter }),
      ]);

      const mappedLeads = leads.map((l) => ({
        ...l,
        assignedProviderId: l.providerIds[0] || null,
        assignedProviderName: l.providers?.[0]?.name || null,
      }));

      res.status(200).json({
        success: true,
        data: {
          leads: mappedLeads,
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

  /**
   * Get single lead by ID
   */
  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const lead = await prisma.lead.findUnique({
        where: { id },
        include: {
          providers: true,
          allocationLogs: { orderBy: { createdAt: 'desc' } },
          duplicateRelations: { include: { duplicateOfLead: true } },
        },
      });

      if (!lead) {
        throw new NotFoundError('Lead not found');
      }

      const mappedLead = {
        ...lead,
        assignedProviderId: lead.providerIds[0] || null,
        assignedProviderName: lead.providers?.[0]?.name || null,
      };

      res.status(200).json({
        success: true,
        data: mappedLead,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create lead & trigger auto-allocation
   */
  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const lead = await LeadService.createLead(req.body);
      
      // Map for compatibility in response
      const leadWithProviders = await prisma.lead.findUnique({
        where: { id: lead.id },
        include: { providers: true }
      });
      const mappedLead = leadWithProviders ? {
        ...leadWithProviders,
        assignedProviderId: leadWithProviders.providerIds[0] || null,
        assignedProviderName: leadWithProviders.providers?.[0]?.name || null,
      } : lead;

      res.status(201).json({
        success: true,
        message: 'Lead received and processed successfully',
        data: mappedLead,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Manual Reassign Lead
   */
  public static async reassign(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const { providerId, reason } = req.body;

      const lead = await AllocationEngine.reassignLead(id, providerId, reason);

      const leadWithProviders = await prisma.lead.findUnique({
        where: { id: lead.id },
        include: { providers: true }
      });
      const mappedLead = leadWithProviders ? {
        ...leadWithProviders,
        assignedProviderId: leadWithProviders.providerIds[0] || null,
        assignedProviderName: leadWithProviders.providers?.[0]?.name || null,
      } : lead;

      res.status(200).json({
        success: true,
        message: 'Lead manually reassigned successfully',
        data: mappedLead,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete Lead
   */
  public static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const existing = await prisma.lead.findUnique({ where: { id } });

      if (!existing) {
        throw new NotFoundError('Lead not found');
      }

      // If allocated, decrement allocated count for all connected providers
      if (existing.status === 'ALLOCATED' && existing.providerIds && existing.providerIds.length > 0) {
        for (const pId of existing.providerIds) {
          await prisma.provider.update({
            where: { id: pId },
            data: {
              allocatedThisMonth: { decrement: 1 },
            },
          });
        }
      }

      await prisma.lead.delete({ where: { id } });

      res.status(200).json({
        success: true,
        message: 'Lead deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Export Leads as CSV
   */
  public static async exportCsv(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const allowedSortFields = ['createdAt', 'leadNumber', 'customerName', 'email', 'phone', 'category', 'location', 'status'];
      const sortByInput = req.query.sortBy ? String(req.query.sortBy) : 'createdAt';
      const sortBy = allowedSortFields.includes(sortByInput) ? sortByInput : 'createdAt';
      const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc';

      const filter = LeadController.buildFilter(req.query);

      const leads = await prisma.lead.findMany({
        where: filter,
        include: { providers: true },
        orderBy: { [sortBy]: sortOrder },
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=leads.csv');

      const csvHeader = 'ID,Lead Number,Customer Name,Email,Phone,Category,Location,Description,Status,Assigned Provider,Created At\n';
      
      const escapeCsv = (str: string) => `"${(str || '').replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`;

      const csvRows = leads
        .map((l) => {
          const providerName = l.providers && l.providers.length > 0
            ? l.providers.map((p) => p.name).join(', ')
            : 'None';
          return `${l.id},${l.leadNumber},${escapeCsv(l.customerName)},${escapeCsv(l.email)},${escapeCsv(l.phone)},${escapeCsv(l.category)},${escapeCsv(l.location)},${escapeCsv(l.description)},${l.status},${escapeCsv(providerName)},${l.createdAt.toISOString()}`;
        })
        .join('\n');

      res.write(csvHeader + csvRows);
      res.end();
    } catch (error) {
      next(error);
    }
  }
}
