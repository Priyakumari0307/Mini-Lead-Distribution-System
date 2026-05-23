import { prisma } from '../lib/prisma';
import { Lead, LeadStatus, Provider } from '@prisma/client';
import { AllocationEngine } from './allocation.service';
import { WebhookService } from './webhook.service';
import { ConflictError } from '../utils/errors';
import { config } from '../config';
import {
  emitLeadCreated,
  emitLeadAllocated,
  emitProviderUpdated,
  emitDuplicateDetected,
  emitQuotaWarning,
} from '../sockets/socket';

export class LeadService {
  private static queue: Promise<any> = Promise.resolve();

  /**
   * Submits a customer lead, checks for duplicates, and executes auto-allocation.
   * Serialized via a queue to prevent concurrent MongoDB transaction conflicts.
   */
  public static async createLead(data: {
    customerName: string;
    phone: string;
    email: string;
    category: string;
    location: string;
    description: string;
  }): Promise<Lead> {
    return new Promise((resolve, reject) => {
      this.queue = this.queue
        .then(async () => {
          try {
            const result = await this.executeCreateLead(data);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        })
        .catch(() => {});
    });
  }

  private static async executeCreateLead(data: {
    customerName: string;
    phone: string;
    email: string;
    category: string;
    location: string;
    description: string;
  }): Promise<Lead> {
    // 1. Check for duplicates (same phone and category within past window)
    const duplicateWindowLimit = new Date();
    duplicateWindowLimit.setHours(duplicateWindowLimit.getHours() - config.duplicateWindowHours);

    // Search for a non-duplicate matching lead
    const originalLead = await prisma.lead.findFirst({
      where: {
        phone: data.phone,
        category: data.category,
        status: { in: ['PENDING', 'ALLOCATED'] }, // match valid original submissions
        createdAt: { gte: duplicateWindowLimit },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 2. Generate leadNumber and save lead with write-conflict retry loop
    let attempt = 0;
    const MAX_RETRIES = 15;
    let result: { lead: Lead; isDuplicate: boolean; originalId: string | null } | null = null;

    while (attempt < MAX_RETRIES) {
      try {
        result = await prisma.$transaction(async (tx) => {
          // Get next sequence number
          const counter = await tx.counter.upsert({
            where: { name: 'leadNumber' },
            update: { value: { increment: 1 } },
            create: { name: 'leadNumber', value: 1001 },
          });

          const nextNum = counter.value;

          if (originalLead) {
            throw new ConflictError(`Duplicate submission: you have already submitted a request for service '${data.category}' using the phone number ${data.phone}.`);
          } else {
            // Create fresh lead
            const newLead = await tx.lead.create({
              data: {
                ...data,
                leadNumber: nextNum,
                status: 'PENDING',
              },
            });

            return { lead: newLead, isDuplicate: false, originalId: null };
          }
        }, {
          timeout: 20000
        });
        break; // Success, break out of loop
      } catch (error: any) {
        if (error.code === 'P2002') {
          throw new ConflictError(`Duplicate submission: you have already submitted a request for service '${data.category}' using the phone number ${data.phone}.`);
        }

        const isWriteConflict =
          error.code === 'P2034' ||
          (error.message && (error.message.includes('WriteConflict') || error.message.includes('TransientTransactionError')));

        if (isWriteConflict) {
          attempt++;
          console.warn(`Write conflict on leadNumber generation (attempt ${attempt}/${MAX_RETRIES}). Retrying...`);
          const delay = Math.random() * 150 + 100 * attempt;
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          console.error('Fatal database error during lead creation transaction:', error);
          throw error;
        }
      }
    }

    if (!result) {
      throw new Error(`Failed to generate lead number due to concurrent transaction conflict after ${MAX_RETRIES} attempts.`);
    }

    const { lead, isDuplicate, originalId } = result;

    // Emit live event for lead creation
    emitLeadCreated(lead);

    if (isDuplicate && originalId) {
      const duplicateDetails = await prisma.duplicateLead.findFirst({
        where: { leadId: lead.id }
      });
      emitDuplicateDetected({
        lead,
        originalLeadId: originalId,
        reason: duplicateDetails?.reason || 'Duplicate submission',
      });
      return lead;
    }    // 3. Trigger Allocation Engine for PENDING lead
    const allocation = await AllocationEngine.allocateLead(lead.id);

    if (allocation.success && allocation.providers && allocation.providers.length > 0) {
      const allocatedLead = await prisma.lead.findUnique({
        where: { id: lead.id },
        include: { providers: true },
      });

      if (allocatedLead) {
        // Prepare compatible payload for socket notifications
        const compatLead = {
          ...allocatedLead,
          assignedProviderId: allocatedLead.providerIds[0] || null,
          assignedProviderName: allocatedLead.providers?.[0]?.name || null
        };

        // Emit Socket.io notifications
        emitLeadAllocated(compatLead);

        for (const provider of allocation.providers) {
          emitProviderUpdated(provider);

          // Check if provider is near quota and trigger warnings
          const utilization = (provider.allocatedThisMonth / provider.monthlyQuota) * 100;
          if (utilization >= 80) {
            emitQuotaWarning({ provider, utilizationPercent: utilization });
          }

          // Trigger webhook dispatch asynchronously
          WebhookService.triggerWebhook(provider.id, lead.id);
        }

        return allocatedLead;
      }
    }

    // If allocation failed or provider not found, return lead in current status
    return lead;
  }
}
