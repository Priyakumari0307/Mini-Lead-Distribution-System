import { prisma } from '../lib/prisma';
import { Provider, Lead, AllocationType } from '@prisma/client';

export class AllocationEngine {
  private static MAX_RETRIES = 15;

  /**
   * Attempts to allocate a lead to exactly 3 matching providers with write-conflict retries.
   */
  public static async allocateLead(leadId: string): Promise<{ success: boolean; providers: Provider[]; reason: string }> {
    let attempt = 0;

    while (attempt < this.MAX_RETRIES) {
      try {
        return await prisma.$transaction(async (tx) => {
          // 1. Fetch the lead
          const lead = await tx.lead.findUnique({ where: { id: leadId } });
          if (!lead) {
            return { success: false, providers: [], reason: 'Lead not found' };
          }

          if (lead.status !== 'PENDING') {
            return { success: false, providers: [], reason: `Lead is already in status ${lead.status}` };
          }

          // 2. Identify rules for Service 1, 2, or 3
          let mandatoryProviderNames: string[] = [];
          let poolProviderNames: string[] = [];
          const cat = lead.category ? lead.category.trim() : '';

          if (cat === 'Service 1') {
            mandatoryProviderNames = ['Provider 1'];
            poolProviderNames = ['Provider 2', 'Provider 3', 'Provider 4'];
          } else if (cat === 'Service 2') {
            mandatoryProviderNames = ['Provider 5'];
            poolProviderNames = ['Provider 6', 'Provider 7', 'Provider 8'];
          } else if (cat === 'Service 3') {
            mandatoryProviderNames = ['Provider 1', 'Provider 4'];
            poolProviderNames = ['Provider 2', 'Provider 3', 'Provider 5', 'Provider 6', 'Provider 7', 'Provider 8'];
          } else {
            // Fallback for generic categories (e.g. testing with random categories)
            // Let's grab all active providers and treat them as pool
            const activeProvs = await tx.provider.findMany({ where: { isActive: true } });
            const eligible = activeProvs.filter(p => p.allocatedThisMonth < p.monthlyQuota);
            const sortedPool = [...eligible].sort((a, b) => {
              if (a.allocatedThisMonth !== b.allocatedThisMonth) {
                return a.allocatedThisMonth - b.allocatedThisMonth;
              }
              const timeA = a.lastAllocatedAt ? new Date(a.lastAllocatedAt).getTime() : 0;
              const timeB = b.lastAllocatedAt ? new Date(b.lastAllocatedAt).getTime() : 0;
              if (timeA !== timeB) {
                return timeA - timeB;
              }
              return a.name.localeCompare(b.name);
            });
            
            const selected = sortedPool.slice(0, 3);
            if (selected.length < 3) {
              await tx.allocationLog.create({
                data: {
                  leadId: lead.id,
                  allocationType: 'AUTO',
                  reason: `Failed to allocate: found only ${selected.length} active providers for general category: ${lead.category}`,
                },
              });
              return { success: false, providers: [], reason: 'Insufficient eligible providers available' };
            }

            const updatedProviders: Provider[] = [];
            for (const p of selected) {
              const updated = await tx.provider.update({
                where: { id: p.id },
                data: {
                  allocatedThisMonth: { increment: 1 },
                  lastAllocatedAt: new Date(),
                },
              });
              updatedProviders.push(updated);
            }

            await tx.lead.update({
              where: { id: lead.id },
              data: {
                status: 'ALLOCATED',
                providers: { connect: selected.map(p => ({ id: p.id })) }
              }
            });

            for (const p of selected) {
              await tx.allocationLog.create({
                data: {
                  leadId: lead.id,
                  providerId: p.id,
                  allocationType: 'AUTO',
                  reason: `Allocated to ${p.name} (General Pool, Monthly: ${p.allocatedThisMonth + 1}/10)`,
                },
              });
            }

            return { success: true, providers: updatedProviders, reason: 'Successfully allocated' };
          }

          // Fetch all mandatory and pool providers matching the list
          const targetNames = [...mandatoryProviderNames, ...poolProviderNames];
          const providers = await tx.provider.findMany({
            where: {
              isActive: true,
              name: { in: targetNames }
            }
          });

          // Filter by quota left
          const eligibleProviders = providers.filter(p => p.allocatedThisMonth < p.monthlyQuota);

          const selectedProviders: Provider[] = [];

          // 1. Assign mandatory providers if they are active and have quota left
          for (const mName of mandatoryProviderNames) {
            const mp = eligibleProviders.find(p => p.name === mName);
            if (mp) {
              selectedProviders.push(mp);
            } else {
              await tx.allocationLog.create({
                data: {
                  leadId: lead.id,
                  allocationType: 'AUTO',
                  reason: `Failed to allocate: Mandatory provider ${mName} is not eligible (quota exhausted or inactive)`,
                },
              });
              return { success: false, providers: [], reason: `Mandatory provider ${mName} is not available` };
            }
          }

          // 2. Select remaining providers from the pool to reach exactly 3
          const remainingNeeded = 3 - selectedProviders.length;
          if (remainingNeeded > 0) {
            const selectedIds = new Set(selectedProviders.map(p => p.id));
            const poolEligible = eligibleProviders.filter(
              p => poolProviderNames.includes(p.name) && !selectedIds.has(p.id)
            );

            // Sort pool providers fairly: least allocated, then oldest lastAllocatedAt, then name tie-breaker
            const sortedPool = [...poolEligible].sort((a, b) => {
              if (a.allocatedThisMonth !== b.allocatedThisMonth) {
                return a.allocatedThisMonth - b.allocatedThisMonth;
              }
              const timeA = a.lastAllocatedAt ? new Date(a.lastAllocatedAt).getTime() : 0;
              const timeB = b.lastAllocatedAt ? new Date(b.lastAllocatedAt).getTime() : 0;
              if (timeA !== timeB) {
                return timeA - timeB;
              }
              return a.name.localeCompare(b.name);
            });

            const poolSelected = sortedPool.slice(0, remainingNeeded);
            selectedProviders.push(...poolSelected);
          }

          // Abort transaction if we cannot assign exactly 3 providers
          if (selectedProviders.length < 3) {
            await tx.allocationLog.create({
              data: {
                leadId: lead.id,
                allocationType: 'AUTO',
                reason: `Failed to allocate exactly 3 providers. Found only ${selectedProviders.length} eligible providers matching category ${lead.category}`,
              },
            });
            return { success: false, providers: [], reason: 'Insufficient eligible providers available' };
          }

          // 3. Update the 3 selected providers' allocations count and lastAllocatedAt
          const updatedProviders: Provider[] = [];
          for (const p of selectedProviders) {
            const updated = await tx.provider.update({
              where: { id: p.id },
              data: {
                allocatedThisMonth: { increment: 1 },
                lastAllocatedAt: new Date(),
              },
            });
            updatedProviders.push(updated);
          }

          // 4. Update the lead status and connect relations
          await tx.lead.update({
            where: { id: lead.id },
            data: {
              status: 'ALLOCATED',
              providers: {
                connect: selectedProviders.map(p => ({ id: p.id }))
              }
            }
          });

          // 5. Log the allocation for each assigned provider
          for (const p of selectedProviders) {
            await tx.allocationLog.create({
              data: {
                leadId: lead.id,
                providerId: p.id,
                allocationType: 'AUTO',
                reason: `Allocated to ${p.name} (Category: ${lead.category}, Monthly: ${p.allocatedThisMonth + 1}/10)`,
              },
            });
          }

          return { success: true, providers: updatedProviders, reason: 'Successfully allocated to 3 providers' };
        }, {
          timeout: 20000
        });
      } catch (error: any) {
        const isWriteConflict =
          error.code === 'P2034' ||
          (error.message && (error.message.includes('WriteConflict') || error.message.includes('TransientTransactionError')));

        if (isWriteConflict) {
          attempt++;
          console.warn(`Write conflict detected during lead allocation transaction (attempt ${attempt}/${this.MAX_RETRIES}). Retrying...`);
          const delay = Math.random() * 150 + 100 * attempt;
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          console.error('Fatal database error during lead allocation:', error);
          throw error;
        }
      }
    }

    console.error(`Failed to allocate lead ${leadId} after ${this.MAX_RETRIES} attempts due to write conflicts.`);
    return { success: false, providers: [], reason: 'Transaction conflict timeout' };
  }

  /**
   * Manually reassign a lead to a specific provider, bypassing category constraints but checking quotas.
   */
  public static async reassignLead(leadId: string, providerId: string, reason: string): Promise<Lead> {
    return await prisma.$transaction(async (tx) => {
      const lead = await tx.lead.findUnique({
        where: { id: leadId },
        include: { providers: true }
      });
      if (!lead) {
        throw new Error('Lead not found');
      }

      const provider = await tx.provider.findUnique({ where: { id: providerId } });
      if (!provider) {
        throw new Error('Provider not found');
      }

      if (!provider.isActive) {
        throw new Error('Target provider is inactive');
      }

      if (provider.allocatedThisMonth >= provider.monthlyQuota) {
        throw new Error('Target provider monthly quota exceeded');
      }

      // 1. Decrement all currently assigned providers
      for (const oldP of lead.providers) {
        await tx.provider.update({
          where: { id: oldP.id },
          data: {
            allocatedThisMonth: { decrement: 1 },
          },
        });
      }

      // 2. Increment new provider
      await tx.provider.update({
        where: { id: provider.id },
        data: {
          allocatedThisMonth: { increment: 1 },
          lastAllocatedAt: new Date(),
        },
      });

      // 3. Update lead providers connection (replace completely for override)
      const updatedLead = await tx.lead.update({
        where: { id: lead.id },
        data: {
          status: 'ALLOCATED',
          providers: {
            set: [{ id: provider.id }]
          }
        },
        include: { providers: true }
      });

      // 4. Create Allocation Log
      await tx.allocationLog.create({
        data: {
          leadId: lead.id,
          providerId: provider.id,
          allocationType: 'MANUAL',
          reason: reason || `Manually reassigned to ${provider.name}.`,
        },
      });

      return updatedLead;
    }, {
      timeout: 20000
    });
  }
}
