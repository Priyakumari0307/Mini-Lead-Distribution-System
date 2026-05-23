import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { LeadService } from '../services/lead.service';

export class TestingController {
  /**
   * Generates mock leads sequentially
   */
  public static async generateLeads(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const count = req.body.count ? parseInt(req.body.count, 10) : 5;
      const category = req.body.category || 'Plumbing';
      const createdLeads = [];

      for (let i = 0; i < count; i++) {
        const leadIndex = i + 1;
        const mockLeadData = {
          customerName: `Mock Customer ${leadIndex}-${Math.floor(Math.random() * 1000)}`,
          phone: `555010${Math.floor(1000 + Math.random() * 9000)}`,
          email: `mockcustomer${leadIndex}_${Math.floor(Math.random() * 1000)}@test.com`,
          category,
          location: 'San Francisco, CA',
          description: `This is a mock request for service number ${leadIndex}`,
        };

        const lead = await LeadService.createLead(mockLeadData);
        createdLeads.push(lead);
      }

      res.status(201).json({
        success: true,
        message: `Successfully generated and processed ${count} mock leads.`,
        data: createdLeads,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Simulates concurrent lead submissions
   */
  public static async simulateConcurrentAllocation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const count = req.body.count ? parseInt(req.body.count, 10) : 5;
      const category = req.body.category || 'Electrical';

      // Assemble mock payload
      const requests = Array.from({ length: count }).map((_, i) => {
        const leadIndex = i + 1;
        return LeadService.createLead({
          customerName: `Concurrent Customer ${leadIndex}`,
          phone: `555909000${leadIndex}`, // unique phones to avoid duplicate block
          email: `concurrent${leadIndex}@test.com`,
          category,
          location: 'Chicago, IL',
          description: `Simulation of parallel request number ${leadIndex}`,
        });
      });

      // Execute all lead submissions simultaneously using Promise.all
      const results = await Promise.allSettled(requests);

      const resolved = results
        .filter((r) => r.status === 'fulfilled')
        .map((r: any) => r.value);

      const rejected = results
        .filter((r) => r.status === 'rejected')
        .map((r: any) => r.reason.message || r.reason);

      res.status(200).json({
        success: true,
        message: `Executed ${count} concurrent lead allocations.`,
        data: {
          successfulSubmissions: resolved.length,
          failedSubmissions: rejected.length,
          leads: resolved,
          errors: rejected,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset all providers monthly allocations to 0
   */
  public static async resetQuotas(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await prisma.provider.updateMany({
        data: {
          allocatedThisMonth: 0,
        },
      });

      res.status(200).json({
        success: true,
        message: 'Successfully reset monthly quota allocations for all providers.',
      });
    } catch (error) {
      next(error);
    }
  }
}
